import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from './config';

describe('loadConfig', () => {
	it('uses a local file in ./data by default', () => {
		expect(loadConfig({}).database).toEqual({
			kind: 'local',
			url: 'file:./data/app.db',
			dataDir: './data'
		});
	});

	it('uses DATA_DIR for the local file', () => {
		expect(loadConfig({ DATA_DIR: '/data/' }).database).toMatchObject({
			kind: 'local',
			url: 'file:/data/app.db'
		});
	});

	it('uses Turso when URL and token are both set', () => {
		const { database } = loadConfig({ TURSO_URL: 'libsql://x.turso.io', TURSO_TOKEN: 't' });
		expect(database).toEqual({ kind: 'turso', url: 'libsql://x.turso.io', authToken: 't' });
	});

	it('treats empty variables as unset', () => {
		expect(loadConfig({ TURSO_URL: '', TURSO_TOKEN: '' }).database.kind).toBe('local');
	});

	it('rejects a Turso URL without a token and names the variable', () => {
		expect(() => loadConfig({ TURSO_URL: 'libsql://x.turso.io' })).toThrow(ConfigError);
		expect(() => loadConfig({ TURSO_URL: 'libsql://x.turso.io' })).toThrow(/TURSO_TOKEN/);
	});

	it('rejects a Turso token without a URL', () => {
		expect(() => loadConfig({ TURSO_TOKEN: 't' })).toThrow(/TURSO_URL/);
	});
});
