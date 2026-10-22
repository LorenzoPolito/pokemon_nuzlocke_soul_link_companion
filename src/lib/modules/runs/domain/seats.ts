/** Seats of a run: the players are numbered 1…N, spectators have none (docs/progetto/06, P2-02). */

/** The first positive number not used by `taken`. */
export function firstFreeSeat(taken: readonly (number | null)[]): number {
	const used = new Set(taken.filter((n): n is number => n !== null));
	let seat = 1;
	while (used.has(seat)) seat += 1;
	return seat;
}

/**
 * Who takes over a run when its owner's account is deleted: the player with the next seat after
 * the owner's, or the first one if the owner had the last seat (or none). Only real, active
 * players count; a pending seat or a spectator cannot own a run.
 */
export function nextOwner<T extends { seat: number | null }>(
	candidates: readonly T[],
	ownerSeat: number | null
): T | undefined {
	const ordered = candidates
		.filter((c): c is T & { seat: number } => c.seat !== null)
		.sort((a, b) => a.seat - b.seat);
	return ordered.find((c) => ownerSeat !== null && c.seat > ownerSeat) ?? ordered[0];
}
