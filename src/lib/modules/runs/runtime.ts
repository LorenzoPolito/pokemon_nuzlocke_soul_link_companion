import { getDatabase } from '../../server/database/index.js';
import { getHub } from '../realtime/runtime.js';
import type { CreateRunDeps } from './application/create-run.js';

/** What the use cases need from the running app: the database and the hub's diary. */
export async function runsDeps(): Promise<Required<Pick<CreateRunDeps, 'db' | 'publish'>>> {
	const { db } = await getDatabase();
	return { db, publish: (event) => getHub().publish(event) };
}
