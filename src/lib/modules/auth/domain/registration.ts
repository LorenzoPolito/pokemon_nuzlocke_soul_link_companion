/** Registration policy (docs/progetto/06, "Modalità di registrazione"). Pure. */

export type RegistrationMode = 'open' | 'invite' | 'closed';

/** What the request carries: no invite token, a valid one, or one that does not work. */
export type InviteState = 'none' | 'valid' | 'invalid';

export type RegistrationDecision = 'allow' | 'registration_closed' | 'invite_invalid';

export const DEFAULT_REGISTRATION_MODE: RegistrationMode = 'invite';

/**
 * - `open`: anyone may register (an invalid token is simply ignored);
 * - `invite`: a valid invitation, to the app or to a run, is required;
 * - `closed`: nobody registers, the admin creates the accounts.
 */
export function decideRegistration(
	mode: RegistrationMode,
	invite: InviteState
): RegistrationDecision {
	if (mode === 'closed') return 'registration_closed';
	if (mode === 'open') return 'allow';
	return invite === 'valid' ? 'allow' : 'invite_invalid';
}

export const isRegistrationMode = (value: unknown): value is RegistrationMode =>
	value === 'open' || value === 'invite' || value === 'closed';
