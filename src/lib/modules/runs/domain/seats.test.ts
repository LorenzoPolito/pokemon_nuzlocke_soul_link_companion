import { describe, expect, it } from 'vitest';
import { firstFreeSeat, nextOwner } from './seats';

describe('firstFreeSeat', () => {
	it('starts at 1 and fills the gaps', () => {
		expect(firstFreeSeat([])).toBe(1);
		expect(firstFreeSeat([1, 2, 3])).toBe(4);
		expect(firstFreeSeat([1, 3])).toBe(2);
		expect(firstFreeSeat([null, 2])).toBe(1);
	});
});

describe('nextOwner', () => {
	const players = [
		{ id: 'b', seat: 2 },
		{ id: 'c', seat: 3 },
		{ id: 'a', seat: 1 }
	];

	it('picks the player with the next seat', () => {
		expect(
			nextOwner(
				players.filter((p) => p.id !== 'a'),
				1
			)?.id
		).toBe('b');
		expect(
			nextOwner(
				players.filter((p) => p.id !== 'b'),
				2
			)?.id
		).toBe('c');
	});

	it('goes round to the first seat after the last one', () => {
		expect(
			nextOwner(
				players.filter((p) => p.id !== 'c'),
				3
			)?.id
		).toBe('a');
	});

	it('takes the first seat when the owner had none, and nothing when nobody can', () => {
		expect(nextOwner(players, null)?.id).toBe('a');
		expect(nextOwner([], 1)).toBeUndefined();
		expect(nextOwner([{ seat: null }], 1)).toBeUndefined();
	});
});
