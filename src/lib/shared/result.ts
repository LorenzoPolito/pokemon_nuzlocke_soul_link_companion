/**
 * Outcome of an operation that can fail for an expected, domain-level reason
 * (for example "team full"). Bugs are not `Result`s: they throw.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Wraps a successful value. */
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/** Wraps an expected failure, identified by a stable error code or object. */
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
