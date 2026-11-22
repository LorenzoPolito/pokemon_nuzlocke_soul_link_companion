import { fail, redirect } from '@sveltejs/kit';
import { authorize, hashToken, invite } from '#lib/modules/auth/index.js';
import { listGames } from '#lib/modules/games/index.js';
import { acceptInvite, declineInvite, previewInvite } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import { getDatabase } from '#lib/server/database/index.js';
import { and, eq, isNull } from 'drizzle-orm';
import { runMember } from '#lib/modules/runs/infrastructure/schema.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const deps = await runsDeps();
	const preview = await previewInvite(deps, params.token);
	if (!preview) return { state: 'invalid' as const };
	if (preview.kind === 'app') return { state: 'app' as const, token: params.token };

	// Someone who already takes part just goes to the run.
	let alreadyIn: string | null = null;
	if (locals.user) {
		const { db } = await getDatabase();
		const [row] = await db
			.select({ runId: invite.runId })
			.from(invite)
			.where(eq(invite.tokenHash, hashToken(params.token)));
		if (row?.runId) {
			const [member] = await db
				.select({ id: runMember.id })
				.from(runMember)
				.where(
					and(
						eq(runMember.runId, row.runId),
						eq(runMember.userId, locals.user.id),
						isNull(runMember.removedAt)
					)
				);
			if (member) alreadyIn = row.runId;
		}
	}
	return {
		state: 'run' as const,
		token: params.token,
		signedIn: locals.user !== null,
		alreadyIn,
		preview,
		gameNames: listGames().find((g) => g.id === preview.gameId)!.names
	};
};

export const actions: Actions = {
	accept: async ({ locals, params }) => {
		const decision = authorize(locals.user, 'invite.accept');
		if (!decision.allowed) redirect(303, `/login?next=/invite/${params.token}`);
		const result = await acceptInvite(await runsDeps(), locals.user!.id, params.token);
		if (!result.ok) return fail(409, { error: result.error });
		redirect(303, `/runs/${result.runId}`);
	},

	decline: async ({ locals, params }) => {
		const decision = authorize(locals.user, 'invite.accept');
		if (!decision.allowed) redirect(303, `/login?next=/invite/${params.token}`);
		const ok = await declineInvite(await runsDeps(), locals.user!.id, params.token);
		if (!ok) return fail(409, { error: 'invite_invalid' as const });
		return { declined: true as const };
	}
};
