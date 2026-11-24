import { and, asc, eq, isNull } from 'drizzle-orm';
import type { Database } from '../../../server/database/client';
import { customArea } from '../infrastructure/schema';

export type CustomArea = typeof customArea.$inferSelect;

export function listCustomAreas(
	db: Database,
	gameId?: string,
	includeArchived = false
): Promise<CustomArea[]> {
	const where = gameId
		? includeArchived
			? eq(customArea.gameId, gameId)
			: and(eq(customArea.gameId, gameId), isNull(customArea.archivedAt))
		: includeArchived
			? undefined
			: isNull(customArea.archivedAt);
	return db
		.select()
		.from(customArea)
		.where(where)
		.orderBy(asc(customArea.gameId), asc(customArea.createdAt));
}

export async function createCustomArea(
	db: Database,
	input: { id: string; gameId: string; name: string; afterAreaKey?: string | null },
	now = Date.now()
): Promise<CustomArea> {
	const row = {
		...input,
		afterAreaKey: input.afterAreaKey ?? null,
		createdAt: now,
		updatedAt: now,
		archivedAt: null
	};
	await db.insert(customArea).values(row);
	return row;
}

export async function updateCustomArea(
	db: Database,
	id: string,
	input: { name?: string; afterAreaKey?: string | null; archived?: boolean },
	now = Date.now()
): Promise<CustomArea | null> {
	const [existing] = await db.select().from(customArea).where(eq(customArea.id, id));
	if (!existing) return null;
	const values = {
		...(input.name === undefined ? {} : { name: input.name }),
		...(input.afterAreaKey === undefined ? {} : { afterAreaKey: input.afterAreaKey }),
		...(input.archived === undefined ? {} : { archivedAt: input.archived ? now : null }),
		updatedAt: now
	};
	await db.update(customArea).set(values).where(eq(customArea.id, id));
	return { ...existing, ...values };
}
