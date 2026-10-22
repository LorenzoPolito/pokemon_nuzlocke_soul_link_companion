/** Fixed-window attempt counter, kept in memory (the server is a single instance). Pure of I/O. */

export type Throttle = {
	/** Counts an attempt for `key`. Returns whether it is allowed and, if not, seconds to wait. */
	hit(key: string, now: number): { allowed: true } | { allowed: false; retryAfterSeconds: number };
};

export function createThrottle(options: { max: number; windowMs: number }): Throttle {
	const windows = new Map<string, { start: number; count: number }>();
	return {
		hit(key, now) {
			// Drop expired windows so the map does not grow without bound.
			if (windows.size > 10_000) {
				for (const [k, w] of windows) if (now - w.start >= options.windowMs) windows.delete(k);
			}
			const current = windows.get(key);
			if (!current || now - current.start >= options.windowMs) {
				windows.set(key, { start: now, count: 1 });
				return { allowed: true };
			}
			current.count += 1;
			if (current.count <= options.max) return { allowed: true };
			return {
				allowed: false,
				retryAfterSeconds: Math.max(1, Math.ceil((current.start + options.windowMs - now) / 1000))
			};
		}
	};
}
