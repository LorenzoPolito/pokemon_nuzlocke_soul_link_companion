import type { Database } from '../../../server/database/client';
import { runIdempotent, type IdempotentResult } from '../../../server/database/idempotency';
import { createRun, type CreateRunDeps } from './create-run';

const error = (status: number, code: string, message: string, details?: unknown) => ({
	status,
	body: JSON.stringify({ error: { code, message, ...(details === undefined ? {} : { details }) } })
});

/**
 * `POST /api/runs` and the "new run" form: creates a run once per idempotency key. A repeated
 * request (a double click, a retry after a lost response) returns the first answer instead of
 * creating a second run.
 */
export function createRunOnce(
	deps: CreateRunDeps & { db: Database },
	userId: string,
	key: string,
	path: string,
	body: string
): Promise<IdempotentResult> {
	return runIdempotent(deps.db, { userId, key, method: 'POST', path, body }, async () => {
		let raw: unknown;
		try {
			raw = JSON.parse(body);
		} catch {
			return error(400, 'bad_request', 'The body is not valid JSON');
		}
		const result = await createRun(deps, userId, raw);
		if (result.ok) return { status: 201, body: JSON.stringify(result.run) };
		return error(
			422,
			result.error === 'validation' ? 'validation' : result.error,
			result.error,
			result.issues
		);
	});
}
