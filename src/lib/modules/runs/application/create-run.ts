import { z } from 'zod';
import type { Database } from '../../../server/database/client';
import { createUuidV7 } from '../../realtime/domain/uuidv7';
import type { NewRunEvent } from '../../realtime/index';
import { getGame, isGameId } from '../../games/index';
import { buildSettings, SETTINGS_SCHEMA_VERSION, settingsInputSchema } from '../domain/settings';
import { run, runMember } from '../infrastructure/schema';

export const createRunSchema = z.object({
	name: z.string().trim().min(1).max(60),
	gameId: z.string().refine(isGameId),
	settings: settingsInputSchema.default({})
});

export type CreateRunInput = z.infer<typeof createRunSchema>;

export type CreateRunError = 'validation' | 'difficulty_not_available';

export type CreatedRun = { id: string; name: string; gameId: string; settings: object };

export type CreateRunDeps = {
	db: Database;
	/** Writes the `run.created` entry in the diary (the hub, in the app). */
	publish?: (event: NewRunEvent) => Promise<unknown>;
	now?: () => number;
	newId?: () => string;
};

const defaultNewId = createUuidV7();

/**
 * Creates a run: the chosen rules over the defaults, the creator as owner and first player
 * (seat 1). The basic and Soul Link rules are not settings, so they are always on. Run and owner
 * are saved together or not at all.
 */
export async function createRun(
	deps: CreateRunDeps,
	ownerId: string,
	raw: unknown
): Promise<{ ok: true; run: CreatedRun } | { ok: false; error: CreateRunError; issues?: unknown }> {
	const parsed = createRunSchema.safeParse(raw);
	if (!parsed.success) return { ok: false, error: 'validation', issues: parsed.error.issues };
	const { name, settings: chosen } = parsed.data;
	const gameId = parsed.data.gameId as Parameters<typeof getGame>[0];

	const built = buildSettings(gameId, chosen);
	if (!built.ok) return { ok: false, error: built.error };

	const now = (deps.now ?? Date.now)();
	const newId = deps.newId ?? defaultNewId;
	const runId = newId();

	await deps.db.transaction(async (tx) => {
		await tx.insert(run).values({
			id: runId,
			name,
			ownerId,
			gameId,
			gameDataVersion: getGame(gameId).dataVersion,
			status: 'active',
			settings: JSON.stringify(built.settings),
			settingsSchema: SETTINGS_SCHEMA_VERSION,
			startedInProgress: false,
			createdAt: now,
			updatedAt: now
		});
		await tx.insert(runMember).values({
			id: newId(),
			runId,
			userId: ownerId,
			role: 'owner',
			seat: 1,
			createdAt: now,
			updatedAt: now
		});
	});

	await deps.publish?.({
		runId,
		actorUserId: ownerId,
		type: 'run.created',
		entity: 'run',
		entityId: runId,
		payload: { before: null, after: { name, gameId, settings: built.settings } }
	});

	return { ok: true, run: { id: runId, name, gameId, settings: built.settings } };
}
