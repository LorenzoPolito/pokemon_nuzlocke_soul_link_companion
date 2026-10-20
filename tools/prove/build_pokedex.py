import json, os, sqlite3, sys, time
root, out = sys.argv[1], sys.argv[2]
LANGS = {'it', 'en'}
def load(kind):
    d = os.path.join(root, kind)
    for n in sorted((x for x in os.listdir(d) if x.isdigit()), key=int):
        yield json.load(open(os.path.join(d, n, 'index.json')))
def idof(ref): return int(ref['url'].rstrip('/').rsplit('/', 1)[1])
def names(o): return [(x['language']['name'], x['name']) for x in o.get('names', []) if x['language']['name'] in LANGS]
if os.path.exists(out): os.remove(out)
db = sqlite3.connect(out)
db.executescript('''
CREATE TABLE type(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL);
CREATE TABLE type_name(type_id INTEGER, lang TEXT, name TEXT NOT NULL, PRIMARY KEY(type_id, lang)) WITHOUT ROWID;
CREATE TABLE ability(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL, generation INTEGER);
CREATE TABLE ability_name(ability_id INTEGER, lang TEXT, name TEXT NOT NULL, PRIMARY KEY(ability_id, lang)) WITHOUT ROWID;
CREATE TABLE move(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL, type_id INTEGER, power INTEGER, pp INTEGER, accuracy INTEGER, damage_class TEXT, generation INTEGER);
CREATE TABLE move_name(move_id INTEGER, lang TEXT, name TEXT NOT NULL, PRIMARY KEY(move_id, lang)) WITHOUT ROWID;
CREATE TABLE species(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL, generation INTEGER, is_legendary INTEGER, is_mythical INTEGER);
CREATE TABLE species_name(species_id INTEGER, lang TEXT, name TEXT NOT NULL, PRIMARY KEY(species_id, lang)) WITHOUT ROWID;
CREATE TABLE pokemon(id INTEGER PRIMARY KEY, identifier TEXT NOT NULL, species_id INTEGER NOT NULL, is_default INTEGER, height INTEGER, weight INTEGER);
CREATE TABLE pokemon_type(pokemon_id INTEGER, slot INTEGER, type_id INTEGER, until_generation INTEGER, PRIMARY KEY(pokemon_id, slot, until_generation));
CREATE TABLE pokemon_stat(pokemon_id INTEGER, stat TEXT, base_stat INTEGER, until_generation INTEGER, PRIMARY KEY(pokemon_id, stat, until_generation));
CREATE TABLE pokemon_ability(pokemon_id INTEGER, slot INTEGER, ability_id INTEGER, is_hidden INTEGER, PRIMARY KEY(pokemon_id, slot));
CREATE TABLE pokemon_move(pokemon_id INTEGER, version_group TEXT, move_id INTEGER, method TEXT, level INTEGER);
''')
t0 = time.time()
gen = lambda o: idof(o['generation'])
for o in load('type'):
    if o['id'] > 10000: continue
    db.execute('INSERT INTO type VALUES(?,?)', (o['id'], o['name']))
    db.executemany('INSERT INTO type_name VALUES(?,?,?)', [(o['id'], l, n) for l, n in names(o)])
for o in load('ability'):
    db.execute('INSERT INTO ability VALUES(?,?,?)', (o['id'], o['name'], gen(o)))
    db.executemany('INSERT INTO ability_name VALUES(?,?,?)', [(o['id'], l, n) for l, n in names(o)])
for o in load('move'):
    db.execute('INSERT INTO move VALUES(?,?,?,?,?,?,?,?)', (o['id'], o['name'], idof(o['type']), o['power'], o['pp'], o['accuracy'], o['damage_class']['name'], gen(o)))
    db.executemany('INSERT INTO move_name VALUES(?,?,?)', [(o['id'], l, n) for l, n in names(o)])
for o in load('pokemon-species'):
    db.execute('INSERT INTO species VALUES(?,?,?,?,?)', (o['id'], o['name'], gen(o), int(o['is_legendary']), int(o['is_mythical'])))
    db.executemany('INSERT INTO species_name VALUES(?,?,?)', [(o['id'], l, n) for l, n in names(o)])
INF = 99
for o in load('pokemon'):
    pid = o['id']
    db.execute('INSERT INTO pokemon VALUES(?,?,?,?,?,?)', (pid, o['name'], idof(o['species']), int(o['is_default']), o['height'], o['weight']))
    for t in o['types']: db.execute('INSERT INTO pokemon_type VALUES(?,?,?,?)', (pid, t['slot'], idof(t['type']), INF))
    for pt in o['past_types']:
        g = idof(pt['generation'])
        for t in pt['types']: db.execute('INSERT INTO pokemon_type VALUES(?,?,?,?)', (pid, t['slot'], idof(t['type']), g))
    for s in o['stats']: db.execute('INSERT INTO pokemon_stat VALUES(?,?,?,?)', (pid, s['stat']['name'], s['base_stat'], INF))
    for ps in o['past_stats']:
        g = idof(ps['generation'])
        for s in ps['stats']: db.execute('INSERT INTO pokemon_stat VALUES(?,?,?,?)', (pid, s['stat']['name'], s['base_stat'], g))
    for a in o['abilities']: db.execute('INSERT INTO pokemon_ability VALUES(?,?,?,?)', (pid, a['slot'], idof(a['ability']), int(a['is_hidden'])))
    rows = []
    for m in o['moves']:
        mid = idof(m['move'])
        for d in m['version_group_details']:
            rows.append((pid, d['version_group']['name'], mid, d['move_learn_method']['name'], d['level_learned_at']))
    db.executemany('INSERT INTO pokemon_move VALUES(?,?,?,?,?)', rows)
db.executescript('''
CREATE INDEX ix_pokemon_move ON pokemon_move(pokemon_id, version_group);
CREATE INDEX ix_species_name ON species_name(name COLLATE NOCASE);
CREATE INDEX ix_move_name ON move_name(name COLLATE NOCASE);
CREATE INDEX ix_pokemon_species ON pokemon(species_id);
''')
db.commit(); db.execute('VACUUM'); db.close()
print('generazione: %.1f s' % (time.time() - t0))
