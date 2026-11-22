import { and, asc, eq, isNull } from 'drizzle-orm';
import type { Database } from '../../../server/database/client';
import { getGameData, type GameArea } from '../index';
import { customArea } from '../infrastructure/schema';
import type { RunView } from '../../runs/application/get-run';

export type RunArea = GameArea & {
	custom?: { id: string; name: string; afterAreaKey: string | null };
	effectiveAreaKey: string;
	players: Array<{ memberId: string; status: null }>;
	suggestions: string[] | null;
};

export async function listRunAreas(db: Database, run: RunView): Promise<RunArea[]> {
	const game = getGameData(run.gameId);
	const custom = await db
		.select()
		.from(customArea)
		.where(and(eq(customArea.gameId, run.gameId), isNull(customArea.archivedAt)))
		.orderBy(asc(customArea.createdAt));
	const players = () =>
		run.members
			.filter((m) => m.role !== 'spectator' && m.seat !== null)
			.map((m) => ({ memberId: m.id, status: null as null }));
	const areas: RunArea[] = game.areas.map((area) => ({
		...area,
		effectiveAreaKey: run.settings.separateRooms ? area.key : (area.parentAreaKey ?? area.key),
		players: players(),
		suggestions: run.settings.randomizer ? null : [...(area.additionalSpecies ?? [])]
	}));
	for (const item of custom) {
		const customProjection: RunArea = {
			key: `custom:${item.id}`,
			names: { en: item.name, it: item.name },
			pokeapiLocation: null,
			phase: 'story',
			hasWildEncounters: false,
			custom: { id: item.id, name: item.name, afterAreaKey: item.afterAreaKey },
			effectiveAreaKey: `custom:${item.id}`,
			players: players(),
			suggestions: run.settings.randomizer ? null : []
		};
		const index = item.afterAreaKey
			? areas.findLastIndex(
					(a) =>
						a.key === item.afterAreaKey ||
						a.effectiveAreaKey === item.afterAreaKey ||
						a.custom?.afterAreaKey === item.afterAreaKey
				)
			: areas.length - 1;
		areas.splice(index + 1, 0, customProjection);
	}
	return areas;
}
