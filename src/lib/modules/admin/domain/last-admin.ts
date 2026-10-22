/** The app must always keep at least one active administrator. Pure. */

export type AccountSummary = { id: string; isAdmin: boolean; disabled: boolean };

/**
 * Whether demoting, disabling or deleting `target` would leave the app without an active
 * administrator. Only administrators matter: changing a regular account never does.
 */
export function leavesNoAdmin(accounts: AccountSummary[], target: string): boolean {
	const targetAccount = accounts.find((a) => a.id === target);
	if (!targetAccount?.isAdmin) return false;
	const others = accounts.filter((a) => a.id !== target && a.isAdmin && !a.disabled);
	return others.length === 0;
}
