import type { RequestEvent } from '@sveltejs/kit';
import { authorize, type DenyReason } from '#lib/modules/auth/index.js';
import type { Database } from './database/client.js';
import { runIdempotent } from './database/idempotency.js';
import { apiError } from './http.js';

export type Reply = { status: number; body?: unknown };

/** The error reply for a refused `authorize` decision (same codes as `refusal`). */
export const refusedReply = (reason: DenyReason): Reply => ({
	status: STATUS[reason],
	body: { error: { code: reason, message: reason } }
});

const STATUS: Record<DenyReason, number> = {
	unauthenticated: 401,
	account_disabled: 403,
	password_change_required: 403,
	forbidden: 403,
	not_found: 404,
	run_not_active: 409
};

export const errorReply = (status: number, code: string, details?: unknown): Reply => ({
	status,
	body: { error: { code, message: code, ...(details === undefined ? {} : { details }) } }
});

/**
 * Runs a write request of `/api/runs` once per `Idempotency-Key` (ADR 0002): the handler gets the
 * raw body and returns the reply; a repeat gets the first reply with `Idempotent-Replay: true`.
 */
export async function withIdempotency(
	event: Pick<RequestEvent, 'request' | 'url' | 'locals'>,
	db: Database,
	handler: (rawBody: string) => Promise<Reply>
): Promise<Response> {
	const account = authorize(event.locals.user, 'run.list');
	if (!account.allowed) {
		const reply = refusedReply(account.reason);
		return Response.json(reply.body, { status: reply.status });
	}
	const key = event.request.headers.get('idempotency-key');
	if (!key) return apiError(400, 'idempotency_key_required', 'Send an Idempotency-Key header');
	const rawBody = await event.request.text();
	const result = await runIdempotent(
		db,
		{
			userId: event.locals.user!.id,
			key,
			method: event.request.method,
			path: event.url.pathname,
			body: rawBody
		},
		async () => {
			const reply = await handler(rawBody);
			return {
				status: reply.status,
				body: reply.body === undefined ? '' : JSON.stringify(reply.body)
			};
		}
	);
	return new Response(result.status === 204 || result.body === '' ? null : result.body, {
		status: result.status,
		headers: {
			...(result.body === '' ? {} : { 'content-type': 'application/json' }),
			...(result.replayed ? { 'idempotent-replay': 'true' } : {})
		}
	});
}

export const parseJson = (raw: string): unknown => {
	try {
		return raw === '' ? {} : JSON.parse(raw);
	} catch {
		return undefined;
	}
};
