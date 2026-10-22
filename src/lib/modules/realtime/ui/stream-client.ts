import { ALL_EVENT_TYPES } from '../domain/event-types';

export type StreamStatus = 'connecting' | 'open' | 'stale' | 'offline';

/** The part of `EventSource` the client uses, so tests can replace it. */
export interface EventSourceLike {
	addEventListener(type: string, listener: (event: MessageEvent) => void): void;
	onerror: ((event: Event) => void) | null;
	close(): void;
}

export type StreamClientOptions = {
	/** Address of the stream for a given last event id (`?lastEventId=` carries it). */
	url: (lastEventId: string | undefined) => string;
	onEvent: (type: string, data: unknown, id: string | undefined) => void;
	onStatus: (status: StreamStatus) => void;
	/** The client must reload the whole state (a reason from the server, or `server_restarted`). */
	onReset: (reason: string) => void;
	lastEventId?: string;
	createSource?: (url: string) => EventSourceLike;
	/** Longest wait between reconnection attempts; the waits grow 1, 2, 4, 8… seconds. */
	maxBackoffSeconds?: number;
	/** Silence after which the warning appears and the connection is reopened. */
	staleAfterSeconds?: number;
};

export type StreamClient = {
	/** Reopens the stream after a reset, from the id of the freshly loaded snapshot. */
	reconnect(lastEventId: string | undefined): void;
	close(): void;
};

/**
 * Follows a run's stream with the rules of ADR 0002: reconnect by itself with growing waits,
 * ask for the events missed since the last id, warn after 40 seconds without any event
 * (`ping` included), and report when the server was restarted or the state must be reloaded.
 */
export function connectStream(options: StreamClientOptions): StreamClient {
	const maxBackoff = options.maxBackoffSeconds ?? 30;
	const staleAfter = (options.staleAfterSeconds ?? 40) * 1000;
	const create = options.createSource ?? ((url: string) => new EventSource(url));

	let source: EventSourceLike | undefined;
	let lastId = options.lastEventId;
	let bootId: string | undefined;
	let attempt = 0;
	let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
	let watchdog: ReturnType<typeof setTimeout> | undefined;
	let stopped = false;

	const clearTimers = () => {
		if (reconnectTimer) clearTimeout(reconnectTimer);
		if (watchdog) clearTimeout(watchdog);
		reconnectTimer = watchdog = undefined;
	};

	const armWatchdog = () => {
		if (watchdog) clearTimeout(watchdog);
		watchdog = setTimeout(() => {
			options.onStatus('stale');
			reopen();
		}, staleAfter);
	};

	const scheduleReconnect = () => {
		source?.close();
		source = undefined;
		if (watchdog) clearTimeout(watchdog);
		watchdog = undefined;
		options.onStatus('offline');
		const seconds = Math.min(maxBackoff, 2 ** attempt);
		attempt += 1;
		if (reconnectTimer) clearTimeout(reconnectTimer);
		reconnectTimer = setTimeout(open, seconds * 1000);
	};

	const reopen = () => {
		source?.close();
		source = undefined;
		open();
	};

	const reset = (reason: string) => {
		clearTimers();
		source?.close();
		source = undefined;
		options.onReset(reason);
	};

	function open() {
		if (stopped) return;
		options.onStatus('connecting');
		const current = create(options.url(lastId));
		source = current;
		armWatchdog();
		for (const type of ALL_EVENT_TYPES) {
			current.addEventListener(type, (message) => {
				if (current !== source) return; // an old connection
				armWatchdog();
				attempt = 0;
				options.onStatus('open');
				const data = parse(message.data);
				if (type === 'hello') {
					const received = (data as { bootId?: string } | undefined)?.bootId;
					if (bootId && received && received !== bootId) return reset('server_restarted');
					bootId = received;
					return;
				}
				if (type === 'reset') {
					return reset(String((data as { reason?: string } | undefined)?.reason ?? 'unknown'));
				}
				if (type === 'ping') return;
				const id = message.lastEventId || undefined;
				if (id) lastId = id;
				options.onEvent(type, data, id);
			});
		}
		current.onerror = () => {
			if (current === source) scheduleReconnect();
		};
	}

	open();

	return {
		reconnect(lastEventId) {
			lastId = lastEventId;
			bootId = undefined;
			attempt = 0;
			clearTimers();
			stopped = false;
			reopen();
		},
		close() {
			stopped = true;
			clearTimers();
			source?.close();
			source = undefined;
		}
	};
}

function parse(text: unknown): unknown {
	try {
		return JSON.parse(String(text));
	} catch {
		return undefined;
	}
}
