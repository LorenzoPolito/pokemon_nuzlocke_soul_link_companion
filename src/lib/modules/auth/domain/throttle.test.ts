import { describe, expect, it } from 'vitest';
import { createThrottle } from './throttle';

describe('createThrottle', () => {
	it('allows the first attempts and refuses the next ones in the window', () => {
		const t = createThrottle({ max: 3, windowMs: 60_000 });
		const results = [0, 1, 2, 3, 4].map((i) => t.hit('a', 1000 + i).allowed);
		expect(results).toEqual([true, true, true, false, false]);
	});

	it('says how long to wait', () => {
		const t = createThrottle({ max: 1, windowMs: 60_000 });
		t.hit('a', 0);
		expect(t.hit('a', 10_000)).toEqual({ allowed: false, retryAfterSeconds: 50 });
	});

	it('starts a new window after the time has passed', () => {
		const t = createThrottle({ max: 1, windowMs: 60_000 });
		t.hit('a', 0);
		expect(t.hit('a', 60_000).allowed).toBe(true);
	});

	it('counts each key separately', () => {
		const t = createThrottle({ max: 1, windowMs: 60_000 });
		t.hit('a', 0);
		expect(t.hit('b', 1).allowed).toBe(true);
		expect(t.hit('a', 2).allowed).toBe(false);
	});
});
