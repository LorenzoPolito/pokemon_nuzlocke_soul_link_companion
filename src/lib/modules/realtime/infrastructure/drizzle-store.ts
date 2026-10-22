import { and, desc, eq, gt, asc } from 'drizzle-orm';
import type { Database } from '../../../server/database/client';
import type { EventStore, RunEvent } from '../application/hub';
import { runEvent } from './schema';

type Row = typeof runEvent.$inferSelect;

const toEvent = (r: Row): RunEvent => ({
	id: r.id,
	runId: r.runId,
	actorUserId: r.actorUserId,
	type: r.type,
	entity: r.entity,
	entityId: r.entityId,
	payload: JSON.parse(r.payload),
	createdAt: r.createdAt
});

/** The diary in the app database. */
export function createDrizzleStore(db: Database): EventStore {
	return {
		async append(e) {
			await db.insert(runEvent).values({
				id: e.id,
				runId: e.runId,
				actorUserId: e.actorUserId,
				type: e.type,
				entity: e.entity,
				entityId: e.entityId,
				payload: JSON.stringify(e.payload),
				createdAt: e.createdAt
			});
		},
		async since(runId, afterId, limit) {
			const rows = await db
				.select()
				.from(runEvent)
				.where(and(eq(runEvent.runId, runId), gt(runEvent.id, afterId)))
				.orderBy(asc(runEvent.id))
				.limit(limit);
			return rows.map(toEvent);
		},
		async has(runId, id) {
			const [row] = await db
				.select({ id: runEvent.id })
				.from(runEvent)
				.where(and(eq(runEvent.runId, runId), eq(runEvent.id, id)));
			return Boolean(row);
		},
		async latestId(runId) {
			const [row] = await db
				.select({ id: runEvent.id })
				.from(runEvent)
				.where(eq(runEvent.runId, runId))
				.orderBy(desc(runEvent.id))
				.limit(1);
			return row?.id;
		}
	};
}
