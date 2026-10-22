import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseConfig } from '../../server/config';
import { openDatabase, type Connection } from '../../server/database/client';
import { runMigrations } from '../../server/database/migrate';
import { createHub, type EventStore, type RunEvent } from './application/hub';
import { createDrizzleStore } from './infrastructure/drizzle-store';

type Frame = { event: string; id?: string; data: Record<string, unknown> };

/** Reads frames from a stream until `count` have arrived (or the stream ends). */
async function read(stream: ReadableStream<Uint8Array>, count: number): Promise<Frame[]> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	const frames: Frame[] = [];
	let text = '';
	while (frames.length < count) {
		const { value, done } = await reader.read();
		if (done) break;
		text += decoder.decode(value);
		let end;
		while ((end = text.indexOf('\n\n')) >= 0 && frames.length < count) {
			const raw = text.slice(0, end);
			text = text.slice(end + 2);
			const lines = raw.split('\n');
			const get = (k: string) => lines.find((l) => l.startsWith(`${k}: `))?.slice(k.length + 2);
			frames.push({ event: get('event')!, id: get('id'), data: JSON.parse(get('data')!) });
		}
	}
	reader.releaseLock();
	return frames;
}

class MemoryStore implements EventStore {
	events: RunEvent[] = [];
	delayMs = 0;
	async append(e: RunEvent) {
		this.events.push(e);
	}
	async since(runId: string, afterId: string, limit: number) {
		if (this.delayMs) await new Promise((r) => setTimeout(r, this.delayMs));
		return this.events.filter((e) => e.runId === runId && e.id > afterId).slice(0, limit);
	}
	async has(runId: string, id: string) {
		return this.events.some((e) => e.runId === runId && e.id === id);
	}
	async latestId(runId: string) {
		return this.events.filter((e) => e.runId === runId).at(-1)?.id;
	}
}

const member = {
	canStream: async (user: string, run: string) => run === 'run-1' && user !== 'outsider'
};
let store: MemoryStore;
const make = (over: Partial<Parameters<typeof createHub>[0]> = {}) =>
	createHub({ store, access: member, bootId: 'boot-1', ...over });
const evt = (type: string, runId = 'run-1') => ({
	runId,
	actorUserId: 'u1',
	type,
	entity: 'encounter',
	entityId: 'e1',
	payload: { after: type }
});
const tick = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
	store = new MemoryStore();
});

describe('access', () => {
	it('refuses a user who cannot follow the run, and a run that does not exist', async () => {
		const hub = make();
		expect(await hub.connect({ userId: 'outsider', runId: 'run-1' })).toEqual({
			ok: false,
			reason: 'not_found'
		});
		expect(await hub.connect({ userId: 'u1', runId: 'other' })).toEqual({
			ok: false,
			reason: 'not_found'
		});
		expect(hub.stats().connections).toBe(0);
	});
});

describe('stream', () => {
	it('starts with hello, then the empty lock list', async () => {
		const hub = make();
		const result = await hub.connect({ userId: 'u1', runId: 'run-1' });
		if (!result.ok) throw new Error('refused');
		const [hello, locks] = await read(result.stream, 2);
		expect(hello?.event).toBe('hello');
		expect(hello?.data).toMatchObject({
			bootId: 'boot-1',
			lastEventId: null,
			heartbeatSeconds: 15
		});
		expect(locks).toMatchObject({ event: 'locks.snapshot', data: { locks: [] } });
	});

	it('writes each event to the diary and delivers it, with an increasing id, to the run only', async () => {
		const hub = make({ access: { canStream: async () => true } });
		const a = await hub.connect({ userId: 'u1', runId: 'run-1' });
		const b = await hub.connect({ userId: 'u2', runId: 'run-2' });
		if (!a.ok || !b.ok) throw new Error('refused');
		const first = await hub.publish(evt('encounter.recorded'));
		const second = await hub.publish(evt('group.linked'));
		expect(second.id > first.id).toBe(true);
		expect(store.events.map((e) => e.type)).toEqual(['encounter.recorded', 'group.linked']);
		const frames = await read(a.stream, 4); // hello, locks, two events
		expect(frames.slice(2).map((f) => [f.event, f.id])).toEqual([
			['encounter.recorded', first.id],
			['group.linked', second.id]
		]);
		expect(frames[2]?.data).toMatchObject({
			type: 'encounter.recorded',
			actorUserId: 'u1',
			payload: { after: 'encounter.recorded' }
		});
		await a.stream.cancel();
		await b.stream.cancel();
	});
});

