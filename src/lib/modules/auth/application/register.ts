import type { Database } from '../../../server/database/client';
import type { Auth } from '../infrastructure/better-auth';
import {
	consumeInvite,
	getRegistrationMode,
	isInviteValid,
	releaseInvite
} from '../infrastructure/invites';
import { decideRegistration, type InviteState } from '../domain/registration';

export type RegisterInput = {
	name: string;
	email: string;
	password: string;
	/** Token of an invitation to the app or to a run, if the person arrived from a link. */
	inviteToken?: string;
};

export type RegisterError = 'registration_closed' | 'invite_invalid' | 'email_taken' | 'validation';

export type RegisterResult = { ok: true; userId: string } | { ok: false; error: RegisterError };

/**
 * Creates an account if the registration mode allows it.
 * An invitation, when present and valid, is used once; if the account cannot be created
 * the use is given back.
 */
export async function registerUser(
	deps: { db: Database; auth: Auth; now?: () => number },
	input: RegisterInput
): Promise<RegisterResult> {
	const now = (deps.now ?? Date.now)();
	const mode = await getRegistrationMode(deps.db);
	const token = input.inviteToken?.trim() || undefined;
	const state: InviteState = !token
		? 'none'
		: (await isInviteValid(deps.db, token, now))
			? 'valid'
			: 'invalid';
	const decision = decideRegistration(mode, state);
	if (decision !== 'allow') return { ok: false, error: decision };

	// A valid token is consumed first, atomically, so two registrations cannot share one use.
	const consumed = token && state === 'valid' ? await consumeInvite(deps.db, token, now) : false;
	if (state === 'valid' && !consumed && mode === 'invite')
		return { ok: false, error: 'invite_invalid' };

	try {
		const created = await deps.auth.api.signUpEmail({
			body: { name: input.name, email: input.email, password: input.password }
		});
		return { ok: true, userId: created.user.id };
	} catch (error) {
		if (token && consumed) await releaseInvite(deps.db, token);
		const code = (error as { body?: { code?: string } }).body?.code ?? '';
		if (code.includes('USER_ALREADY_EXISTS')) return { ok: false, error: 'email_taken' };
		if (code.includes('PASSWORD') || code.includes('INVALID'))
			return { ok: false, error: 'validation' };
		throw error;
	}
}
