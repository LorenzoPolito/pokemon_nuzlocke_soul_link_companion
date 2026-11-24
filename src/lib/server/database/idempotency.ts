import { createHash } from 'node:crypto';
import { and, eq, lt } from 'drizzle-orm';
import type { Database } from './client';
import { requestKey } from './schema';

/** How long a stored response is replayed (ADR 0002). */
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export type StoredResponse = { status: number; body: string };

export type IdempotencyOutcome =
	| { kind: 'replay'; response: StoredResponse }
	| { kind: 'mismatch' }
	| { kind: 'fresh' }
	| { kind: 'in_flight' };

// HTTP status 0 cannot be returned by an HTTP response. It marks the row claimed by
// a request whose handler is still running. The unique primary key makes claiming
// the key atomic across concurrent processes and database connections.
const IN_FLIGHT_STATUS = 0;

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
	if (row.status === IN_FLIGHT_STATUS) return { kind: 'in_flight' };
	return { kind: 'replay', response: { status: row.status, body: row.response } };
}

/** Claims a key for one handler. Returns true only for the request that won the race. */
async function claimKey(
	db: Database,
	userId: string,
	key: string,
	requestHash: string,
	now: number
): Promise<boolean> {
	// An expired response (or abandoned in-flight claim) may be replaced, but only
	// if it is still the same expired row. The primary key then arbitrates claimers.
	await db
		.delete(requestKey)
		.where(
			and(
				eq(requestKey.userId, userId),
				eq(requestKey.key, key),
				lt(requestKey.createdAt, now - IDEMPOTENCY_TTL_MS)
			)
		);
	const inserted = await db
		.insert(requestKey)
		.values({
			userId,
			key,
			requestHash,
			status: IN_FLIGHT_STATUS,
			response: '',
			createdAt: now
		})
		.onConflictDoNothing()
		.returning({ key: requestKey.key });
	return inserted.length > 0;
}

async function finishClaim(
	db: Database,
	userId: string,
	key: string,
	response: StoredResponse
): Promise<void> {
	await db
		.update(requestKey)
		.set({ status: response.status, response: response.body })
		.where(
			and(
				eq(requestKey.userId, userId),
				eq(requestKey.key, key),
				eq(requestKey.status, IN_FLIGHT_STATUS)
			)
		);
}

async function releaseClaim(db: Database, userId: string, key: string): Promise<void> {
	await db
		.delete(requestKey)
		.where(
			and(
				eq(requestKey.userId, userId),
				eq(requestKey.key, key),
				eq(requestKey.status, IN_FLIGHT_STATUS)
			)
		);
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
	for (;;) {
		const outcome = await checkKey(db, request.userId, request.key, hash, now);
		if (outcome.kind === 'replay') return { ...outcome.response, replayed: true };
		if (outcome.kind === 'mismatch') {
			const error = {
				error: { code: 'idempotency_mismatch', message: 'The key was used for a different request' }
			};
			return { status: 409, body: JSON.stringify(error), replayed: false };
		}
		if (outcome.kind === 'in_flight') {
			await new Promise((resolve) => setTimeout(resolve, 5));
			continue;
		}
		if (!(await claimKey(db, request.userId, request.key, hash, now))) continue;

		try {
			const response = await handler();
			if (response.status < 500) await finishClaim(db, request.userId, request.key, response);
			else await releaseClaim(db, request.userId, request.key);
			return { ...response, replayed: false };
		} catch (error) {
			await releaseClaim(db, request.userId, request.key);
			throw error;
		}
	}
}
