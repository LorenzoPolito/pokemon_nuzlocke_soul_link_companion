import { building } from '$app/env';
import { loadConfig } from '../config';
import { initPokedex, type Pokedex } from './index.js';

let pokedex: Promise<Pokedex | undefined> | undefined;

/**
 * Opens the Pokédex once at startup (never during the build) and logs which api-data
 * commit it was generated from.
 * @throws PokedexError in production when the file is missing or outdated.
 */
export function startPokedex(): Promise<Pokedex | undefined> {
	if (building) throw new Error('The Pokédex must not be opened during the build');
	pokedex ??= initPokedex(loadConfig(process.env).pokedex).then((opened) => {
		if (opened) {
			const { apiDataCommit, generatedAt } = opened.info;
			console.log(
				`Pokédex ready (api-data ${apiDataCommit.slice(0, 7)}, generated ${generatedAt})`
			);
		}
		return opened;
	});
	return pokedex;
}

/** The open Pokédex, or `undefined` when it has not been generated (development only). */
export function getPokedex(): Promise<Pokedex | undefined> {
	if (!pokedex) throw new Error('Pokédex not initialised: call startPokedex() at startup');
	return pokedex;
}
