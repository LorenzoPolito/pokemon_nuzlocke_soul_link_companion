import { describe, expect, it } from 'vitest';
import { frame, planRecovery } from './sse';

describe('frame', () => {
	it('writes id, event and data, ending with a blank line', () => {
		expect(frame({ event: 'ping', data: { t: 1 } })).toBe('event: ping\ndata: {"t":1}\n\n');
		expect(frame({ event: 'group.died', id: 'abc', data: 'x' })).toBe(
			'id: abc\nevent: group.died\ndata: "x"\n\n'
		);
	});

	it('puts the retry delay first', () => {
		expect(frame({ event: 'hello', data: 1, retry: 1000 }).startsWith('retry: 1000\n')).toBe(true);
	});

	it('does not break the frame when the data contain line breaks', () => {
		const text = frame({ event: 'e', data: { note: 'a\nb' } });
		// JSON escapes the newline, so the frame still has a single data line.
		expect(text.match(/^data:/gm)).toHaveLength(1);
		expect(text.endsWith('\n\n')).toBe(true);
		expect(text.slice(0, -2).includes('\n\n')).toBe(false);
	});
});

describe('planRecovery', () => {
	it('sends only new events when the client has no last id', () => {
		expect(planRecovery(undefined, false)).toEqual({ kind: 'none' });
	});

	it('replays from a known id', () => {
		expect(planRecovery('x', true)).toEqual({ kind: 'replay', fromId: 'x' });
	});

	it('asks for a reload when the id is not in the run', () => {
		expect(planRecovery('x', false)).toEqual({ kind: 'reset', reason: 'unknown_event_id' });
	});
});
