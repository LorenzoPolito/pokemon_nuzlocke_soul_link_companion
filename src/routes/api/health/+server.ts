import { json } from '@sveltejs/kit';
import { getDatabase } from '#lib/server/database/index.js';

/** Readiness probe used by the container healthcheck: the app is up and the database answers. */
export const GET = async () => {
	try {
		const { client } = await getDatabase();
		await client.execute('SELECT 1');
		return json({ ok: true });
	} catch {
		return json({ ok: false }, { status: 503 });
	}
};
