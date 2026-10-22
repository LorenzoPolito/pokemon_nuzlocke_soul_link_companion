/**
 * SQL of the Pokédex file (schema version 2, see docs/progetto/15-Schema-del-Pokedex.md).
 * Used by the build script that generates the file and by the tests.
 */
export const POKEDEX_SCHEMA_VERSION = 2;

export const POKEDEX_TABLES_SQL = `
CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT NOT NULL) WITHOUT ROWID;
CREATE TABLE name(entity TEXT NOT NULL, id INTEGER NOT NULL, lang TEXT NOT NULL, name TEXT NOT NULL, PRIMARY KEY(entity, id, lang)) WITHOUT ROWID;
CREATE TABLE generation(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL);
CREATE TABLE version_group(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL UNIQUE, ord INTEGER NOT NULL, generation_id INTEGER NOT NULL);
CREATE TABLE version(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL UNIQUE, version_group_id INTEGER NOT NULL);
CREATE TABLE type(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL UNIQUE);
CREATE TABLE nature(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL UNIQUE, increased_stat TEXT, decreased_stat TEXT);
CREATE TABLE ability(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL UNIQUE, generation_id INTEGER NOT NULL);
CREATE TABLE move(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL UNIQUE, generation_id INTEGER NOT NULL, type_id INTEGER NOT NULL, power INTEGER, pp INTEGER, accuracy INTEGER, priority INTEGER NOT NULL, damage_class TEXT NOT NULL);
CREATE TABLE move_past(move_id INTEGER NOT NULL, before_vg_ord INTEGER NOT NULL, type_id INTEGER, power INTEGER, pp INTEGER, accuracy INTEGER, PRIMARY KEY(move_id, before_vg_ord)) WITHOUT ROWID;
CREATE TABLE species(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL UNIQUE, generation_id INTEGER NOT NULL, evolution_chain_id INTEGER, evolves_from_species_id INTEGER, is_baby INTEGER NOT NULL, is_legendary INTEGER NOT NULL, is_mythical INTEGER NOT NULL);
CREATE TABLE pokemon(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL UNIQUE, species_id INTEGER NOT NULL, is_default INTEGER NOT NULL, height INTEGER, weight INTEGER);
CREATE TABLE pokemon_type(pokemon_id INTEGER NOT NULL, slot INTEGER NOT NULL, type_id INTEGER NOT NULL, until_generation INTEGER NOT NULL, PRIMARY KEY(pokemon_id, until_generation, slot)) WITHOUT ROWID;
CREATE TABLE pokemon_stat(pokemon_id INTEGER NOT NULL, stat TEXT NOT NULL, base_stat INTEGER NOT NULL, until_generation INTEGER NOT NULL, PRIMARY KEY(pokemon_id, until_generation, stat)) WITHOUT ROWID;
CREATE TABLE pokemon_ability(pokemon_id INTEGER NOT NULL, slot INTEGER NOT NULL, ability_id INTEGER NOT NULL, is_hidden INTEGER NOT NULL, until_generation INTEGER NOT NULL, PRIMARY KEY(pokemon_id, until_generation, slot)) WITHOUT ROWID;
CREATE TABLE pokemon_move(pokemon_id INTEGER NOT NULL, version_group_id INTEGER NOT NULL, move_id INTEGER NOT NULL, method TEXT NOT NULL, level INTEGER NOT NULL);
CREATE TABLE evolution(chain_id INTEGER NOT NULL, from_species_id INTEGER, to_species_id INTEGER NOT NULL, trigger TEXT, min_level INTEGER, item TEXT, details TEXT);
CREATE TABLE location(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL UNIQUE, region TEXT);
CREATE TABLE location_area(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL UNIQUE, location_id INTEGER NOT NULL);
CREATE TABLE encounter(location_area_id INTEGER NOT NULL, pokemon_id INTEGER NOT NULL, version_id INTEGER NOT NULL, method TEXT NOT NULL, min_level INTEGER NOT NULL, max_level INTEGER NOT NULL, chance INTEGER NOT NULL, conditions TEXT);
`;

export const POKEDEX_INDEXES_SQL = `
CREATE INDEX ix_name_search ON name(entity, name COLLATE NOCASE);
CREATE INDEX ix_pokemon_species ON pokemon(species_id);
CREATE INDEX ix_pokemon_move_p ON pokemon_move(pokemon_id, version_group_id);
CREATE INDEX ix_pokemon_move_m ON pokemon_move(move_id, version_group_id);
CREATE INDEX ix_species_chain ON species(evolution_chain_id);
CREATE INDEX ix_evolution_chain ON evolution(chain_id);
CREATE INDEX ix_evolution_to ON evolution(to_species_id);
CREATE INDEX ix_encounter_area ON encounter(location_area_id, version_id);
CREATE INDEX ix_encounter_pokemon ON encounter(pokemon_id, version_id);
CREATE INDEX ix_location_area ON location_area(location_id);
`;
