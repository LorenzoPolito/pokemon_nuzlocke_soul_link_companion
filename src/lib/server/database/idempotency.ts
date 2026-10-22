import { createHash } from 'node:crypto';
import { and, eq, lt } from 'drizzle-orm';
import type { Database } from './client';
import { requestKey } from './schema';

/** How long a stored response is replayed (ADR 0002). */
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export type StoredResponse = { status: number; body: string };

export type IdempotencyOutcome =
	{ kind: 'replay'; response: StoredResponse } | { kind: 'mismatch' } | { kind: 'fresh' };

/** Fingerprint of a request: the same key must always come with the same request. */
export function hashRequest(method: string, path: string, body: string): string {
	return createHash('sha256').update(`${method}\n${path}\n${body}`).digest('hex');
}

/** Looks up a key: a stored response to replay, a mismatch (same key, other request), or nothing. */
export async function checkKey(
	db: Database,
	userId: string,
	key: string,
	requestHash: string,
	now: number
): Promise<IdempotencyOutcome> {
	const [row] = await db
		.select()
		.from(requestKey)
		.where(and(eq(requestKey.userId, userId), eq(requestKey.key, key)));
	if (!row || now - row.createdAt >= IDEMPOTENCY_TTL_MS) return { kind: 'fresh' };
	if (row.requestHash !== requestHash) return { kind: 'mismatch' };
	return { kind: 'replay', response: { status: row.status, body: row.response } };
}

/** Stores the response of a request. If the key already exists (a race), the first one wins. */
export async function storeResponse(
	db: Database,
	userId: string,
	key: string,
	requestHash: string,
	response: StoredResponse,
	now: number
): Promise<void> {
	await db
		.insert(requestKey)
		.values({
			userId,
			key,
			requestHash,
			status: response.status,
			response: response.body,
			createdAt: now
		})
		.onConflictDoNothing();
}

/** Deletes keys older than the validity window; returns how many were removed. */
export async function purgeExpiredKeys(db: Database, now: number): Promise<number> {
	const removed = await db
		.delete(requestKey)
		.where(lt(requestKey.createdAt, now - IDEMPOTENCY_TTL_MS))
		.returning({ key: requestKey.key });
	return removed.length;
}

export type IdempotentRequest = {
	userId: string;
	/** Value of the `Idempotency-Key` header. */
	key: string;
	method: string;
	path: string;
	body: string;
};

export type IdempotentResult = StoredResponse & { replayed: boolean };

/**
 * Runs a write request once per key. A repeated request returns the stored response
 * (`replayed: true`) without calling `handler`; the same key with a different request
 * gets a 409 `idempotency_mismatch`. Only successful and domain-error responses (status < 500)
 * are stored, so a server error can be retried with the same key.
 */
export async function runIdempotent(
	db: Database,
	request: IdempotentRequest,
	handler: () => Promise<StoredResponse>,
	now: number = Date.now()
): Promise<IdempotentResult> {
	const hash = hashRequest(request.method, request.path, request.body);
	const outcome = await checkKey(db, request.userId, request.key, hash, now);
	if (outcome.kind === 'replay') return { ...outcome.response, replayed: true };
	if (outcome.kind === 'mismatch') {
		const error = {
			error: { code: 'idempotency_mismatch', message: 'The key was used for a different request' }
		};
		return { status: 409, body: JSON.stringify(error), replayed: false };
	}
	const response = await handler();
	if (response.status < 500)
		await storeResponse(db, request.userId, request.key, hash, response, now);
	return { ...response, replayed: false };
}
