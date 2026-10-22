import { randomBytes } from 'node:crypto';

/**
 * UUIDv7 generator: ordered by time, and strictly increasing within one process even for
 * several ids in the same millisecond (the 12-bit counter lives in the "rand_a" field).
 * The event ids of a run are ordered by it, so "events after id X" is a plain comparison.
 */
export function createUuidV7(clock: () => number = Date.now): () => string {
	let lastMs = 0;
	let counter = 0;
	return () => {
		let ms = clock();
		if (ms <= lastMs) {
			// Same millisecond (or the clock went back): keep counting, borrowing from the future.
			ms = lastMs;
			counter += 1;
			if (counter > 0xfff) {
				ms += 1;
				counter = 0;
			}
		} else {
			counter = 0;
		}
		lastMs = ms;
		const bytes = randomBytes(16);
		bytes[0] = (ms / 2 ** 40) & 0xff;
		bytes[1] = (ms / 2 ** 32) & 0xff;
		bytes[2] = (ms / 2 ** 24) & 0xff;
		bytes[3] = (ms / 2 ** 16) & 0xff;
		bytes[4] = (ms / 2 ** 8) & 0xff;
		bytes[5] = ms & 0xff;
		bytes[6] = 0x70 | (counter >> 8);
		bytes[7] = counter & 0xff;
		bytes[8] = (bytes[8]! & 0x3f) | 0x80;
		const hex = bytes.toString('hex');
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
	};
}
