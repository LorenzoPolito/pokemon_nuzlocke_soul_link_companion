import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@libsql/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openPokedex, PokedexError, POKEDEX_SCHEMA_VERSION } from '../src/lib/server/pokedex/index';
import { buildPokedex } from './build-pokedex.ts';

const ref = (kind: string, id: number) => ({
	name: `${kind}-${id}`,
	url: `https://pokeapi.co/api/v2/${kind}/${id}/`
});
const names = (it: string, en: string) => [
	{ language: { name: 'it' }, name: it },
	{ language: { name: 'en' }, name: en },
	{ language: { name: 'ja' }, name: 'ignored' }
];

let root: string;
let dir: string;
let file: string;

function write(kind: string, id: number, content: unknown) {
	mkdirSync(join(root, kind, String(id)), { recursive: true });
	writeFileSync(join(root, kind, String(id), 'index.json'), JSON.stringify(content));
}

beforeAll(() => {
	dir = mkdtempSync(join(tmpdir(), 'nsl-pokedex-'));
	root = join(dir, 'api', 'v2');
	file = join(dir, 'out', 'pokedex.sqlite');
	write('generation', 1, { id: 1, name: 'generation-i' });
	write('generation', 5, { id: 5, name: 'generation-v' });
	write('version-group', 11, {
		id: 11,
		name: 'black-white',
		order: 11,
		generation: ref('generation', 5)
	});
	write('version-group', 14, {
		id: 14,
		name: 'black-2-white-2',
		order: 16,
		generation: ref('generation', 5)
	});
	write('version-group', 17, {
		id: 17,
		name: 'sun-moon',
		order: 19,
		generation: ref('generation', 5)
	});
	write('version', 21, {
		id: 21,
		name: 'black-2',
		version_group: ref('version-group', 14),
		names: names('Nero 2', 'Black 2')
	});
	write('type', 1, { id: 1, name: 'normal', names: names('Normale', 'Normal') });
	write('type', 18, { id: 18, name: 'fairy', names: names('Folletto', 'Fairy') });
	write('type', 10001, { id: 10001, name: 'unknown', names: [] });
	write('nature', 1, {
		id: 1,
		name: 'hardy',
		increased_stat: null,
		decreased_stat: null,
		names: names('Ardita', 'Hardy')
	});
	write('ability', 1, {
		id: 1,
		name: 'stench',
		generation: ref('generation', 3),
		names: names('Tanfo', 'Stench')
	});
	write('move', 33, {
		id: 33,
		name: 'tackle',
		generation: ref('generation', 1),
		type: ref('type', 1),
		power: 40,
		pp: 35,
		accuracy: 100,
		priority: 0,
		damage_class: { name: 'physical' },
		past_values: [
			{ version_group: ref('version-group', 11), power: 35, pp: null, accuracy: 95, type: null },
			{
				version_group: { name: 'sun-moon', url: 'https://pokeapi.co/api/v2/version-group/17/' },
				power: 50,
				pp: null,
				accuracy: null,
				type: null
			}
		],
		names: names('Azione', 'Tackle')
	});
	write('evolution-chain', 7, {
		id: 7,
		chain: {
			species: ref('pokemon-species', 35),
			evolution_details: [],
			evolves_to: [
				{
					species: ref('pokemon-species', 36),
					evolution_details: [
						{
							trigger: { name: 'use-item' },
							item: { name: 'moon-stone' },
							min_level: null,
							gender: null
						}
					],
					evolves_to: []
				}
			]
		}
	});
	for (const [id, name] of [
		[35, 'clefairy'],
		[36, 'clefable']
	] as const) {
		write('pokemon-species', id, {
			id,
			name,
			generation: ref('generation', 1),
			evolution_chain: ref('evolution-chain', 7),
			evolves_from_species: id === 36 ? ref('pokemon-species', 35) : null,
			is_baby: false,
			is_legendary: false,
			is_mythical: false,
			names: names(name.toUpperCase(), name)
		});
	}
	write('location', 5, {
		id: 5,
		name: 'unova-route-19',
		region: ref('region', 5),
		names: names('Percorso 19', 'Route 19')
	});
	write('location-area', 9, {
		id: 9,
		name: 'unova-route-19-area',
		location: ref('location', 5),
		pokemon_encounters: [
			{
				pokemon: ref('pokemon', 504),
				version_details: [
					{
						version: ref('version', 21),
						encounter_details: [
							{
								min_level: 2,
								max_level: 4,
								chance: 50,
								method: { name: 'walk' },
								condition_values: []
							}
						]
					}
				]
			}
		]
	});
	write('pokemon', 35, {
		id: 35,
		name: 'clefairy',
		species: ref('pokemon-species', 35),
		is_default: true,
		height: 6,
		weight: 75,
		types: [{ slot: 1, type: ref('type', 18) }],
		past_types: [{ generation: ref('generation', 5), types: [{ slot: 1, type: ref('type', 1) }] }],
		stats: [{ stat: { name: 'hp' }, base_stat: 70 }],
		past_stats: [],
		abilities: [{ slot: 1, is_hidden: false, ability: ref('ability', 1) }],
		past_abilities: [],
		moves: [
			{
				move: ref('move', 33),
				version_group_details: [
					{
						version_group: ref('version-group', 14),
						move_learn_method: { name: 'level-up' },
						level_learned_at: 1
					}
				]
			}
		]
	});
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('buildPokedex', () => {
	it('generates the file and records where the data come from', async () => {
		const result = buildPokedex(root, file, 'abc1234');
		expect(result.counts).toMatchObject({
			type: 2,
			move: 1,
			species: 2,
			pokemon: 1,
			encounter: 1,
			evolution: 1,
			pokemon_move: 1
		});
		const pokedex = await openPokedex(file);
		expect(pokedex.info).toMatchObject({
			schemaVersion: POKEDEX_SCHEMA_VERSION,
			apiDataCommit: 'abc1234'
		});
		expect(Number.isNaN(Date.parse(pokedex.info.generatedAt))).toBe(false);
		pokedex.client.close();
	});

	it('keeps only Italian and English names and skips the types without a game role', async () => {
		const client = createClient({ url: `file:${file}` });
		const langs = await client.execute('SELECT DISTINCT lang FROM name ORDER BY lang');
		expect(langs.rows.map((r) => r.lang)).toEqual(['en', 'it']);
		const types = await client.execute('SELECT identifier FROM type ORDER BY id');
		expect(types.rows.map((r) => r.identifier)).toEqual(['normal', 'fairy']);
		client.close();
	});

	it('stores the history with the documented conventions', async () => {
		const client = createClient({ url: `file:${file}` });
		// Types: the row's until_generation is the LAST generation with the old values.
		const gen = (g: number) =>
			client.execute({
				sql: `SELECT type_id FROM pokemon_type WHERE pokemon_id = 35 AND until_generation =
					(SELECT MIN(until_generation) FROM pokemon_type WHERE pokemon_id = 35 AND until_generation >= ?)`,
				args: [g]
			});
		expect((await gen(5)).rows[0]?.type_id).toBe(1);
		expect((await gen(6)).rows[0]?.type_id).toBe(18);
		// Moves: a row holds the OLD values, valid before the version group in before_vg_ord.
		const past = await client.execute(
			'SELECT before_vg_ord, power, accuracy FROM move_past ORDER BY before_vg_ord'
		);
		expect(past.rows.map((r) => [r.before_vg_ord, r.power, r.accuracy])).toEqual([
			[11, 35, 95],
			[19, 50, null]
		]);
		client.close();
	});

	it('rebuilds over an existing file', () => {
		expect(() => buildPokedex(root, file, 'def5678')).not.toThrow();
	});
});

describe('openPokedex', () => {
	it('refuses every write', async () => {
		buildPokedex(root, file, 'abc1234');
		const pokedex = await openPokedex(file);
		await expect(pokedex.client.execute("INSERT INTO meta VALUES('x', 'y')")).rejects.toThrow();
		await expect(pokedex.client.execute('DELETE FROM move')).rejects.toThrow();
		pokedex.client.close();
	});

	it('names the file when it is missing', async () => {
		await expect(openPokedex(join(dir, 'missing.sqlite'))).rejects.toThrow(
			/not found.*missing\.sqlite/
		);
	});

	it('rejects a file with another schema version', async () => {
		const client = createClient({ url: `file:${file}` });
		await client.execute("UPDATE meta SET value = '1' WHERE key = 'schema_version'");
		client.close();
		await expect(openPokedex(file)).rejects.toThrow(PokedexError);
		await expect(openPokedex(file)).rejects.toThrow(/schema version 1/);
		chmodSync(file, 0o644);
	});
});
