import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Database } from '../../../server/database/client';
import { listRunAreas, getGameData } from '../../games/index';
import { createUuidV7 } from '../../realtime/domain/uuidv7';
import type { NewRunEvent } from '../../realtime/index';
import { runEvent } from '../../realtime/infrastructure/schema';
import type { RunView } from './get-run';
import { encounter, linkGroup, specimen } from '../infrastructure/schema';

export const encounterInputSchema = z
	.object({
		memberId: z.string().min(1),
		areaKey: z.string().min(1),
		slot: z.enum(['main', 'gift']).default('main'),
		specialKey: z.string().min(1).optional(),
		outcome: z.enum(['caught', 'failed', 'fled', 'dupe', 'untracked']),
		speciesId: z.number().int().positive().optional(),
		levelMet: z.number().int().min(1).max(100).optional(),
		specimen: z
			.object({
				nickname: z.string().trim().min(1).max(20),
				level: z.number().int().min(1).max(100).optional()
			})
			.optional()
	})
	.strict();

export type EncounterInput = z.infer<typeof encounterInputSchema>;
export type EncounterError =
	| 'validation'
	| 'area_not_found'
	| 'member_not_player'
	| 'area_taken'
	| 'dupe_clause_required'
	| 'dupe_clause_not_applicable'
	| 'gift_outcome_invalid';
export type RecordedEncounter = {
	id: string;
	groupId: string;
	outcome: EncounterInput['outcome'];
	specimenId?: string;
};
export type EncounterDeps = {
	db: Database;
	publish?: (event: NewRunEvent) => Promise<unknown>;
	now?: () => number;
	newId?: () => string;
};

const uniqueFailure = (cause: unknown) =>
	/unique constraint failed/i.test(cause instanceof Error ? cause.message : String(cause));

