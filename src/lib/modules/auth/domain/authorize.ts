/**
 * The single place where permissions are decided (docs/progetto/16-Architettura-e-API.md, P2-08).
 * Pure: it receives the facts about the user and the run and returns a decision.
 */

export type GlobalRole = 'admin' | 'user';
export type RunRole = 'owner' | 'player' | 'spectator';
export type RunStatus = 'active' | 'lost' | 'completed';

/** The person making the request. `null` means no valid session. */
export type Actor = {
	id: string;
	role: GlobalRole;
	disabled: boolean;
	mustChangePassword: boolean;
} | null;

/** What the server knows about the run the action touches. */
export type RunContext = {
	/** The actor's role in the run, or `null` when not a member. */
	memberRole: RunRole | null;
	status: RunStatus;
	/** The run is in the 30-day deletion window. */
	deleted: boolean;
};

export type Resource = {
	run?: RunContext;
	/** For actions on a player's own data: is the data the actor's own? */
	ownData?: boolean;
};

export type DenyReason =
	| 'unauthenticated'
	| 'account_disabled'
	| 'password_change_required'
	| 'forbidden'
	| 'not_found'
	| 'run_not_active';

export type Decision = { allowed: true } | { allowed: false; reason: DenyReason };

type RunRule = {
	/** Roles that may do it. */
	roles: readonly RunRole[];
	/** Players may act only on their own data; the owner acts on everyone's. */
	playerOwnDataOnly?: boolean;
	/** Refused when the run is lost, completed or deleted. */
	needsActiveRun?: boolean;
	/** Allowed on a deleted run (restore). */
	onDeletedRun?: boolean;
};

const ALL_ROLES = ['owner', 'player', 'spectator'] as const;
const PLAYING = ['owner', 'player'] as const;

/** Actions that need only a valid, enabled account. */
const AUTHENTICATED_ACTIONS = [
	'me.read',
	'me.update',
	'account.changePassword',
	'account.signOut',
	'invite.accept',
	'reference.read',
	'run.list',
	'run.create'
] as const;

/** Actions reserved to the global admin. */
const ADMIN_ACTIONS = [
	'admin.users.read',
	'admin.users.update',
	'admin.users.delete',
	'admin.settings.update',
	'admin.invites.manage',
	'admin.areas.manage',
	'admin.runs.read',
	'admin.runs.restore'
] as const;

const RUN_RULES = {
	'run.read': { roles: ALL_ROLES },
	'run.stream': { roles: ALL_ROLES },
	'run.update': { roles: ['owner'], needsActiveRun: true },
	'run.status': { roles: ['owner'] },
	'run.transfer': { roles: ['owner'], needsActiveRun: true },
	'run.delete': { roles: ['owner'] },
	'run.restore': { roles: ['owner'], onDeletedRun: true },
	'run.invite': { roles: ['owner'], needsActiveRun: true },
	'run.members.update': { roles: ['owner'], needsActiveRun: true },
	'run.members.remove': { roles: ['owner'], needsActiveRun: true },
	'run.leave': { roles: ALL_ROLES },
	'encounter.create': { roles: PLAYING, playerOwnDataOnly: true, needsActiveRun: true },
	'encounter.update': { roles: PLAYING, playerOwnDataOnly: true, needsActiveRun: true },
	'encounter.delete': { roles: ['owner'], needsActiveRun: true },
	'specimen.update': { roles: PLAYING, playerOwnDataOnly: true, needsActiveRun: true },
	'group.move': { roles: PLAYING, needsActiveRun: true },
	'group.die': { roles: PLAYING, needsActiveRun: true },
	'milestone.set': { roles: PLAYING, playerOwnDataOnly: true, needsActiveRun: true },
	'override.set': { roles: PLAYING, playerOwnDataOnly: true, needsActiveRun: true },
	'override.copy': { roles: PLAYING, playerOwnDataOnly: true, needsActiveRun: true },
	'lock.take': { roles: PLAYING, needsActiveRun: true }
} as const satisfies Record<string, RunRule>;

export type Action =
	(typeof AUTHENTICATED_ACTIONS)[number] | (typeof ADMIN_ACTIONS)[number] | keyof typeof RUN_RULES;

/** Every action the app knows, for tests and tooling. */
export const ALL_ACTIONS: readonly Action[] = [
	...AUTHENTICATED_ACTIONS,
	...ADMIN_ACTIONS,
	...(Object.keys(RUN_RULES) as (keyof typeof RUN_RULES)[])
];

/** Allowed while the password must still be changed. */
const ALLOWED_WHEN_PASSWORD_PENDING: readonly Action[] = [
	'me.read',
	'account.changePassword',
	'account.signOut'
];

const deny = (reason: DenyReason): Decision => ({ allowed: false, reason });
const allow: Decision = { allowed: true };

const isRunAction = (action: Action): action is keyof typeof RUN_RULES => action in RUN_RULES;
const isAdminAction = (action: Action): boolean =>
	(ADMIN_ACTIONS as readonly string[]).includes(action);

/**
 * Decides whether `actor` may do `action`.
 *
 * Order: session, account state, global rules, then the run. For non-members a run
 * "does not exist" (`not_found`), so its existence is not revealed.
 */
export function authorize(actor: Actor, action: Action, resource: Resource = {}): Decision {
	if (!actor) return deny('unauthenticated');
	if (actor.disabled && action !== 'account.signOut') return deny('account_disabled');
	if (actor.mustChangePassword && !ALLOWED_WHEN_PASSWORD_PENDING.includes(action)) {
		return deny('password_change_required');
	}
	if (isAdminAction(action)) return actor.role === 'admin' ? allow : deny('forbidden');
	if (!isRunAction(action)) return allow;

	const rule: RunRule = RUN_RULES[action];
	const run = resource.run;
	if (!run || run.memberRole === null) return deny('not_found');
	if (run.deleted && !rule.onDeletedRun) return deny('not_found');
	if (!run.deleted && rule.onDeletedRun) return deny('forbidden');
	if (!rule.roles.includes(run.memberRole)) return deny('forbidden');
	if (rule.needsActiveRun && run.status !== 'active') return deny('run_not_active');
	if (rule.playerOwnDataOnly && run.memberRole === 'player' && resource.ownData !== true) {
		return deny('forbidden');
	}
	return allow;
}
