import { describe, expect, it } from 'vitest';
import { GAME_IDS, getGame, isGameId, listGames } from './index';

describe('games', () => {
	it('lists the four versions of the MVP', () => {
		expect(listGames().map((g) => g.id)).toEqual(['black', 'white', 'black-2', 'white-2']);
		expect(listGames().every((g) => g.generation === 5 && g.dataVersion.length > 0)).toBe(true);
	});

	it('has names in both languages', () => {
		for (const id of GAME_IDS) {
			const { names } = getGame(id);
			expect(names.en.length).toBeGreaterThan(0);
			expect(names.it.length).toBeGreaterThan(0);
		}
	});

	it('knows which games have a difficulty', () => {
		expect(
			listGames()
				.filter((g) => g.hasDifficulty)
				.map((g) => g.id)
		).toEqual(['black-2', 'white-2']);
	});

	it('recognises game ids', () => {
		expect(isGameId('black-2')).toBe(true);
		expect(isGameId('red')).toBe(false);
		expect(isGameId(undefined)).toBe(false);
	});
});
