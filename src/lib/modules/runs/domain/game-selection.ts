import type { GameId } from '../../games/index';

export type GameChangeError = 'game_locked';

/**
 * The game belongs to the run, never to an individual member. It may only be
 * changed while the run has no encounters; once the first encounter exists,
 * changing it would reinterpret every area and species already recorded.
 */
export function canChangeRunGame(
	currentGameId: GameId,
	nextGameId: GameId,
	hasEncounter: boolean
): { ok: true } | { ok: false; error: GameChangeError } {
	if (!hasEncounter || currentGameId === nextGameId) return { ok: true };
	return { ok: false, error: 'game_locked' };
}
