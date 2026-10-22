/** Public API of the games module: the games a run can be played on (data/games/*.json). */
import black from '../../../../data/games/black.json';
import white from '../../../../data/games/white.json';
import black2 from '../../../../data/games/black-2.json';
import white2 from '../../../../data/games/white-2.json';

/** A game is a version (ADR 0003), not the pair: `black`, `white`, `black-2`, `white-2`. */
export const GAME_IDS = ['black', 'white', 'black-2', 'white-2'] as const;
export type GameId = (typeof GAME_IDS)[number];

export type GameInfo = {
	id: GameId;
	names: { en: string; it: string };
	generation: number;
	versionGroup: string;
	/** Version of the game data when it was read; a run keeps the one it was created with. */
	dataVersion: string;
	/** Black 2 and White 2 have a difficulty that decides the level caps. */
	hasDifficulty: boolean;
};

const files = { black, white, 'black-2': black2, 'white-2': white2 } as const;

const GAMES: readonly GameInfo[] = GAME_IDS.map((id) => ({
	id,
	names: files[id].names,
	generation: files[id].generation,
	versionGroup: files[id].versionGroup,
	dataVersion: files[id].dataVersion,
	hasDifficulty: id === 'black-2' || id === 'white-2'
}));

export const listGames = (): readonly GameInfo[] => GAMES;

export const isGameId = (value: unknown): value is GameId =>
	typeof value === 'string' && (GAME_IDS as readonly string[]).includes(value);

export const getGame = (id: GameId): GameInfo => GAMES.find((g) => g.id === id)!;
