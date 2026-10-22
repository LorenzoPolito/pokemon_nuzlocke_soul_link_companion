import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connectStream, type EventSourceLike, type StreamStatus } from './stream-client';

class FakeSource implements EventSourceLike {
	static all: FakeSource[] = [];
	listeners = new Map<string, (e: MessageEvent) => void>();
	onerror: ((e: Event) => void) | null = null;
	closed = false;
	constructor(public url: string) {
		FakeSource.all.push(this);
	}
	addEventListener(type: string, listener: (e: MessageEvent) => void) {
		this.listeners.set(type, listener);
	}
	close() {
		this.closed = true;
	}
	emit(type: string, data: unknown, lastEventId = '') {
		this.listeners.get(type)?.({ data: JSON.stringify(data), lastEventId } as MessageEvent);
	}
	fail() {
		this.onerror?.(new Event('error'));
	}
}

const last = () => FakeSource.all.at(-1)!;
let statuses: StreamStatus[];
let events: [string, unknown, string | undefined][];
let resets: string[];

const start = (over: Partial<Parameters<typeof connectStream>[0]> = {}) =>
	connectStream({
		url: (id) => `/stream?lastEventId=${id ?? ''}`,
		onEvent: (t, d, id) => events.push([t, d, id]),
		onStatus: (s) => statuses.push(s),
		onReset: (r) => resets.push(r),
		createSource: (url) => new FakeSource(url),
		...over
	});

beforeEach(() => {
	vi.useFakeTimers();
	FakeSource.all = [];
	statuses = [];
	events = [];
	resets = [];
});

afterEach(() => vi.useRealTimers());

describe('connectStream', () => {
	it('opens with the id of the snapshot and passes the events on', () => {
		start({ lastEventId: 'snap-1' });
		expect(last().url).toBe('/stream?lastEventId=snap-1');
		last().emit('hello', { bootId: 'b1' });
		last().emit('encounter.recorded', { id: 'e2' }, 'e2');
		expect(events).toEqual([['encounter.recorded', { id: 'e2' }, 'e2']]);
		expect(statuses.at(-1)).toBe('open');
	});

	it('reconnects by itself with waits of 1, 2, 4, 8 … and at most 30 seconds', () => {
		start();
		const waits: number[] = [];
		for (let i = 0; i < 8; i++) {
			const before = FakeSource.all.length;
			last().fail();
			expect(statuses.at(-1)).toBe('offline');
			let waited = 0;
			while (FakeSource.all.length === before) {
				vi.advanceTimersByTime(1000);
				waited += 1;
			}
			waits.push(waited);
		}
		expect(waits).toEqual([1, 2, 4, 8, 16, 30, 30, 30]);
	});

	it('asks for the events after the last one it received when it reconnects', () => {
		start({ lastEventId: 'e1' });
		last().emit('hello', { bootId: 'b1' });
		last().emit('group.died', {}, 'e5');
		last().fail();
		vi.advanceTimersByTime(1000);
		expect(last().url).toBe('/stream?lastEventId=e5');
	});

	it('starts the waits again after a successful connection', () => {
		start();
		last().fail();
		vi.advanceTimersByTime(1000);
		last().fail();
		vi.advanceTimersByTime(2000);
		last().emit('hello', { bootId: 'b1' });
		const before = FakeSource.all.length;
		last().fail();
		vi.advanceTimersByTime(1000);
		expect(FakeSource.all.length).toBe(before + 1);
	});

	it('warns after 40 seconds without any event and reopens; a ping keeps it quiet', () => {
		start();
		last().emit('hello', { bootId: 'b1' });
		vi.advanceTimersByTime(39_000);
		last().emit('ping', { serverTime: 1 });
		vi.advanceTimersByTime(39_000);
		expect(statuses).not.toContain('stale');
		const before = FakeSource.all.length;
		vi.advanceTimersByTime(2_000);
		expect(statuses).toContain('stale');
		expect(FakeSource.all.length).toBe(before + 1);
	});

	it('reports a restarted server (new bootId) as a reset', () => {
		start();
		last().emit('hello', { bootId: 'b1' });
		last().fail();
		vi.advanceTimersByTime(1000);
		last().emit('hello', { bootId: 'b2' });
		expect(resets).toEqual(['server_restarted']);
		expect(FakeSource.all.every((s) => s.closed)).toBe(true);
	});

	it('passes the reason of a server reset and stops until told to reconnect', () => {
		const client = start({ lastEventId: 'x' });
		last().emit('hello', { bootId: 'b1' });
		last().emit('reset', { reason: 'too_many_events' });
		expect(resets).toEqual(['too_many_events']);
		vi.advanceTimersByTime(120_000);
		expect(FakeSource.all).toHaveLength(1);
		client.reconnect('fresh-snapshot-id');
		expect(last().url).toBe('/stream?lastEventId=fresh-snapshot-id');
	});

	it('ignores the events of a connection it already replaced', () => {
		start();
		const old = last();
		old.fail();
		vi.advanceTimersByTime(1000);
		old.emit('encounter.recorded', {}, 'late');
		expect(events).toEqual([]);
	});

	it('stops completely when closed', () => {
		const client = start();
		client.close();
		vi.advanceTimersByTime(300_000);
		expect(FakeSource.all).toHaveLength(1);
		expect(last().closed).toBe(true);
		expect(vi.getTimerCount()).toBe(0);
	});
});
