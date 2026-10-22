/**
 * Generates the read-only Pokédex SQLite file from a checkout of PokeAPI/api-data.
 *
 * Usage: node scripts/build-pokedex.ts --source <data/api/v2 directory> --out <file> [--commit <sha>]
 * (Node 22.18 or later runs TypeScript directly.)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import { parseArgs } from 'node:util';
import {
	POKEDEX_INDEXES_SQL,
	POKEDEX_SCHEMA_VERSION,
	POKEDEX_TABLES_SQL
} from '../src/lib/server/pokedex/schema.ts';

const LANGUAGES = new Set(['it', 'en']);
/** `until_generation` of the current values. */
const CURRENT = 99;

type Json = any; // eslint-disable-line @typescript-eslint/no-explicit-any -- raw api-data documents

const idOf = (ref: Json): number | null =>
	ref ? Number(String(ref.url).replace(/\/+$/, '').split('/').pop()) : null;

function* load(root: string, kind: string): Generator<Json> {
	const dir = join(root, kind);
	const ids = readdirSync(dir)
		.filter((n) => /^\d+$/.test(n))
		.sort((a, b) => Number(a) - Number(b));
	for (const id of ids) yield JSON.parse(readFileSync(join(dir, id, 'index.json'), 'utf8'));
}

export type BuildResult = { counts: Record<string, number>; apiDataCommit: string };

