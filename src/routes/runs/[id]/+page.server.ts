import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { listGames } from '#lib/modules/games/index.js';
import {
	changeMember,
	createRunInvite,
	listRunInvites,
	removeMember,
	requireRun,
	revokeRunInvite,
	transferOwnership,
	type MemberResult
} from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const deps = await runsDeps();
	const access = await requireRun(deps.db, locals.user, params.id, 'run.read');
	if (!access.ok) error(access.reason === 'unauthenticated' ? 401 : 404, 'Not found');
	const game = listGames().find((g) => g.id === access.run.gameId)!;
	const manage = await requireRun(deps.db, locals.user, params.id, 'run.invite');
	return {
		run: access.run,
		role: access.role,
		me: locals.user!.id,
		gameNames: game.names,
		// Only the owner of a run that is still going sees and manages the invitations.
		canManage: manage.ok,
		invites: manage.ok ? await listRunInvites(deps, params.id) : []
	};
};

const memberError = (result: Extract<MemberResult, { ok: false }>) =>
	fail(result.error === 'last_owner' ? 409 : 422, {
		memberError: (result.error === 'last_owner' ? 'last_owner' : 'member') as
			'last_owner' | 'member'
	});

export const actions: Actions = {
	invite: async ({ request, locals, params, url }) => {
		const deps = await runsDeps();
		const access = await requireRun(deps.db, locals.user, params.id, 'run.invite');
		if (!access.ok) error(access.reason === 'unauthenticated' ? 401 : 403, access.reason);
		const form = await request.formData();
		const seatName = String(form.get('seatName') ?? '').trim();
		const result = await createRunInvite(deps, params.id, locals.user!.id, {
			role: String(form.get('role') ?? ''),
			...(seatName ? { seatName } : {}),
			maxUses: Number(form.get('maxUses') || 1)
		});
		if (!result.ok) return fail(422, { inviteError: true as const });
		// The link is shown once, here: only its hash is stored.
		return {
			link: `${url.origin}/invite/${result.invite.token}`,
			linkRole: String(form.get('role'))
		};
	},

	revoke: async ({ request, locals, params }) => {
		const deps = await runsDeps();
		const access = await requireRun(deps.db, locals.user, params.id, 'run.invite');
		if (!access.ok) error(access.reason === 'unauthenticated' ? 401 : 403, access.reason);
		const id = String((await request.formData()).get('inviteId') ?? '');
		await revokeRunInvite(deps, params.id, id);
		return { revoked: true };
	},

	member: async ({ request, locals, params }) => {
		const deps = await runsDeps();
		const parsed = z
			.object({
				op: z.enum(['spectator', 'player', 'remove', 'transfer', 'leave']),
				memberId: z.string().min(1)
			})
			.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(422, { memberError: 'member' as const });
		const { op, memberId } = parsed.data;
		const me = locals.user!.id;

		const action =
			op === 'leave'
				? 'run.leave'
				: op === 'transfer'
					? 'run.transfer'
					: op === 'remove'
						? 'run.members.remove'
						: 'run.members.update';
		const access = await requireRun(deps.db, locals.user, params.id, action);
		if (!access.ok) error(access.reason === 'unauthenticated' ? 401 : 403, access.reason);
		// Leaving is only for oneself.
		if (op === 'leave' && access.run.members.find((m) => m.id === memberId)?.userId !== me)
			error(403, 'forbidden');

		const result =
			op === 'transfer'
				? await transferOwnership(deps, params.id, me, memberId)
				: op === 'remove' || op === 'leave'
					? await removeMember(deps, params.id, me, memberId)
					: await changeMember(deps, params.id, me, memberId, { role: op });
		if (!result.ok) return memberError(result);
		if (op === 'leave') redirect(303, '/');
		return { memberDone: op };
	}
};
