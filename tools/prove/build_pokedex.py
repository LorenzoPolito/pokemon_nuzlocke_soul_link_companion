"""Prova di build del Pokédex SQLite (P1-15, schema esteso in P2-07).

Uso: python3 -I build_pokedex.py <cartella data/api/v2 di PokeAPI/api-data> <file .sqlite di uscita>
Non è lo script di produzione: quello nasce in P3-04, in TypeScript.
"""
import json, os, sqlite3, sys, time

root, out = sys.argv[1], sys.argv[2]
LANGS = {'it', 'en'}
INF = 99  # until_generation dei valori attuali

SCHEMA = '''
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
'''
INDEXES = '''
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
'''

def idof(ref): return int(ref['url'].rstrip('/').rsplit('/', 1)[1]) if ref else None
def load(kind):
    d = os.path.join(root, kind)
    for n in sorted((x for x in os.listdir(d) if x.isdigit()), key=int):
        yield json.load(open(os.path.join(d, n, 'index.json')))
def names(entity, o, db):
    db.executemany('INSERT INTO name VALUES(?,?,?,?)', [(entity, o['id'], x['language']['name'], x['name']) for x in o.get('names', []) if x['language']['name'] in LANGS])

if os.path.exists(out): os.remove(out)
db = sqlite3.connect(out)
db.executescript(SCHEMA)
t0 = time.time()
db.execute('INSERT INTO meta VALUES(?,?)', ('schema_version', '2'))

for o in load('generation'): db.execute('INSERT INTO generation VALUES(?,?)', (o['id'], o['name']))
vg_order = {}
for o in load('version-group'):
    vg_order[o['id']] = o['order']
    db.execute('INSERT INTO version_group VALUES(?,?,?,?)', (o['id'], o['name'], o['order'], idof(o['generation'])))
for o in load('version'):
    db.execute('INSERT INTO version VALUES(?,?,?)', (o['id'], o['name'], idof(o['version_group']))); names('version', o, db)
for o in load('type'):
    if o['id'] < 10000: db.execute('INSERT INTO type VALUES(?,?)', (o['id'], o['name'])); names('type', o, db)
for o in load('nature'):
    db.execute('INSERT INTO nature VALUES(?,?,?,?)', (o['id'], o['name'], (o['increased_stat'] or {}).get('name'), (o['decreased_stat'] or {}).get('name'))); names('nature', o, db)
for o in load('ability'):
    db.execute('INSERT INTO ability VALUES(?,?,?)', (o['id'], o['name'], idof(o['generation']))); names('ability', o, db)
for o in load('move'):
    db.execute('INSERT INTO move VALUES(?,?,?,?,?,?,?,?,?)', (o['id'], o['name'], idof(o['generation']), idof(o['type']), o['power'], o['pp'], o['accuracy'], o['priority'], o['damage_class']['name'])); names('move', o, db)
    for pv in o['past_values']:
        db.execute('INSERT INTO move_past VALUES(?,?,?,?,?,?)', (o['id'], vg_order[idof(pv['version_group'])], idof(pv['type']), pv['power'], pv['pp'], pv['accuracy']))
for o in load('pokemon-species'):
    db.execute('INSERT INTO species VALUES(?,?,?,?,?,?,?,?)', (o['id'], o['name'], idof(o['generation']), idof(o['evolution_chain']), idof(o['evolves_from_species']), int(o['is_baby']), int(o['is_legendary']), int(o['is_mythical']))); names('species', o, db)
for o in load('evolution-chain'):
    def walk(n, parent):
        sp = idof(n['species'])
        for d in n['evolution_details'] or [None]:
            if d is None and parent is None: continue
            keep = {k: v for k, v in (d or {}).items() if v not in (None, False, '', []) and k not in ('trigger', 'min_level', 'item')}
            db.execute('INSERT INTO evolution VALUES(?,?,?,?,?,?,?)', (o['id'], parent, sp, (d or {}).get('trigger', {}).get('name') if d else None, (d or {}).get('min_level'), ((d or {}).get('item') or {}).get('name'), json.dumps(keep, ensure_ascii=False) if keep else None))
        for c in n['evolves_to']: walk(c, sp)
    walk(o['chain'], None)
for o in load('location'):
    db.execute('INSERT INTO location VALUES(?,?,?)', (o['id'], o['name'], (o['region'] or {}).get('name'))); names('location', o, db)
vers = {v: k for k, v in ((r[1], r[0]) for r in db.execute('select id, identifier from version'))}
for o in load('location-area'):
    db.execute('INSERT INTO location_area VALUES(?,?,?)', (o['id'], o['name'], idof(o['location'])))
    rows = []
    for pe in o['pokemon_encounters']:
        for vd in pe['version_details']:
            for ed in vd['encounter_details']:
                rows.append((o['id'], idof(pe['pokemon']), idof(vd['version']), ed['method']['name'], ed['min_level'], ed['max_level'], ed['chance'], json.dumps([c['name'] for c in ed['condition_values']]) if ed['condition_values'] else None))
    db.executemany('INSERT INTO encounter VALUES(?,?,?,?,?,?,?,?)', rows)
for o in load('pokemon'):
    pid = o['id']
    db.execute('INSERT INTO pokemon VALUES(?,?,?,?,?,?)', (pid, o['name'], idof(o['species']), int(o['is_default']), o['height'], o['weight']))
    for t in o['types']: db.execute('INSERT INTO pokemon_type VALUES(?,?,?,?)', (pid, t['slot'], idof(t['type']), INF))
    for pt in o['past_types']:
        for t in pt['types']: db.execute('INSERT INTO pokemon_type VALUES(?,?,?,?)', (pid, t['slot'], idof(t['type']), idof(pt['generation'])))
    for s in o['stats']: db.execute('INSERT INTO pokemon_stat VALUES(?,?,?,?)', (pid, s['stat']['name'], s['base_stat'], INF))
    for ps in o['past_stats']:
        for s in ps['stats']: db.execute('INSERT INTO pokemon_stat VALUES(?,?,?,?)', (pid, s['stat']['name'], s['base_stat'], idof(ps['generation'])))
    for a in o['abilities']: db.execute('INSERT INTO pokemon_ability VALUES(?,?,?,?,?)', (pid, a['slot'], idof(a['ability']), int(a['is_hidden']), INF))
    for pa in o['past_abilities']:
        for a in pa['abilities']:
            if a['ability']: db.execute('INSERT INTO pokemon_ability VALUES(?,?,?,?,?)', (pid, a['slot'], idof(a['ability']), int(a['is_hidden']), idof(pa['generation'])))
    rows = [(pid, idof(d['version_group']), idof(m['move']), d['move_learn_method']['name'], d['level_learned_at']) for m in o['moves'] for d in m['version_group_details']]
    db.executemany('INSERT INTO pokemon_move VALUES(?,?,?,?,?)', rows)
db.executescript(INDEXES)
db.commit(); db.execute('VACUUM'); db.close()
print('generazione: %.1f s' % (time.time() - t0))
