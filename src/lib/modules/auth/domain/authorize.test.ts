import { describe, expect, it } from 'vitest';
import {
	ALL_ACTIONS,
	authorize,
	type Action,
	type Actor,
	type DenyReason,
	type RunContext,
	type RunRole
} from './authorize';

// The expected results are written by hand from the matrix in docs/progetto/16-Architettura-e-API.md
// (P2-08), independently of the rules in authorize.ts, so a wrong rule fails here.
type Outcome = 'ok' | DenyReason;

const user: Actor = { id: 'u1', role: 'user', disabled: false, mustChangePassword: false };
const admin: Actor = { id: 'a1', role: 'admin', disabled: false, mustChangePassword: false };
const disabled: Actor = { ...user!, disabled: true };
const pending: Actor = { ...user!, mustChangePassword: true };

const run = (memberRole: RunRole | null, over: Partial<RunContext> = {}): { run: RunContext } => ({
	run: { memberRole, status: 'active', deleted: false, ...over }
});

const decide = (
	actor: Actor,
	action: Action,
	resource?: Parameters<typeof authorize>[2]
): Outcome => {
	const d = authorize(actor, action, resource);
	return d.allowed ? 'ok' : d.reason;
};

describe('account and app actions', () => {
	const account: Record<string, Action[]> = {
		everyone: ['me.read', 'me.update', 'invite.accept', 'reference.read', 'run.list', 'run.create'],
		password: ['account.changePassword', 'account.signOut']
	};

	it('require a session', () => {
		for (const action of [...account.everyone!, ...account.password!] as Action[]) {
			expect(decide(null, action)).toBe('unauthenticated');
		}
	});

	it('are open to every enabled user', () => {
		for (const action of account.everyone as Action[]) {
			expect(decide(user, action)).toBe('ok');
			expect(decide(admin, action)).toBe('ok');
		}
	});

	it('refuse a disabled account everything but signing out', () => {
		for (const action of ALL_ACTIONS) {
			expect(decide(disabled, action, run('owner'))).toBe(
				action === 'account.signOut' ? 'ok' : 'account_disabled'
			);
		}
	});

	it('allow only reading the profile, changing the password and signing out while the password must change', () => {
		const open: Action[] = ['me.read', 'account.changePassword', 'account.signOut'];
		for (const action of ALL_ACTIONS) {
			expect(decide(pending, action, run('owner'))).toBe(
				open.includes(action) ? 'ok' : 'password_change_required'
			);
		}
	});
});

describe('admin actions', () => {
	const adminActions: Action[] = [
		'admin.users.read',
		'admin.users.update',
		'admin.users.delete',
		'admin.settings.update',
		'admin.invites.manage',
		'admin.areas.manage',
		'admin.runs.read',
		'admin.runs.restore'
	];

	it('belong to the global admin only', () => {
		for (const action of adminActions) {
			expect(decide(admin, action)).toBe('ok');
			expect(decide(user, action)).toBe('forbidden');
			expect(decide(null, action)).toBe('unauthenticated');
		}
	});

	it('give the admin no access to the data of a run they are not in', () => {
		expect(decide(admin, 'run.read', run(null))).toBe('not_found');
		expect(decide(admin, 'encounter.create', run(null))).toBe('not_found');
	});
});

