import { getDatabase } from '../../server/database/index.js';
import { getHub } from '../realtime/runtime.js';
import type { RunDeps } from './application/access.js';

/** What the use cases need from the running app: the database, the diary and the stream. */
export async function runsDeps(): Promise<
	Required<Pick<RunDeps, 'db' | 'publish' | 'disconnect'>>
> {
	const { db } = await getDatabase();
	const hub = getHub();
	return {
		db,
		publish: (event) => hub.publish(event),
		disconnect: (runId, userId) => hub.disconnectUser(runId, userId)
	};
}
