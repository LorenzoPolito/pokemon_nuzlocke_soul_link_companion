import { describe, expect, it } from 'vitest';
import { canChangeRunGame } from './game-selection';

describe('canChangeRunGame', () => {
	it('allows selecting or correcting the game before the first encounter', () => {
		expect(canChangeRunGame('black', 'white', false)).toEqual({ ok: true });
	});

	it('locks the run game after the first encounter', () => {
		expect(canChangeRunGame('black', 'white', true)).toEqual({ ok: false, error: 'game_locked' });
	});

	it('accepts an unchanged game even after encounters exist', () => {
		expect(canChangeRunGame('black-2', 'black-2', true)).toEqual({ ok: true });
	});
});