describe('run actions on an active run', () => {
	// owner, player (own data), player (someone else's data), spectator
	const expected: Record<string, [Outcome, Outcome, Outcome, Outcome]> = {
		'run.read': ['ok', 'ok', 'ok', 'ok'],
		'run.stream': ['ok', 'ok', 'ok', 'ok'],
		'run.update': ['ok', 'forbidden', 'forbidden', 'forbidden'],
		'run.status': ['ok', 'forbidden', 'forbidden', 'forbidden'],
		'run.transfer': ['ok', 'forbidden', 'forbidden', 'forbidden'],
		'run.delete': ['ok', 'forbidden', 'forbidden', 'forbidden'],
		'run.restore': ['forbidden', 'forbidden', 'forbidden', 'forbidden'], // only on a deleted run
		'run.invite': ['ok', 'forbidden', 'forbidden', 'forbidden'],
		'run.members.update': ['ok', 'forbidden', 'forbidden', 'forbidden'],
		'run.members.remove': ['ok', 'forbidden', 'forbidden', 'forbidden'],
		'run.leave': ['ok', 'ok', 'ok', 'ok'],
		'encounter.create': ['ok', 'ok', 'forbidden', 'forbidden'],
		'encounter.update': ['ok', 'ok', 'forbidden', 'forbidden'],
		'encounter.delete': ['ok', 'forbidden', 'forbidden', 'forbidden'],
		'specimen.update': ['ok', 'ok', 'forbidden', 'forbidden'],
		'group.move': ['ok', 'ok', 'ok', 'forbidden'],
		'group.die': ['ok', 'ok', 'ok', 'forbidden'],
		'milestone.set': ['ok', 'ok', 'forbidden', 'forbidden'],
		'override.set': ['ok', 'ok', 'forbidden', 'forbidden'],
		'override.copy': ['ok', 'ok', 'forbidden', 'forbidden'],
		'lock.take': ['ok', 'ok', 'ok', 'forbidden']
	};

	for (const [action, [owner, playerOwn, playerOther, spectator]] of Object.entries(expected)) {
		it(action, () => {
			const a = action as Action;
			expect(decide(user, a, { ...run('owner'), ownData: false })).toBe(owner);
			expect(decide(user, a, { ...run('player'), ownData: true })).toBe(playerOwn);
			expect(decide(user, a, { ...run('player'), ownData: false })).toBe(playerOther);
			expect(decide(user, a, { ...run('spectator'), ownData: true })).toBe(spectator);
			expect(decide(user, a, { ...run(null), ownData: true })).toBe('not_found');
			expect(decide(user, a)).toBe('not_found');
		});
	}

	it('covers every run action in the matrix', () => {
		const known = new Set([
			...Object.keys(expected),
			'me.read',
			'me.update',
			'account.changePassword',
			'account.signOut',
			'invite.accept',
			'reference.read',
			'run.list',
			'run.create',
			'admin.users.read',
			'admin.users.update',
			'admin.users.delete',
			'admin.settings.update',
			'admin.invites.manage',
			'admin.areas.manage',
			'admin.runs.read',
			'admin.runs.restore'
		]);
		expect(ALL_ACTIONS.filter((a) => !known.has(a))).toEqual([]);
		expect(new Set(ALL_ACTIONS).size).toBe(ALL_ACTIONS.length);
	});
});

describe('run that is not active', () => {
	const writes: Action[] = [
		'run.update',
		'run.transfer',
		'run.invite',
		'run.members.update',
		'run.members.remove',
		'encounter.create',
		'encounter.update',
		'encounter.delete',
		'specimen.update',
		'group.move',
		'group.die',
		'milestone.set',
		'override.set',
		'override.copy',
		'lock.take'
	];
	const stillAllowed: Action[] = [
		'run.read',
		'run.stream',
		'run.status',
		'run.delete',
		'run.leave'
	];

	for (const status of ['lost', 'completed'] as const) {
		it(`is read-only when ${status}, except reopening and deleting`, () => {
			for (const action of writes) {
				expect(decide(user, action, { ...run('owner', { status }), ownData: true })).toBe(
					'run_not_active'
				);
			}
			for (const action of stillAllowed) {
				expect(decide(user, action, run('owner', { status }))).toBe('ok');
			}
			expect(decide(user, 'run.read', run('spectator', { status }))).toBe('ok');
		});
	}

	it('hides a deleted run from everyone, and lets only the owner restore it', () => {
		for (const action of ALL_ACTIONS.filter(
			(a) => a.startsWith('run.') || /^(encounter|specimen|group|milestone|override|lock)\./.test(a)
		)) {
			if (action === 'run.list' || action === 'run.create' || action === 'run.restore') continue;
			expect(decide(user, action, { ...run('owner', { deleted: true }), ownData: true })).toBe(
				'not_found'
			);
		}
		expect(decide(user, 'run.restore', run('owner', { deleted: true }))).toBe('ok');
		expect(decide(user, 'run.restore', run('player', { deleted: true }))).toBe('forbidden');
		expect(decide(user, 'run.restore', run('owner'))).toBe('forbidden');
	});
});