/** Records one encounter atomically; unique indexes are the final concurrency guard. */
export async function recordEncounter(
	deps: EncounterDeps,
	run: RunView,
	actorUserId: string,
	raw: unknown
): Promise<{ ok: true; encounter: RecordedEncounter } | { ok: false; error: EncounterError }> {
	const parsed = encounterInputSchema.safeParse(raw);
	if (!parsed.success) return { ok: false, error: 'validation' };
	const input = parsed.data;
	const member = run.members.find(
		(m) => m.id === input.memberId && m.role !== 'spectator' && m.seat !== null
	);
	if (!member) return { ok: false, error: 'member_not_player' };
	const area = (await listRunAreas(deps.db, run)).find(
		(a) => a.effectiveAreaKey === input.areaKey || a.key === input.areaKey
	);
	if (!area) return { ok: false, error: 'area_not_found' };
	if (input.slot === 'gift') {
		const special =
			input.specialKey &&
			getGameData(run.gameId).specialEncounters.find(
				(item) => item.key === input.specialKey && item.areaKey === area.key
			);
		if (!run.settings.separateGifts || !special) return { ok: false, error: 'validation' };
		if (input.outcome === 'failed' || input.outcome === 'fled')
			return { ok: false, error: 'gift_outcome_invalid' };
	}
	if (input.outcome === 'caught' && (!input.speciesId || !input.specimen?.nickname))
		return { ok: false, error: 'validation' };
	if (input.outcome === 'dupe' && !input.speciesId) return { ok: false, error: 'validation' };
	if (input.outcome !== 'caught' && input.specimen) return { ok: false, error: 'validation' };
	const groupAreaKey = input.slot === 'gift' ? input.specialKey! : area.effectiveAreaKey;
	const now = (deps.now ?? Date.now)();
	const newId: () => string = deps.newId ?? createUuidV7(() => now);
	let result: RecordedEncounter;
	try {
		result = await deps.db.transaction(async (tx) => {
			let [group] = await tx
				.select()
				.from(linkGroup)
				.where(
					and(
						eq(linkGroup.runId, run.id),
						eq(linkGroup.areaKey, groupAreaKey),
						eq(linkGroup.slot, input.slot)
					)
				);
			if (!group) {
				const groupId = newId();
				await tx.insert(linkGroup).values({
					id: groupId,
					runId: run.id,
					areaKey: groupAreaKey,
					slot: input.slot,
					status: 'open',
					version: 1,
					createdAt: now,
					updatedAt: now
				});
				[group] = await tx.select().from(linkGroup).where(eq(linkGroup.id, groupId));
			}
			if (!group) throw new Error('group_creation_failed');
			const previous = await tx
				.select()
				.from(encounter)
				.where(and(eq(encounter.linkGroupId, group.id), eq(encounter.memberId, input.memberId)))
				.orderBy(desc(encounter.attempt));
			if (previous.some((row) => row.outcome !== 'dupe')) throw new Error('area_taken');
			const owned = input.speciesId
				? await tx
						.select({ id: specimen.id })
						.from(specimen)
						.where(
							and(
								eq(specimen.runId, run.id),
								eq(specimen.memberId, input.memberId),
								eq(specimen.speciesId, input.speciesId)
							)
						)
						.limit(1)
				: [];
			if (run.settings.dupesClause && input.outcome === 'caught' && owned.length > 0)
				throw new Error('dupe_clause_required');
			if (input.outcome === 'dupe' && (!run.settings.dupesClause || owned.length === 0))
				throw new Error('dupe_clause_not_applicable');
			const id = newId();
			await tx.insert(encounter).values({
				id,
				runId: run.id,
				linkGroupId: group.id,
				memberId: input.memberId,
				specialKey: input.specialKey ?? null,
				attempt: (previous[0]?.attempt ?? 0) + 1,
				outcome: input.outcome,
				speciesId: input.speciesId ?? null,
				levelMet: input.levelMet ?? null,
				createdAt: now,
				updatedAt: now
			});
			let specimenId: string | undefined;
			if (input.outcome === 'caught') {
				specimenId = newId();
				await tx.insert(specimen).values({
					id: specimenId,
					runId: run.id,
					encounterId: id,
					memberId: input.memberId,
					linkGroupId: group.id,
					nickname: input.specimen!.nickname,
					speciesId: input.speciesId!,
					level: input.specimen!.level ?? input.levelMet ?? null,
					createdAt: now,
					updatedAt: now
				});
			}
			const players = run.members.filter((m) => m.role !== 'spectator' && m.seat !== null);
			const all = await tx.select().from(encounter).where(eq(encounter.linkGroupId, group.id));
			const statuses = players.map((p) =>
				all.find((row) => row.memberId === p.id && row.outcome !== 'dupe')
			);
			const status = statuses.some((row) => row?.outcome === 'failed' || row?.outcome === 'fled')
				? 'skipped'
				: statuses.every(Boolean)
					? 'linked'
					: 'open';
			await tx
				.update(linkGroup)
				.set({
					status,
					position: status === 'linked' ? 'box' : null,
					version: group.version + 1,
					updatedAt: now
				})
				.where(eq(linkGroup.id, group.id));
			await tx.insert(runEvent).values({
				id: newId(),
				runId: run.id,
				actorUserId,
				type: 'encounter.recorded',
				entity: 'encounter',
				entityId: id,
				payload: JSON.stringify({
					after: { id, groupId: group.id, outcome: input.outcome, status }
				}),
				createdAt: now
			});
			return {
				id,
				groupId: group.id,
				outcome: input.outcome,
				...(specimenId ? { specimenId } : {})
			};
		});
	} catch (cause) {
		if (
			cause instanceof Error &&
			['area_taken', 'dupe_clause_required', 'dupe_clause_not_applicable'].includes(cause.message)
		)
			return { ok: false, error: cause.message as EncounterError };
		if (uniqueFailure(cause)) return { ok: false, error: 'area_taken' };
		throw cause;
	}
	await deps.publish?.({
		runId: run.id,
		actorUserId,
		type: 'encounter.recorded',
		entity: 'encounter',
		entityId: result.id,
		payload: result
	});
	return { ok: true, encounter: result };
}