/** Builds the file at `out` from the api-data tree at `root` (the `data/api/v2` directory). */
export function buildPokedex(root: string, out: string, commit = 'unknown'): BuildResult {
	mkdirSync(dirname(out), { recursive: true });
	for (const suffix of ['', '-wal', '-shm', '-journal']) rmSync(out + suffix, { force: true });
	const db = new DatabaseSync(out);
	db.exec('PRAGMA journal_mode = OFF; PRAGMA synchronous = OFF;');
	db.exec(POKEDEX_TABLES_SQL);

	const prepared = new Map<string, StatementSync>();
	const run = (sql: string, ...values: (string | number | null)[]) => {
		let statement = prepared.get(sql);
		if (!statement) prepared.set(sql, (statement = db.prepare(sql)));
		statement.run(...values);
	};
	const names = (entity: string, o: Json) => {
		for (const n of o.names ?? []) {
			if (LANGUAGES.has(n.language.name))
				run('INSERT INTO name VALUES(?,?,?,?)', entity, o.id, n.language.name, n.name);
		}
	};
	const counts: Record<string, number> = {};
	const count = (table: string) => (counts[table] = (counts[table] ?? 0) + 1);

	db.exec('BEGIN');
	for (const o of load(root, 'generation')) run('INSERT INTO generation VALUES(?,?)', o.id, o.name);
	const groupOrder = new Map<number, number>();
	for (const o of load(root, 'version-group')) {
		groupOrder.set(o.id, o.order);
		run('INSERT INTO version_group VALUES(?,?,?,?)', o.id, o.name, o.order, idOf(o.generation));
	}
	for (const o of load(root, 'version')) {
		run('INSERT INTO version VALUES(?,?,?)', o.id, o.name, idOf(o.version_group));
		names('version', o);
	}
	for (const o of load(root, 'type')) {
		if (o.id >= 10000) continue; // unknown, shadow
		run('INSERT INTO type VALUES(?,?)', o.id, o.name);
		names('type', o);
		count('type');
	}
	for (const o of load(root, 'nature')) {
		run(
			'INSERT INTO nature VALUES(?,?,?,?)',
			o.id,
			o.name,
			o.increased_stat?.name ?? null,
			o.decreased_stat?.name ?? null
		);
		names('nature', o);
	}
	for (const o of load(root, 'ability')) {
		run('INSERT INTO ability VALUES(?,?,?)', o.id, o.name, idOf(o.generation));
		names('ability', o);
		count('ability');
	}
	for (const o of load(root, 'move')) {
		run(
			'INSERT INTO move VALUES(?,?,?,?,?,?,?,?,?)',
			o.id,
			o.name,
			idOf(o.generation),
			idOf(o.type),
			o.power,
			o.pp,
			o.accuracy,
			o.priority,
			o.damage_class.name
		);
		for (const p of o.past_values ?? []) {
			const group = idOf(p.version_group);
			const order = group === null ? undefined : groupOrder.get(group);
			if (order === undefined) throw new Error(`Move ${o.name}: unknown version group ${group}`);
			run(
				'INSERT INTO move_past VALUES(?,?,?,?,?,?)',
				o.id,
				order,
				idOf(p.type),
				p.power,
				p.pp,
				p.accuracy
			);
		}
		names('move', o);
		count('move');
	}
	for (const o of load(root, 'pokemon-species')) {
		run(
			'INSERT INTO species VALUES(?,?,?,?,?,?,?,?)',
			o.id,
			o.name,
			idOf(o.generation),
			idOf(o.evolution_chain),
			idOf(o.evolves_from_species),
			Number(o.is_baby),
			Number(o.is_legendary),
			Number(o.is_mythical)
		);
		names('species', o);
		count('species');
	}
	for (const chain of load(root, 'evolution-chain')) {
		const walk = (node: Json, parent: number | null) => {
			const species = idOf(node.species);
			for (const d of node.evolution_details?.length ? node.evolution_details : [null]) {
				if (d === null && parent === null) continue;
				const rest = Object.fromEntries(
					Object.entries(d ?? {}).filter(
						([k, v]) =>
							!['trigger', 'min_level', 'item'].includes(k) &&
							v !== null &&
							v !== false &&
							v !== '' &&
							!(Array.isArray(v) && v.length === 0)
					)
				);
				run(
					'INSERT INTO evolution VALUES(?,?,?,?,?,?,?)',
					chain.id,
					parent,
					species,
					d?.trigger?.name ?? null,
					d?.min_level ?? null,
					d?.item?.name ?? null,
					Object.keys(rest).length ? JSON.stringify(rest) : null
				);
				count('evolution');
			}
			for (const next of node.evolves_to ?? []) walk(next, species);
		};
		walk(chain.chain, null);
	}
	for (const o of load(root, 'location')) {
		run('INSERT INTO location VALUES(?,?,?)', o.id, o.name, o.region?.name ?? null);
		names('location', o);
	}
	for (const o of load(root, 'location-area')) {
		run('INSERT INTO location_area VALUES(?,?,?)', o.id, o.name, idOf(o.location));
		for (const pe of o.pokemon_encounters ?? []) {
			for (const vd of pe.version_details) {
				for (const e of vd.encounter_details) {
					run(
						'INSERT INTO encounter VALUES(?,?,?,?,?,?,?,?)',
						o.id,
						idOf(pe.pokemon),
						idOf(vd.version),
						e.method.name,
						e.min_level,
						e.max_level,
						e.chance,
						e.condition_values?.length
							? JSON.stringify(e.condition_values.map((c: Json) => c.name))
							: null
					);
					count('encounter');
				}
			}
		}
	}
	for (const o of load(root, 'pokemon')) {
		const id = o.id;
		run(
			'INSERT INTO pokemon VALUES(?,?,?,?,?,?)',
			id,
			o.name,
			idOf(o.species),
			Number(o.is_default),
			o.height,
			o.weight
		);
		for (const t of o.types)
			run('INSERT INTO pokemon_type VALUES(?,?,?,?)', id, t.slot, idOf(t.type), CURRENT);
		for (const past of o.past_types ?? [])
			for (const t of past.types)
				run(
					'INSERT INTO pokemon_type VALUES(?,?,?,?)',
					id,
					t.slot,
					idOf(t.type),
					idOf(past.generation)
				);
		for (const s of o.stats)
			run('INSERT INTO pokemon_stat VALUES(?,?,?,?)', id, s.stat.name, s.base_stat, CURRENT);
		for (const past of o.past_stats ?? [])
			for (const s of past.stats)
				run(
					'INSERT INTO pokemon_stat VALUES(?,?,?,?)',
					id,
					s.stat.name,
					s.base_stat,
					idOf(past.generation)
				);
		for (const a of o.abilities)
			run(
				'INSERT INTO pokemon_ability VALUES(?,?,?,?,?)',
				id,
				a.slot,
				idOf(a.ability),
				Number(a.is_hidden),
				CURRENT
			);
		for (const past of o.past_abilities ?? [])
			for (const a of past.abilities) {
				if (a.ability)
					run(
						'INSERT INTO pokemon_ability VALUES(?,?,?,?,?)',
						id,
						a.slot,
						idOf(a.ability),
						Number(a.is_hidden),
						idOf(past.generation)
					);
			}
		for (const m of o.moves)
			for (const d of m.version_group_details) {
				run(
					'INSERT INTO pokemon_move VALUES(?,?,?,?,?)',
					id,
					idOf(d.version_group),
					idOf(m.move),
					d.move_learn_method.name,
					d.level_learned_at
				);
				count('pokemon_move');
			}
		count('pokemon');
	}
	run('INSERT INTO meta VALUES(?,?)', 'schema_version', String(POKEDEX_SCHEMA_VERSION));
	run('INSERT INTO meta VALUES(?,?)', 'api_data_commit', commit);
	run('INSERT INTO meta VALUES(?,?)', 'generated_at', new Date().toISOString());
	run('INSERT INTO meta VALUES(?,?)', 'counts', JSON.stringify(counts));
	db.exec('COMMIT');
	db.exec(POKEDEX_INDEXES_SQL);
	db.exec('VACUUM');
	db.close();
	return { counts, apiDataCommit: commit };
}

// Run as a script only when invoked directly, not when imported by tests.
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
	const { values } = parseArgs({
		options: { source: { type: 'string' }, out: { type: 'string' }, commit: { type: 'string' } }
	});
	if (!values.source || !values.out) {
		console.error(
			'Usage: node scripts/build-pokedex.ts --source <data/api/v2> --out <file> [--commit <sha>]'
		);
		process.exit(2);
	}
	if (!existsSync(values.source)) {
		console.error(`Source directory not found: ${values.source}`);
		process.exit(1);
	}
	const started = Date.now();
	const result = buildPokedex(values.source, values.out, values.commit);
	console.log(
		`Pokédex written to ${values.out} in ${((Date.now() - started) / 1000).toFixed(1)} s`
	);
	console.log(JSON.stringify(result.counts));
}
