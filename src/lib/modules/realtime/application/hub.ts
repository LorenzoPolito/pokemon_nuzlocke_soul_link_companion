import { createUuidV7 } from '../domain/uuidv7';
import { frame, MAX_REPLAY, planRecovery, type ResetReason, type SseMessage } from '../domain/sse';

/** One row of a run's diary, as it is stored and sent. */
export type RunEvent = {
	id: string;
	runId: string;
	actorUserId: string | null;
	type: string;
	entity: string;
	entityId: string;
	payload: unknown;
	createdAt: number;
};

export type NewRunEvent = Omit<RunEvent, 'id' | 'createdAt'>;

/** Where the diary lives (the database in the app, memory in tests). */
export interface EventStore {
	append(event: RunEvent): Promise<void>;
	/** Events of the run after `afterId`, oldest first, at most `limit`. */
	since(runId: string, afterId: string, limit: number): Promise<RunEvent[]>;
	has(runId: string, id: string): Promise<boolean>;
	latestId(runId: string): Promise<string | undefined>;
}

/** Who may follow a run: its members. Wired to the run tables in phase 4. */
export interface AccessPolicy {
	canStream(userId: string, runId: string): Promise<boolean>;
}

export type HubOptions = {
	store: EventStore;
	access: AccessPolicy;
	/** Changes at every server start, so a client can tell the server was restarted. */
	bootId?: string;
	heartbeatMs?: number;
	maxConnectionsPerUser?: number;
	/** Pending messages a slow client may have before its connection is closed. */
	queueLimit?: number;
	now?: () => number;
	newId?: () => string;
};

export type ConnectRequest = { userId: string; runId: string; lastEventId?: string };
export type ConnectResult =
	{ ok: true; stream: ReadableStream<Uint8Array> } | { ok: false; reason: 'not_found' };

type Subscriber = {
	userId: string;
	runId: string;
	send(message: SseMessage): void;
	close(): void;
	/** Events published while the replay was being read; delivered after it. */
	buffer: RunEvent[] | null;
	lastSent: string | undefined;
};

const encoder = new TextEncoder();

/**
 * The hub of server-sent events (docs/progetto/16, P2-10): a stream per run with a persistent
 * diary, replay after a reconnection, a named `ping` every 15 s and bounded queues.
 */