describe('live events', () => {
	it('reach a client that is already connected and up to date', async () => {
		const hub = make();
		const result = await hub.connect({ userId: 'u1', runId: 'run-1' });
		if (!result.ok) throw new Error('refused');
		await read(result.stream, 2); // hello and the lock list
		const published = await hub.publish(evt('milestone.reached'));
		const [live] = await read(result.stream, 1);
		expect(live).toMatchObject({ event: 'milestone.reached', id: published.id });
		await result.stream.cancel();
	});
});

describe('recovery after a reconnection', () => {
	it('replays the events after Last-Event-ID, in order, then goes live', async () => {
		const hub = make();
		const e1 = await hub.publish(evt('one'));
		await hub.publish(evt('two'));
		await hub.publish(evt('three'));
		const result = await hub.connect({ userId: 'u1', runId: 'run-1', lastEventId: e1.id });
		if (!result.ok) throw new Error('refused');
		await hub.publish(evt('four'));
		const frames = await read(result.stream, 5);
		// 'four' was written before the replay query ran, so it comes with the replay, once.
		expect(frames.map((f) => f.event)).toEqual(['hello', 'two', 'three', 'four', 'locks.snapshot']);
		await result.stream.cancel();
	});

	it('asks for a reload when the id is not in the diary of the run', async () => {
		const hub = make();
		await hub.publish(evt('one'));
		const result = await hub.connect({ userId: 'u1', runId: 'run-1', lastEventId: 'not-an-id' });
		if (!result.ok) throw new Error('refused');
		const frames = await read(result.stream, 5);
		expect(frames.map((f) => f.event)).toEqual(['hello', 'reset']);
		expect(frames[1]?.data).toEqual({ reason: 'unknown_event_id' });
		expect(hub.stats().connections).toBe(0);
	});

	it('asks for a reload when more than 500 events were missed', async () => {
		const hub = make();
		const first = await hub.publish(evt('first'));
		for (let i = 0; i < 501; i++) await hub.publish(evt('x'));
		const result = await hub.connect({ userId: 'u1', runId: 'run-1', lastEventId: first.id });
		if (!result.ok) throw new Error('refused');
		const frames = await read(result.stream, 5);
		expect(frames.map((f) => f.event)).toEqual(['hello', 'reset']);
		expect(frames[1]?.data).toEqual({ reason: 'too_many_events' });
	});

	it('replays exactly 500 missed events without a reload', async () => {
		const hub = make();
		const first = await hub.publish(evt('first'));
		for (let i = 0; i < 500; i++) await hub.publish(evt('x'));
		const result = await hub.connect({ userId: 'u1', runId: 'run-1', lastEventId: first.id });
		if (!result.ok) throw new Error('refused');
		const frames = await read(result.stream, 502);
		expect(frames[1]?.event).toBe('x');
		expect(frames.at(-1)?.event).toBe('locks.snapshot');
		await result.stream.cancel();
	});

	it('loses and duplicates nothing when an event is published while the replay is read', async () => {
		const hub = make();
		const e1 = await hub.publish(evt('one'));
		await hub.publish(evt('two'));
		store.delayMs = 30; // the replay query is slow
		const result = await hub.connect({ userId: 'u1', runId: 'run-1', lastEventId: e1.id });
		if (!result.ok) throw new Error('refused');
		await tick();
		await hub.publish(evt('three')); // arrives during the replay
		const frames = await read(result.stream, 4);
		// 'three' was written before the slow query ended: it is in the replay, and the copy kept
		// in the buffer is not sent again.
		expect(frames.map((f) => f.event)).toEqual(['hello', 'two', 'three', 'locks.snapshot']);
		await result.stream.cancel();
	});
});

