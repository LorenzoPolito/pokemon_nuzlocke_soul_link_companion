import { z } from 'zod';
import { getGame, type GameId } from '../../games/index';

/** Version of the settings document (`run.settings_schema`). */
export const SETTINGS_SCHEMA_VERSION = 1;

export const DIFFICULTIES = ['easy', 'normal', 'challenge'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * Optional rules of a run (docs/progetto/06, P2-02). The basic and Soul Link rules are always on
 * and are not here: they cannot be switched off.
 */
export type RunSettings = {
	dupesClause: boolean;
	typeClause: boolean;
	separateGifts: boolean;
	separateRooms: boolean;
	randomizer: boolean;
	damageCalculator: boolean;
	/** Only for Black 2 and White 2. */
	difficulty?: Difficulty;
};

export const DEFAULT_SETTINGS = {
	dupesClause: true,
	typeClause: false,
	separateGifts: true,
	separateRooms: true,
	randomizer: false,
	damageCalculator: true
} as const;

/** What a client may send: any rule left out takes its default; unknown keys are refused. */
export const settingsInputSchema = z
	.object({
		dupesClause: z.boolean(),
		typeClause: z.boolean(),
		separateGifts: z.boolean(),
		separateRooms: z.boolean(),
		randomizer: z.boolean(),
		damageCalculator: z.boolean(),
		difficulty: z.enum(DIFFICULTIES)
	})
	.partial()
	.strict();

export type SettingsInput = z.infer<typeof settingsInputSchema>;

export type SettingsError = 'difficulty_not_available';

/**
 * Builds the settings of a new run for a game: defaults, then the chosen values.
 * `difficulty` exists only for games that have one (`normal` by default); sending it for another
 * game is an error, not silently dropped.
 */
export function buildSettings(
	gameId: GameId,
	input: SettingsInput = {}
): { ok: true; settings: RunSettings } | { ok: false; error: SettingsError } {
	const { difficulty, ...rules } = input;
	const hasDifficulty = getGame(gameId).hasDifficulty;
	if (difficulty !== undefined && !hasDifficulty)
		return { ok: false, error: 'difficulty_not_available' };
	const defined = Object.fromEntries(Object.entries(rules).filter(([, v]) => v !== undefined));
	return {
		ok: true,
		settings: {
			...DEFAULT_SETTINGS,
			...defined,
			...(hasDifficulty ? { difficulty: difficulty ?? 'normal' } : {})
		}
	};
}
