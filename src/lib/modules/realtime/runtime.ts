import { building } from '$app/env';
import { getDatabase } from '../../server/database/index.js';
import { createHub, type Hub } from './application/hub';
import { createDrizzleStore } from './infrastructure/drizzle-store';
import { runMemberAccess } from './infrastructure/run-access';

let hub: Hub | undefined;

/** Creates the hub once at startup, with the diary in the app database. */
export async function startHub(): Promise<Hub> {
	if (building) throw new Error('The hub must not start during the build');
	if (!hub) {
		const { db } = await getDatabase();
		hub = createHub({ store: createDrizzleStore(db), access: runMemberAccess(db) });
	}
	return hub;
}

export function getHub(): Hub {
	if (!hub) throw new Error('Hub not started: call startHub() at startup');
	return hub;
}
