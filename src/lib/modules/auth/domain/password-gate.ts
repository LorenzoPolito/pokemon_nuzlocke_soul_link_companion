/**
 * While a user must change the password, only the pages and calls needed to change it
 * (and to sign out) are reachable. Pure.
 */

export type GateDecision = 'pass' | 'redirect' | 'refuse';

/** Paths reachable with a pending password change. */
const ALLOWED = [
	/^\/change-password$/,
	/^\/logout$/,
	/^\/api\/auth\//,
	/^\/api\/me$/,
	/^\/api\/health$/,
	/^\/_app\//,
	/^\/robots\.txt$/
];

export function passwordGate(
	mustChangePassword: boolean,
	method: string,
	path: string
): GateDecision {
	if (!mustChangePassword || ALLOWED.some((pattern) => pattern.test(path))) return 'pass';
	// A page request goes to the change form; an API call is refused with a code.
	return path.startsWith('/api/') || method !== 'GET' ? 'refuse' : 'redirect';
}
