import { describe, expect, it } from 'vitest';
import { buildSettings, DEFAULT_SETTINGS, settingsInputSchema } from './settings';

describe('buildSettings', () => {
	it('uses the defaults when nothing is chosen', () => {
		expect(buildSettings('black')).toEqual({ ok: true, settings: DEFAULT_SETTINGS });
	});

	it('has the documented defaults', () => {
		expect(DEFAULT_SETTINGS).toEqual({
			dupesClause: true,
			typeClause: false,
			separateGifts: true,
			separateRooms: true,
			randomizer: false,
			damageCalculator: true
		});
	});

	it('applies the chosen rules over the defaults', () => {
		const result = buildSettings('white', { typeClause: true, dupesClause: false });
		expect(result).toEqual({
			ok: true,
			settings: { ...DEFAULT_SETTINGS, typeClause: true, dupesClause: false }
		});
	});

	it('gives Black 2 and White 2 a normal difficulty by default', () => {
		for (const game of ['black-2', 'white-2'] as const) {
			expect(buildSettings(game)).toMatchObject({ ok: true, settings: { difficulty: 'normal' } });
		}
	});

	it('takes the chosen difficulty for Black 2 and White 2', () => {
		expect(buildSettings('black-2', { difficulty: 'challenge' })).toMatchObject({
			ok: true,
			settings: { difficulty: 'challenge' }
		});
	});

	it('refuses a difficulty for Black and White', () => {
		expect(buildSettings('black', { difficulty: 'easy' })).toEqual({
			ok: false,
			error: 'difficulty_not_available'
		});
		const plain = buildSettings('white');
		expect(plain.ok && 'difficulty' in plain.settings).toBe(false);
	});

	it('ignores rules sent as undefined', () => {
		expect(buildSettings('black', { dupesClause: undefined })).toEqual({
			ok: true,
			settings: DEFAULT_SETTINGS
		});
	});
});

describe('settingsInputSchema', () => {
	it('accepts a partial document', () => {
		expect(settingsInputSchema.safeParse({ randomizer: true }).success).toBe(true);
		expect(settingsInputSchema.safeParse({}).success).toBe(true);
	});

	it('refuses unknown keys: the always-on rules cannot be sent or switched off', () => {
		expect(settingsInputSchema.safeParse({ oneEncounterPerArea: false }).success).toBe(false);
		expect(settingsInputSchema.safeParse({ soulLink: false }).success).toBe(false);
	});

	it('refuses wrong types and difficulties', () => {
		expect(settingsInputSchema.safeParse({ dupesClause: 'yes' }).success).toBe(false);
		expect(settingsInputSchema.safeParse({ difficulty: 'hard' }).success).toBe(false);
	});
});
