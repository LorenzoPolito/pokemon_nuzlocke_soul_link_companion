import { describe, expect, it } from 'vitest';
import { err, ok } from './result';

describe('Result', () => {
	it('wraps a success', () => {
		expect(ok(6)).toEqual({ ok: true, value: 6 });
	});

	it('wraps an expected failure', () => {
		expect(err('team_full')).toEqual({ ok: false, error: 'team_full' });
	});
});
