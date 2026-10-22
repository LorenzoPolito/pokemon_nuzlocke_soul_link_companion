import { describe, expect, it } from 'vitest';
import { createUuidV7 } from './uuidv7';

describe('createUuidV7', () => {
	it('has the UUID shape with version 7 and the RFC variant', () => {
		const id = createUuidV7()();
		expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
	});

	it('is strictly increasing, also for many ids in the same millisecond', () => {
		const next = createUuidV7(() => 1_790_000_000_000);
		const ids = Array.from({ length: 5000 }, next);
		expect([...ids].sort()).toEqual(ids);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('keeps increasing when the clock goes back', () => {
		let now = 1_790_000_000_000;
		const next = createUuidV7(() => now);
		const a = next();
		now -= 5000;
		const b = next();
		expect(b > a).toBe(true);
	});

	it('orders by time', () => {
		let now = 1_790_000_000_000;
		const next = createUuidV7(() => now);
		const a = next();
		now += 1;
		expect(next() > a).toBe(true);
	});

	it('encodes the time in the first 48 bits', () => {
		const ms = 1_790_000_123_456;
		const id = createUuidV7(() => ms)();
		expect(parseInt(id.replace(/-/g, '').slice(0, 12), 16)).toBe(ms);
	});
});
