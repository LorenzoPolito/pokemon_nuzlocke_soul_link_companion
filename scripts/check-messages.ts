/**
 * Checks that every message exists in every language with the same parameters.
 * Usage: node scripts/check-messages.ts   (exit code 1 when something is missing)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type MessageProblem = { locale: string; key: string; problem: string };

type Catalog = Record<string, string>;

const params = (text: string) =>
	[...text.matchAll(/\{(\w+)\}/g)]
		.map((m) => m[1])
		.sort()
		.join(',');

/** Compares each language with the base language and lists the differences. */
export function compareCatalogs(catalogs: Record<string, Catalog>, base: string): MessageProblem[] {
	const problems: MessageProblem[] = [];
	const reference = catalogs[base] ?? {};
	for (const [locale, catalog] of Object.entries(catalogs)) {
		if (locale === base) continue;
		for (const key of Object.keys(reference)) {
			if (!(key in catalog)) problems.push({ locale, key, problem: 'missing' });
			else if (params(String(catalog[key])) !== params(String(reference[key])))
				problems.push({ locale, key, problem: 'different parameters' });
			else if (String(catalog[key]).trim() === '') problems.push({ locale, key, problem: 'empty' });
		}
		for (const key of Object.keys(catalog)) {
			if (!(key in reference)) problems.push({ locale, key, problem: `not in ${base}` });
		}
	}
	return problems;
}

/** Reads `messages/<locale>.json` files, ignoring the `$schema` entry. */
export function readCatalogs(dir: string): Record<string, Catalog> {
	const catalogs: Record<string, Catalog> = {};
	for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
		const messages: Catalog = JSON.parse(readFileSync(join(dir, file), 'utf8'));
		delete messages.$schema;
		catalogs[file.replace(/\.json$/, '')] = messages;
	}
	return catalogs;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
	const problems = compareCatalogs(readCatalogs('messages'), 'en');
	for (const p of problems) console.error(`messages/${p.locale}.json: ${p.key}: ${p.problem}`);
	if (problems.length > 0) process.exit(1);
	console.log('Messages: all languages complete.');
}
