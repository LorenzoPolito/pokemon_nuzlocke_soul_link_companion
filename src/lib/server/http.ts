import { json } from '@sveltejs/kit';
import type { DenyReason } from '#lib/modules/auth/index.js';

const STATUS: Record<DenyReason, number> = {
	unauthenticated: 401,
	account_disabled: 403,
	password_change_required: 403,
	forbidden: 403,
	not_found: 404,
	run_not_active: 409
};

/** The error body of the API (docs/progetto/16, "Convenzioni"). */
export const apiError = (status: number, code: string, message: string, details?: unknown) =>
	json({ error: { code, message, ...(details === undefined ? {} : { details }) } }, { status });

/** The response for a refused `authorize` decision. */
export const refusal = (reason: DenyReason) => apiError(STATUS[reason], reason, reason);
