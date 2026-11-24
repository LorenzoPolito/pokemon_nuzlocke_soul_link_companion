import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseConfig } from '../../server/config';
import { openDatabase, type Connection } from '../../server/database/client';
import { runMigrations } from '../../server/database/migrate';
import { user } from '../auth/infrastructure/schema';
import { createRun, getRun, recordEncounter } from './index';

let dir: string;
let connection: Connection;
let runId: string;
let memberId: string;

beforeEach(async () => {
	dir = mkdtempSync(join(tmpdir(), 'nsl-encounters-'));
	const config: DatabaseConfig = { kind: 'local', url: `file:${dir}/app.db`, dataDir: dir };
	connection = await openDatabase(config);
	await runMigrations(connection, config, join(process.cwd(), 'drizzle'));
	await connection.db.insert(user).values({
		id: 'ana',
		name: 'ANA',
		email: 'ana@example.test',
		createdAt: new Date(),
		updatedAt: new Date()
	});
	const created = await createRun({ db: connection.db }, 'ana', { name: 'Test', gameId: 'black' });
	if (!created.ok) throw new Error(created.error);
	runId = created.run.id;
	const view = await getRun(connection.db, 'ana', runId);
	if (!view) throw new Error('run missing');
	memberId = view.run.members[0]!.id;
});

afterEach(() => {
	connection.client.close();
	rmSync(dir, { recursive: true, force: true });
});

const view = async () => (await getRun(connection.db, 'ana', runId))!.run;
const deps = () => ({ db: connection.db, now: () => 1000 });

describe('recordEncounter', () => {
	it('accepts caught, failed and fled outcomes and rejects a second valid encounter', async () => {
		const first = await recordEncounter(deps(), await view(), 'ana', {
			memberId,
			areaKey: 'unova-route-1',
			outcome: 'caught',
			speciesId: 1,
			specimen: { nickname: 'One' }
		});
		expect(first.ok).toBe(true);
		const second = await recordEncounter(deps(), await view(), 'ana', {
			memberId,
			areaKey: 'unova-route-1',
			outcome: 'failed'
		});
		expect(second).toEqual({ ok: false, error: 'area_taken' });
		for (const [areaKey, outcome] of [
			['unova-route-2', 'failed'],
			['striaton-city', 'fled']
		] as const) {
			expect(
				(await recordEncounter(deps(), await view(), 'ana', { memberId, areaKey, outcome })).ok
			).toBe(true);
		}
	});

	it('requires a nickname for a capture and protects authorization at the use-case boundary', async () => {
		expect(
			await recordEncounter(deps(), await view(), 'ana', {
				memberId,
				areaKey: 'unova-route-1',
				outcome: 'caught',
				speciesId: 1
			})
		).toEqual({ ok: false, error: 'validation' });
		expect(
			await recordEncounter(deps(), await view(), 'ana', {
				memberId: 'spectator',
				areaKey: 'unova-route-1',
				outcome: 'failed'
			})
		).toEqual({ ok: false, error: 'member_not_player' });
	});
});