export function createHub(options: HubOptions) {
	const { store, access } = options;
	const heartbeatMs = options.heartbeatMs ?? 15_000;
	const maxPerUser = options.maxConnectionsPerUser ?? 5;
	const queueLimit = options.queueLimit ?? 200;
	const now = options.now ?? Date.now;
	const newId = options.newId ?? createUuidV7(now);
	const bootId = options.bootId ?? crypto.randomUUID();
	const subscribers = new Set<Subscriber>();
	let timer: ReturnType<typeof setInterval> | undefined;

	const startHeartbeat = () => {
		timer ??= setInterval(() => {
			for (const s of subscribers) s.send({ event: 'ping', data: { serverTime: now() } });
		}, heartbeatMs);
		timer.unref?.();
	};
	const stopHeartbeatIfIdle = () => {
		if (subscribers.size === 0 && timer) {
			clearInterval(timer);
			timer = undefined;
		}
	};
	const remove = (s: Subscriber) => {
		subscribers.delete(s);
		stopHeartbeatIfIdle();
	};

	const eventMessage = (e: RunEvent): SseMessage => ({
		event: e.type,
		id: e.id,
		data: {
			id: e.id,
			type: e.type,
			actorUserId: e.actorUserId,
			createdAt: e.createdAt,
			entity: e.entity,
			entityId: e.entityId,
			payload: e.payload
		}
	});

	const deliver = (s: Subscriber, e: RunEvent) => {
		if (s.lastSent !== undefined && e.id <= s.lastSent) return; // already sent (replay overlap)
		s.lastSent = e.id;
		s.send(eventMessage(e));
	};

	return {
		/** Opens the stream of a run for a user, or says the run is not visible to them. */
		async connect(request: ConnectRequest): Promise<ConnectResult> {
			if (!(await access.canStream(request.userId, request.runId)))
				return { ok: false, reason: 'not_found' };

			// Too many connections for this user and run: the oldest one is told to reload and closed.
			const mine = [...subscribers].filter(
				(s) => s.userId === request.userId && s.runId === request.runId
			);
			while (mine.length >= maxPerUser) {
				const oldest = mine.shift()!;
				oldest.send({ event: 'reset', data: { reason: 'access_changed' satisfies ResetReason } });
				oldest.close();
			}

			let controller!: ReadableStreamDefaultController<Uint8Array>;
			let closed = false;
			const subscriber: Subscriber = {
				userId: request.userId,
				runId: request.runId,
				buffer: [],
				lastSent: request.lastEventId,
				send(message) {
					if (closed) return;
					try {
						controller.enqueue(encoder.encode(frame(message)));
						// A client that does not read: stop feeding it, it will reconnect and recover.
						if (controller.desiredSize !== null && controller.desiredSize <= 0) this.close();
					} catch {
						this.close();
					}
				},
				close() {
					if (closed) return;
					closed = true;
					remove(subscriber);
					try {
						controller.close();
					} catch {
						/* already closed by the client */
					}
				}
			};

			const stream = new ReadableStream<Uint8Array>(
				{
					start(c) {
						controller = c;
					},
					cancel() {
						closed = true;
						remove(subscriber);
					}
				},
				// The queue may hold a full replay (MAX_REPLAY events) plus `queueLimit` live messages.
				{ highWaterMark: queueLimit + MAX_REPLAY + 2, size: () => 1 }
			);

			subscribers.add(subscriber);
			startHeartbeat();

			// Registration comes first, so nothing published during the replay is lost.
			void (async () => {
				try {
					const latest = await store.latestId(request.runId);
					subscriber.send({
						event: 'hello',
						retry: 1000,
						data: {
							bootId,
							serverTime: now(),
							lastEventId: latest ?? null,
							heartbeatSeconds: heartbeatMs / 1000
						}
					});
					const known = request.lastEventId
						? await store.has(request.runId, request.lastEventId)
						: false;
					const plan = planRecovery(request.lastEventId, known);
					if (plan.kind === 'reset') {
						subscriber.send({ event: 'reset', data: { reason: plan.reason } });
						return subscriber.close();
					}
					if (plan.kind === 'replay') {
						const missed = await store.since(request.runId, plan.fromId, MAX_REPLAY + 1);
						if (missed.length > MAX_REPLAY) {
							subscriber.send({
								event: 'reset',
								data: { reason: 'too_many_events' satisfies ResetReason }
							});
							return subscriber.close();
						}
						for (const e of missed) deliver(subscriber, e);
					}
					subscriber.send({ event: 'locks.snapshot', data: { locks: [] } });
					const pending = subscriber.buffer ?? [];
					subscriber.buffer = null;
					for (const e of pending) deliver(subscriber, e);
				} catch {
					subscriber.close();
				}
			})();

			return { ok: true, stream };
		},

		/** Writes an event to the diary and sends it to everyone following the run. */
		async publish(input: NewRunEvent): Promise<RunEvent> {
			const event: RunEvent = { ...input, id: newId(), createdAt: now() };
			await store.append(event);
			for (const s of subscribers) {
				if (s.runId !== event.runId) continue;
				if (s.buffer) s.buffer.push(event);
				else deliver(s, event);
			}
			return event;
		},

		/** Ends the streams of a user on a run (removed from the run, role changed). */
		disconnectUser(runId: string, userId: string, reason: ResetReason = 'access_changed') {
			for (const s of [...subscribers]) {
				if (s.runId === runId && s.userId === userId) {
					s.send({ event: 'reset', data: { reason } });
					s.close();
				}
			}
		},

		stats: () => ({ connections: subscribers.size, heartbeatRunning: timer !== undefined }),
		bootId
	};
}

export type Hub = ReturnType<typeof createHub>;
