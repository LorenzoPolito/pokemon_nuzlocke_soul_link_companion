# Nuzlocke SoulLink Companion – Schema del Pokédex SQLite

Documento di output di P2-07. Descrive il file SQLite del Pokédex, generato in build da [PokeAPI/api-data](https://github.com/PokeAPI/api-data) e letto in sola lettura dall'app. Lo schema è stato scritto e provato con lo script di prova [`tools/prove/build_pokedex.py`](../../tools/prove/build_pokedex.py) (schema versione 2, 20 ottobre 2026); lo script di produzione nasce in P3-04. Le convenzioni dei dati storici sono quelle verificate in [P1-02 e P1-03](10-Analisi-delle-fonti-dati.md).

## Principi

- **Sola lettura.** Il file sta nell'immagine, si apre con `mode=ro` e non si modifica mai a runtime. Un aggiornamento dei dati è un nuovo rilascio.
- **Identificativi di PokéAPI.** Gli `id` numerici e gli `identifier` testuali sono quelli di PokéAPI. Il database dell'app e i dati di gioco richiamano specie, mosse, abilità e tipi per `identifier` (chiave stabile, per esempio `surf`) o per `id`, mai per nome visualizzato ([modello dati](06-Modello-dati-bozza.md#principi)).
- **Specie e varietà.** `species` è la specie; `pokemon` è la varietà con le sue statistiche e i suoi tipi. Ogni specie ha una varietà predefinita (`is_default = 1`), che per 37 specie ha un `id` diverso da quello della specie: si cerca sempre per `species_id`, mai assumendo `pokemon.id = species.id` ([P1-02](10-Analisi-delle-fonti-dati.md)). `specimen.variety_id` del database dell'app è un `pokemon.id`.
- **Dati per generazione e per gioco.** I dati che cambiano nel tempo hanno una colonna esplicita (`until_generation`, `before_vg_ord`, `version_group_id`); una run legge i valori del proprio gioco con le regole sotto.
- **Nomi in una tabella sola**, con riserva in lettura.
- **Nessuna ridondanza calcolabile.** Le tabelle dei tipi per epoca, le difficoltà e i level cap non sono qui: sono in `data/mechanics/type-chart.json` e `data/games/*.json`.

## Tabelle

| Tabella | Contenuto | Chiave | Righe (prova) |
| --- | --- | --- | --- |
| `meta` | `schema_version` e, in produzione, il commit di api-data e la data di generazione | `key` | 1 |
| `name` | Nomi localizzati (`entity`, `id`, `lang`, `name`) per `species`, `move`, `ability`, `type`, `nature`, `version`, `location` | (`entity`, `id`, `lang`) | 6 184 |
| `generation`, `version_group`, `version` | Generazioni; gruppi di versioni con `ord` (ordine cronologico); versioni, ciascuna in un gruppo | `id` | 9 / 32 / 53 |
| `type` | I 18 tipi e `stellar` (per la Teracristallizzazione, 1.0); `unknown` e `shadow` esclusi (id < 10000). La tabella dei tipi per epoca non include `stellar` ([P1-08](13-Meccaniche-per-generazione.md)) | `id` | 19 |
| `nature` | Nature con statistica aumentata e diminuita | `id` | 25 |
| `ability` | Abilità e generazione di comparsa | `id` | 374 |
| `move` | Mosse con tipo, potenza, PP, precisione, priorità, categoria **attuali** | `id` | 937 |
| `move_past` | Valori precedenti di tipo, potenza, PP, precisione | (`move_id`, `before_vg_ord`) | 198 |
| `species` | Specie, generazione, catena evolutiva, evoluzione da, flag baby, leggendario, mitico | `id` | 1 025 |
| `pokemon` | Varietà: specie, predefinita, altezza, peso | `id` | 1 351 |
| `pokemon_type` | Tipi per slot, con `until_generation` | (`pokemon_id`, `until_generation`, `slot`) | |
| `pokemon_stat` | Statistiche base, con `until_generation` | (`pokemon_id`, `until_generation`, `stat`) | |
| `pokemon_ability` | Abilità per slot e se nascosta, con `until_generation` | (`pokemon_id`, `until_generation`, `slot`) | |
| `pokemon_move` | Learnset: varietà, `version_group_id`, mossa, metodo, livello | nessuna (indici sotto) | 638 321 |
| `evolution` | Una riga per ogni condizione di evoluzione: catena, da, a, `trigger`, `min_level`, `item`, `details` JSON per le altre condizioni | nessuna | 677 |
| `location`, `location_area` | Luoghi e aree di luogo di PokéAPI | `id` | 1 104 / 1 539 |
| `encounter` | Incontri selvatici: area di luogo, varietà, versione, metodo, livelli, probabilità, condizioni JSON | nessuna | 117 127 |

Il file della prova misura 41,9 MB (10,6 MB compresso con gzip), 14 s per generarlo (clone parziale escluso).

## Regole di lettura

### Storico di tipi, statistiche e abilità

`until_generation` è l'**ultima generazione in cui valgono i valori della riga**; 99 vale per i valori attuali. Per la generazione G del gioco si usa la riga con `until_generation >= G` e il valore più basso tra quelle ammesse. Esempio verificato: Clefairy ha Normale con `until_generation = 5` e Folletto con 99, quindi in un gioco di quinta generazione è Normale, in sesta Folletto.

```sql
-- tipi della varietà :pokemon_id per la generazione :gen
SELECT slot, type_id FROM pokemon_type
 WHERE pokemon_id = :pokemon_id
   AND until_generation = (SELECT MIN(until_generation) FROM pokemon_type
                            WHERE pokemon_id = :pokemon_id AND until_generation >= :gen)
 ORDER BY slot;
```

La stessa query vale per `pokemon_stat` e `pokemon_ability` (con la colonna `slot` o `stat`).

### Mosse: valori per gruppo di versioni

`move` ha i valori attuali. `move_past` ha, per ogni modifica, i valori **precedenti** alla comparsa del nuovo valore nel gruppo `before_vg_ord` (convenzione opposta a quella di tipi e statistiche, [P1-03](10-Analisi-delle-fonti-dati.md)). Un campo `NULL` in `move_past` vuol dire «non cambiato in quel passaggio». Per il gruppo di versioni con ordine V, il valore di ogni campo è quello della riga con il `before_vg_ord` più basso **maggiore di V** che ha il campo non nullo; se non c'è, il valore di `move`.

Verifica: Colpo (Tackle, id 33) ha oggi potenza 40 e precisione 100. `move_past` ha (ord 15: potenza 35, precisione 95) e (ord 19: potenza 50). In Nero 2 e Bianco 2 (ord 16): potenza = riga ord 19 → 50; precisione = nessuna riga a partire da 19 ha il campo → 100. Sono i valori di quinta generazione.

La **categoria** (fisico, speciale, di stato) non è storicizzata: nelle generazioni 1–3 si deriva dal tipo ([P1-09](13-Meccaniche-per-generazione.md)), dalla quarta si usa quella di `move`.

### Learnset

`pokemon_move` ha una riga per varietà, gruppo di versioni, mossa e metodo di apprendimento (`level-up`, `machine`, `egg`, `tutor`, …). Una run legge solo le righe del `version_group_id` del suo gioco. Per le espansioni e per Leggende: Z-A PokéAPI non ha learnset (limite noto, [P1-03](10-Analisi-delle-fonti-dati.md)).

### Nomi e riserva

Per mostrare un nome si cerca la lingua scelta e si ripiega sull'inglese, poi sull'`identifier`:

```sql
SELECT COALESCE(
  (SELECT name FROM name WHERE entity = 'move' AND id = m.id AND lang = :lang),
  (SELECT name FROM name WHERE entity = 'move' AND id = m.id AND lang = 'en'),
  m.identifier) AS label
FROM move m WHERE m.id = :id;
```

In PokéAPI mancano 63 nomi italiani di abilità (nona generazione e poche altre); la riserva inglese li copre. La ricerca per nome usa l'indice `ix_name_search` (`entity`, `name` senza distinzione di maiuscole).

### Evoluzioni

`species.evolution_chain_id` identifica la catena; `evolution` ha le righe di quella catena. Per la dupes clause «già posseduta» vale per la catena: l'insieme delle specie con lo stesso `evolution_chain_id` ([modello dati](06-Modello-dati-bozza.md)). Una coppia (da, a) può comparire più volte, una per condizione alternativa (Eevee → Glaceon ha cinque righe per luoghi diversi): per l'elenco delle specie si usa `DISTINCT`. La tabella non riproduce le condizioni di gioco per generazione; quelle servono solo alla scheda del Pokédex.

### Incontri e dati di gioco

`encounter` collega aree di luogo di PokéAPI, varietà e **versioni** (non gruppi: `black-2` e `white-2` hanno righe distinte). I file di gioco indicano per ogni area il luogo di PokéAPI (`pokeapiLocation`, l'`identifier` di `location`); le aree di luogo di quel luogo (`location_area.location_id`) danno gli incontri. L'ordine delle aree e le stanze interne vengono dai file di gioco, non da qui ([P1-04, P1-06](10-Analisi-delle-fonti-dati.md)).

```sql
-- incontri selvatici in Nero 2 per un luogo
SELECT p.identifier, e.method, e.min_level, e.max_level, e.chance
  FROM encounter e
  JOIN location_area la ON la.id = e.location_area_id
  JOIN location l ON l.id = la.location_id
  JOIN version v ON v.id = e.version_id
  JOIN pokemon p ON p.id = e.pokemon_id
 WHERE l.identifier = :pokeapiLocation AND v.identifier = 'black-2';
```

### Verifica degli schemi

Le interrogazioni sopra sono state eseguite sul file della prova: 137 aree di luogo con incontri in Nero 2, incontri della Route 19 (Basculin, Poliwag, Poliwhirl, con livelli e probabilità), catena evolutiva di Eevee, tipi di Clefairy, valori di Colpo per Nero 2.

## Indici

| Indice | Serve a |
| --- | --- |
| `ix_name_search (entity, name NOCASE)` | Ricerca per nome nella lista e nel selettore |
| `ix_pokemon_species (species_id)` | Varietà di una specie |
| `ix_pokemon_move_p (pokemon_id, version_group_id)` | Learnset di un esemplare nel suo gioco |
| `ix_pokemon_move_m (move_id, version_group_id)` | Chi impara una mossa |
| `ix_species_chain`, `ix_evolution_chain`, `ix_evolution_to` | Catena evolutiva e dupes clause |
| `ix_encounter_area (location_area_id, version_id)`, `ix_encounter_pokemon (pokemon_id, version_id)` | Incontri di un'area e dove si trova una specie |
| `ix_location_area (location_id)` | Aree di un luogo |

## Come si genera e si aggiorna

Il generatore di produzione è `scripts/build-pokedex.ts` ([P3-04](../backlog/30-Fase-3-Fondamenta.md)); lo script Python di prova resta in `tools/prove/` finché il product owner non conferma l'eliminazione.

- Clone parziale di api-data (`--filter=blob:none --sparse`) sulle cartelle usate; il commit usato si scrive in `meta` e in un file del repository.
- Un controllo di coerenza dopo la generazione: conteggi attesi (specie, varietà, mosse, learnset) e che ogni `identifier` usato dai file di gioco esista. Un controllo fallito blocca la build.
- Aggiornare il commit di api-data è una decisione del progetto, non automatica.

## Limiti

- Nessun testo descrittivo (flavor text, effetti delle mosse) né sprite: il progetto non li include nell'MVP ([P1-10](10-Analisi-delle-fonti-dati.md)).
- Le condizioni di evoluzione sono salvate come arrivano, senza storico per generazione.
- I nomi sono solo italiano e inglese; per un'altra lingua basta aggiungerla all'insieme `LANGS` dello script.

## Domande aperte

Nessuna.
