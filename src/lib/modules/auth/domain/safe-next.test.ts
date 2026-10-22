import { describe, expect, it } from 'vitest';
import { safeNext } from './safe-next';

describe('safeNext', () => {
	it('keeps a path on this site, query included', () => {
		expect(safeNext('/invite/abc')).toBe('/invite/abc');
		expect(safeNext('/runs/1?tab=a')).toBe('/runs/1?tab=a');
	});

	it('falls back to the home page for anything else', () => {
		for (const value of [
			null,
			undefined,
			'',
			'invite/abc',
			'//evil.example',
			'https://evil.example',
			'/\\evil.example',
			'/ok\r\nSet-Cookie: x=1',
			'javascript:alert(1)'
		]) {
			expect(safeNext(value)).toBe('/');
		}
	});
});
