import { randomBytes } from 'node:crypto';
import { error, fail } from '@sveltejs/kit';
import { z } from 'zod';
import {
	deleteUser,
	disableUser,
	enableUser,
	listAppInvites,
	listUsers,
	resetPassword,
	revokeInvite,
	setAdmin
} from '#lib/modules/admin/application/users.js';
import { authorize, type Action } from '#lib/modules/auth/index.js';
import { isRegistrationMode } from '#lib/modules/auth/domain/registration.js';
import {
	createInvite,
	getRegistrationMode,
	setRegistrationMode
} from '#lib/modules/auth/infrastructure/invites.js';
import { getAuth } from '#lib/modules/auth/runtime.js';
import { getDatabase } from '#lib/server/database/index.js';
import { getPokedex } from '#lib/server/pokedex/runtime.js';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

/** Refuses with 403 unless the signed-in user may do `action`; every load and action calls it. */
function require(event: Pick<RequestEvent, 'locals'>, action: Action) {
	const decision = authorize(event.locals.user, action);
	if (!decision.allowed) error(decision.reason === 'unauthenticated' ? 401 : 403, decision.reason);
	return event.locals.user!;
}

export const load: PageServerLoad = async (event) => {
	require(event, 'admin.users.read');
	const { db } = await getDatabase();
	const pokedex = await getPokedex();
	return {
		users: await listUsers(db),
		mode: await getRegistrationMode(db),
		invites: await listAppInvites(db),
		pokedex: pokedex?.info ?? null,
		insecure: event.url.protocol === 'http:',
		now: Date.now()
	};
};

const userAction = z.object({
	op: z.enum(['disable', 'enable', 'promote', 'demote', 'reset', 'delete']),
	id: z.string().min(1)
});

/** A temporary password the administrator reads out once: easy to type, hard to guess. */
const temporaryPassword = () => randomBytes(9).toString('base64url');

export const actions: Actions = {
	mode: async (event) => {
		require(event, 'admin.settings.update');
		const mode = (await event.request.formData()).get('mode');
		if (!isRegistrationMode(mode)) return fail(422, { error: 'validation' as const });
		const { db } = await getDatabase();
		await setRegistrationMode(db, mode, Date.now());
		return { modeSaved: true };
	},

	invite: async (event) => {
		const admin = require(event, 'admin.invites.manage');
		const form = await event.request.formData();
		const maxUses = Math.min(100, Math.max(1, Number(form.get('maxUses')) || 1));
		const { db } = await getDatabase();
		const token = await createInvite(
			db,
			{ id: crypto.randomUUID(), createdBy: admin.id, kind: 'app', maxUses },
			Date.now()
		);
		return { link: `${event.url.origin}/register?invite=${token}` };
	},

	revokeInvite: async (event) => {
		require(event, 'admin.invites.manage');
		const id = (await event.request.formData()).get('id');
		const { db } = await getDatabase();
		if (typeof id === 'string') await revokeInvite(db, id, Date.now());
		return { inviteRevoked: true };
	},

	user: async (event) => {
		const required: Record<string, Action> = {
			disable: 'admin.users.update',
			enable: 'admin.users.update',
			promote: 'admin.users.update',
			demote: 'admin.users.update',
			reset: 'admin.users.update',
			delete: 'admin.users.delete'
		};
		const parsed = userAction.safeParse(Object.fromEntries(await event.request.formData()));
		if (!parsed.success) return fail(422, { error: 'validation' as const });
		const { op, id } = parsed.data;
		const admin = require(event, required[op]!);
		const { db } = await getDatabase();
		const deps = { db, auth: getAuth(), headers: event.request.headers };
		let result;
		let temporary: string | undefined;
		if (op === 'disable') result = await disableUser(deps, admin.id, id);
		else if (op === 'enable') result = await enableUser(deps, id);
		else if (op === 'promote') result = await setAdmin(deps, admin.id, id, true);
		else if (op === 'demote') result = await setAdmin(deps, admin.id, id, false);
		else if (op === 'reset') {
			temporary = temporaryPassword();
			result = await resetPassword(deps, id, temporary);
		} else result = await deleteUser(deps, admin.id, id, Date.now());
		if (!result.ok) return fail(409, { error: result.error });
		return { done: op, temporaryPassword: temporary };
	}
};