describe('heartbeat and cleanup', () => {
	afterEach(() => vi.useRealTimers());

	it('sends a named ping every 15 seconds', async () => {
		vi.useFakeTimers();
		const hub = make();
		const result = await hub.connect({ userId: 'u1', runId: 'run-1' });
		if (!result.ok) throw new Error('refused');
		await vi.advanceTimersByTimeAsync(31_000);
		const frames = await read(result.stream, 4);
		expect(frames.map((f) => f.event)).toEqual(['hello', 'locks.snapshot', 'ping', 'ping']);
		await result.stream.cancel();
	});

	it('releases a closed connection and stops the timer when nobody is left', async () => {
		vi.useFakeTimers();
		const hub = make();
		const result = await hub.connect({ userId: 'u1', runId: 'run-1' });
		if (!result.ok) throw new Error('refused');
		expect(hub.stats()).toEqual({ connections: 1, heartbeatRunning: true });
		await result.stream.cancel();
		expect(hub.stats()).toEqual({ connections: 0, heartbeatRunning: false });
		expect(vi.getTimerCount()).toBe(0);
	});

	it('does not leak across many connections', async () => {
		vi.useFakeTimers();
		const hub = make({ maxConnectionsPerUser: 5 });
		for (let i = 0; i < 300; i++) {
			const result = await hub.connect({ userId: `u${i % 7}`, runId: 'run-1' });
			if (!result.ok) throw new Error('refused');
			if (i % 2 === 0) await result.stream.cancel();
			else await hub.publish(evt('x'));
		}
		hub.disconnectUser('run-1', 'u1');
		for (let i = 0; i < 7; i++) hub.disconnectUser('run-1', `u${i}`);
		expect(hub.stats().connections).toBe(0);
		expect(vi.getTimerCount()).toBe(0);
	});
});

describe('limits', () => {
	it('closes the oldest connection of a user when they open a sixth on the same run', async () => {
		const hub = make();
		const opened = [];
		for (let i = 0; i < 6; i++) {
			const r = await hub.connect({ userId: 'u1', runId: 'run-1' });
			if (!r.ok) throw new Error('refused');
			opened.push(r);
		}
		expect(hub.stats().connections).toBe(5);
		const frames = await read(opened[0]!.stream, 5);
		expect(frames.at(-1)).toMatchObject({ event: 'reset', data: { reason: 'access_changed' } });
		for (const r of opened.slice(1)) await r.stream.cancel();
	});

	it('closes a client that does not read, instead of queueing without limit', async () => {
		const hub = make({ queueLimit: 3 });
		const result = await hub.connect({ userId: 'u1', runId: 'run-1' });
		if (!result.ok) throw new Error('refused');
		await tick();
		// More than the replay allowance plus the live limit, with nobody reading.
		for (let i = 0; i < 510; i++) await hub.publish(evt('x'));
		expect(hub.stats().connections).toBe(0);
	});

	it('ends the streams of a user removed from the run, with a reload request', async () => {
		const hub = make();
		const result = await hub.connect({ userId: 'u1', runId: 'run-1' });
		if (!result.ok) throw new Error('refused');
		await tick();
		hub.disconnectUser('run-1', 'u1');
		const frames = await read(result.stream, 5);
		expect(frames.at(-1)).toMatchObject({ event: 'reset', data: { reason: 'access_changed' } });
		expect(hub.stats().connections).toBe(0);
	});
});

describe('diary in the database', () => {
	let dir: string;
	let connection: Connection;

	beforeEach(async () => {
		dir = mkdtempSync(join(tmpdir(), 'nsl-hub-'));
		const config: DatabaseConfig = { kind: 'local', url: `file:${dir}/app.db`, dataDir: dir };
		connection = await openDatabase(config);
		await runMigrations(connection, config, join(process.cwd(), 'drizzle'));
	});

	afterEach(() => {
		connection.client.close();
		rmSync(dir, { recursive: true, force: true });
	});

	it('survives a restart: a new hub on the same database replays what the old one wrote', async () => {
		const first = createHub({
			store: createDrizzleStore(connection.db),
			access: member,
			bootId: 'boot-1'
		});
		const e1 = await first.publish(evt('one'));
		await first.publish(evt('two'));
		const second = createHub({
			store: createDrizzleStore(connection.db),
			access: member,
			bootId: 'boot-2'
		});
		const result = await second.connect({ userId: 'u1', runId: 'run-1', lastEventId: e1.id });
		if (!result.ok) throw new Error('refused');
		const frames = await read(result.stream, 3);
		expect(frames.map((f) => f.event)).toEqual(['hello', 'two', 'locks.snapshot']);
		expect(frames[0]?.data.bootId).toBe('boot-2');
		await result.stream.cancel();
	});

	it('keeps the diary of each run apart and in order', async () => {
		const diary = createDrizzleStore(connection.db);
		const hub = createHub({ store: diary, access: { canStream: async () => true } });
		const a1 = await hub.publish(evt('a1', 'run-1'));
		await hub.publish(evt('b1', 'run-2'));
		const a2 = await hub.publish(evt('a2', 'run-1'));
		expect((await diary.since('run-1', a1.id, 10)).map((e) => e.type)).toEqual(['a2']);
		expect(await diary.latestId('run-1')).toBe(a2.id);
		expect(await diary.has('run-2', a1.id)).toBe(false);
	});
});
