# Nuzlocke SoulLink Companion – Dati di gioco: aree, medaglie, level cap

Documento di output di P1-06 (ordine delle aree) e P1-07 (medaglie e level cap). Descrive le fonti, il formato dei file in `data/games/` e il processo per mantenerli. I dati veri e propri sono nei file JSON, non qui: questo documento ne riporta un riepilogo leggibile.

## Fonti

| Fonte | Versione | Uso | Licenza |
| --- | --- | --- | --- |
| [nuzlocke.data](https://github.com/domtronn/nuzlocke.data) | commit `baf5df5` (27 maggio 2023), file `routes/bl.txt`, `wh.txt`, `bl2.txt`, `wh2.txt` e `leagues/bw.txt`, `b2w2.txt` | Ordine delle aree, lotte dei boss | Nessuna: uso privato accettato ([decisione 7](../decisioni.md#7-dati-di-gioco-da-nuzlockedata-e-pokéapi)) |
| PokéAPI, CSV di [PokeAPI/pokeapi](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv) | commit `6fd69df` | Chiavi e nomi inglesi delle località, incontri selvatici, regali, incontri fissi, scambi, starter, nomi dei giochi | BSD a 3 clausole |
| [Bulbapedia, guida di Nero e Bianco](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Black_and_White) e [di Nero 2 e Bianco 2](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Black_2_and_White_2) | consultata il 19 ottobre 2026 | Seconda fonte per l'ordine: le parti della guida seguono la progressione | CC BY-NC-SA, solo consultazione |
| Bulbapedia e [Serebii](https://www.serebii.net/blackwhite/trade.shtml), scambi in gioco di Nero e Bianco | consultati il 19 ottobre 2026 | I 5 scambi assenti in PokéAPI | Solo consultazione |

Accesso alle fonti: dall'ambiente dell'agente sono raggiungibili solo GitHub e la ricerca web. Bulbapedia e Serebii sono stati consultati **attraverso i risultati della ricerca web**, non aprendo le pagine: per questo una parte delle aree risulta "non verificata", perché i risultati non riportavano le parti della guida che le contengono.

## Formato dei file

Un file per gioco, `data/games/<game_id>.json`, dove `game_id` è l'identificatore della versione in PokéAPI (`black`, `white`, `black-2`, `white-2`). Lo schema è [`data/games/game.schema.json`](../../data/games/game.schema.json) (JSON Schema 2020-12); all'avvio dell'app lo stesso schema sarà espresso in Zod e un file non valido bloccherà l'avvio ([Modello dati](06-Modello-dati-bozza.md#dati-fuori-dal-database)).

| Campo | Contenuto |
| --- | --- |
| `schemaVersion` | Versione dello schema, oggi 1 |
| `gameId`, `generation`, `versionGroup`, `region` | Identità del gioco, con le chiavi di PokéAPI |
| `dataVersion` | Versione dei dati, `AAAA.MM.GG-N`; si registra in `run.game_data_version` alla creazione di una run |
| `names` | Nome del gioco in inglese e italiano (da PokéAPI) |
| `runColor` | Colore della run (`run-accent` del design system); oggi `null`, da definire con il design |
| `sources` | Fonti usate nel file, con la versione esatta |
| `areas` | Aree in ordine di progressione (vedi sotto) |
| `specialEncounters` | Regali, incontri fissi e scambi in gioco (vedi sotto) |

Ogni **area** ha:

- `key`: la chiave stabile (`area_key` del modello dati). È l'identificatore della località in PokéAPI (`unova-route-19`), così gli incontri suggeriti si leggono dal Pokédex senza tabelle di corrispondenza. Fa eccezione `starter`.
- `names`: nome inglese da PokéAPI e nome italiano (`null` se manca: l'app usa l'inglese).
- `pokeapiLocation`: la località PokéAPI da cui leggere gli incontri, `null` per `starter`.
- `phase`: `story` fino alla lotta finale della storia (Ghetsis in Nero e Bianco, Iris campionessa in Nero 2 e Bianco 2), poi `postgame`.
- `hasWildEncounters`: se PokéAPI ha incontri selvatici per quell'area nella versione del file. Un'area senza incontri selvatici esiste lo stesso se ci sono regali, incontri fissi o scambi.
- `starters`: solo nell'area `starter`, le specie offerte.
- `source`: la fonte **riga per riga**. `entry` dice da dove viene la riga (per esempio `nuzlocke.data@baf5df5 routes/bl.txt:4`), `check` l'esito della verifica d'ordine con la seconda fonte, `note` le correzioni e le avvertenze.

Ogni **incontro speciale** ha una chiave propria `<tipo>-<area>-<specie>`, il tipo (`gift`, `static`, `trade`), l'area di appartenenza `areaKey`, la specie, il livello (fisso, intervallo o `null`), le eventuali condizioni di PokéAPI (fossile, stagione, avanzamento) e la fonte. Con la regola "regali separati" attiva è un gruppo nello slot `gift`; senza, conta come incontro dell'area `areaKey` ([decisione 17](../decisioni.md#17-regali-incontri-fissi-e-scambi-in-gioco)).

L'area **`starter`** è sempre la prima ([decisione 16](../decisioni.md#16-starter-come-incontro-collegato-nellarea-starter)); gli starter vengono dai regali di PokéAPI nella città di partenza (`nuvema-town` o `aspertia-city`) e non compaiono anche tra gli incontri speciali.

Non stanno nei file: le specie degli incontri selvatici (si leggono dal Pokédex tramite `pokeapiLocation`), gli sciami e le grotte nascoste (vedi le domande aperte).

## Processo

1. **Import**: un generatore legge i file di nuzlocke.data nell'ordine in cui sono scritti e associa ogni nome di area alla località PokéAPI (con poche correzioni di nome: `Iccirus City` → `icirrus-city`, `Nature Preserve` → `nature-sanctuary`, `Victory Road` di Nero 2 e Bianco 2 → `unova-victory-road-2`).
2. **Completamento**: le località con incontri in PokéAPI che mancano in nuzlocke.data si inseriscono accanto all'area a cui appartengono o nella posizione indicata dalla guida di Bulbapedia, con una nota.
3. **Verifica**: ogni area è confrontata con le parti della guida di Bulbapedia; `check` dice "confermato" con la parte, oppure "non verificato".
4. **Validazione**: i file passano lo schema e un controllo che ogni `areaKey` esista tra le aree. Il generatore non è nel repository finché non esiste il progetto Node (P3-01): quando servirà rigenerare, diventerà uno script del progetto (P3-04 o un PBI dedicato).

Una correzione ai dati è una modifica del file JSON in una pull request, con la fonte annotata nella riga e `dataVersion` incrementata.

## Aree personalizzate dell'admin

- L'admin aggiunge un'area a un gioco dal pannello admin; l'area finisce nella tabella `custom_area` del database (`game_id`, nome, `after_area_key`, autore), mai nei file JSON ([Modello dati](06-Modello-dati-bozza.md#tabelle-di-supporto)).
- La sua chiave è `custom:<id>`; nell'ordine compare subito dopo `after_area_key`. Più aree personalizzate dopo la stessa area seguono l'ordine di creazione.
- Un'area personalizzata non ha incontri suggeriti: la specie si sceglie da tutto il Pokédex.
- Se un aggiornamento dei dati di gioco toglie l'area indicata in `after_area_key`, l'area personalizzata va in fondo all'elenco e l'admin vede un avviso; nessuna run perde dati, perché i gruppi richiamano la chiave `custom:<id>`.
- Un'area personalizzata vale per tutte le run di quel gioco, anche quelle già iniziate: un'area in più non cambia gli incontri già registrati.

## P1-06 Ordine di progressione delle aree

Data: 19 ottobre 2026. Taglia M.

### Risultato

| File | Aree | Storia / postgame | Ordine confermato da Bulbapedia | Regali / fissi / scambi |
| --- | --- | --- | --- | --- |
| [`black.json`](../../data/games/black.json) | 51 | 36 / 15 | 36 | 15 / 14 / 5 |
| [`white.json`](../../data/games/white.json) | 52 (in più White Forest) | 36 / 16 | 37 | 15 / 14 / 5 |
| [`black-2.json`](../../data/games/black-2.json) | 69 | 41 / 28 | 43 | 15 / 25 / 6 |
| [`white-2.json`](../../data/games/white-2.json) | 69 | 41 / 28 | 43 | 15 / 25 / 6 |

Tutte le località di Unima con incontri selvatici in PokéAPI hanno un'area; nessun incontro speciale resta senza area.

Correzioni rispetto a nuzlocke.data:

- **Celestial Tower** (Nero e Bianco): spostata subito dopo Route 7. nuzlocke.data la mette dopo Route 17, Route 18 e P2 Laboratory, ma la guida di Bulbapedia (parte 7) la colloca prima della palestra di Mistralton, che la richiede.
- **White Forest**: tolta da `black.json`, perché esiste solo in Bianco; nuzlocke.data la riporta in entrambe le versioni.
- **Aree aggiunte** da PokéAPI, assenti in nuzlocke.data: Guidance Chamber (tutti e quattro), Trial Chamber, N's Castle, Challenger's Cave, Giant Chasm (Nero e Bianco), Route 8, la vecchia Victory Road e le tre stanze di Underground Ruins (Nero 2 e Bianco 2).
- **Scambi in gioco di Nero e Bianco**: 5, aggiunti a mano da Bulbapedia e Serebii, con livello `null` (non riportato).

Differenze d'ordine lasciate come in nuzlocke.data, perché riguardano aree opzionali o postgame il cui ordine dipende dal giocatore: Route 16, Lostlorn Forest e Liberty Garden in Nero e Bianco (la guida mette Route 16 prima di Lostlorn Forest); Relic Passage in Nero 2 e Bianco 2 (la guida la percorre dopo Driftveil City); l'ordine del postgame di Nero 2 e Bianco 2 (la guida visita Route 14 e Abundant Shrine prima di Route 15 e Marvelous Bridge).

### Ordine delle aree

Le tabelle sono generate dai file JSON; in caso di differenze valgono i file.

#### Nero e Bianco

| # | Area (`key`) | Nome inglese | Fase | Selvatici in PokéAPI | Ordine verificato | Note |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `starter` | Starter | storia | no | sì, Part 1 (scelta dello starter) | Area speciale (decisione 16). Starter da PokéAPI: regali in `nuvema-town` (snivy, tepig, oshawott, pokeapi@6fd69df encounters gift) |
| 2 | `unova-route-1` | Route 1 | storia | sì | sì, Part 1 |  |
| 3 | `unova-route-2` | Route 2 | storia | sì | sì, Part 2 |  |
| 4 | `striaton-city` | Striaton City | storia | sì | sì, Part 2 |  |
| 5 | `dreamyard` | Dreamyard | storia | sì | sì, Part 2 |  |
| 6 | `unova-route-3` | Route 3 | storia | sì | sì, Part 3 |  |
| 7 | `wellspring-cave` | Wellspring Cave | storia | sì | sì, Part 3 |  |
| 8 | `nacrene-city` | Nacrene City | storia | no | sì, Part 3 |  |
| 9 | `pinwheel-forest` | Pinwheel Forest | storia | sì | sì, Part 4 |  |
| 10 | `castelia-city` | Castelia City | storia | no | sì, Part 4 |  |
| 11 | `unova-route-4` | Route 4 | storia | sì | sì, Part 5 |  |
| 12 | `desert-resort` | Desert Resort | storia | sì | sì, Part 5 |  |
| 13 | `relic-castle` | Relic Castle | storia | sì | sì, Part 5 |  |
| 14 | `unova-route-5` | Route 5 | storia | sì | sì, Part 6 |  |
| 15 | `driftveil-drawbridge` | Driftveil Drawbridge | storia | sì | sì, Part 6 |  |
| 16 | `driftveil-city` | Driftveil City | storia | sì | sì, Part 6 |  |
| 17 | `cold-storage` | Cold Storage | storia | sì | sì, Part 6 |  |
| 18 | `unova-route-6` | Route 6 | storia | sì | sì, Part 7 |  |
| 19 | `mistralton-cave` | Mistralton Cave | storia | sì | no |  |
| 20 | `guidance-chamber` | Guidance Chamber | storia | sì | no | Assente in nuzlocke.data; parte interna di Mistralton Cave, messa subito dopo |
| 21 | `chargestone-cave` | Chargestone Cave | storia | sì | sì, Part 7 |  |
| 22 | `unova-route-7` | Route 7 | storia | sì | sì, Part 7 |  |
| 23 | `celestial-tower` | Celestial Tower | storia | sì | sì, Part 7 | Spostata prima di Route 17: in nuzlocke.data è dopo P2 Laboratory, ma la visita è obbligatoria prima della palestra di Mistralton (Bulbapedia, Walkthrough:Pokémon Black and White/Part 7) |
| 24 | `unova-route-17` | Route 17 | storia | sì | no |  |
| 25 | `unova-route-18` | Route 18 | storia | sì | no |  |
| 26 | `p2-laboratory` | P2 Laboratory | storia | sì | no |  |
| 27 | `twist-mountain` | Twist Mountain | storia | sì | no |  |
| 28 | `icirrus-city` | Icirrus City | storia | sì | no |  |
| 29 | `dragonspiral-tower` | Dragonspiral Tower | storia | sì | no |  |
| 30 | `unova-route-8` | Route 8 | storia | sì | no |  |
| 31 | `moor-of-icirrus` | Moor of Icirrus | storia | sì | no |  |
| 32 | `unova-route-9` | Route 9 | storia | sì | no |  |
| 33 | `unova-route-10` | Route 10 | storia | sì | no |  |
| 34 | `unova-victory-road` | Victory Road | storia | sì | no |  |
| 35 | `trial-chamber` | Trial Chamber | storia | sì | no | Assente in nuzlocke.data; stanza di Victory Road, messa subito dopo |
| 36 | `ns-castle` | N's Castle | storia | no | sì, Part 12 | Assente in nuzlocke.data; incontro fisso con il leggendario della versione, alla fine della storia (Bulbapedia, Walkthrough:Pokémon Black and White/Part 12) |
| 37 | `challengers-cave` | Challenger's Cave | postgame | sì | sì, Part 14 | Assente in nuzlocke.data; postgame, prima di Route 11 (Bulbapedia, Walkthrough:Pokémon Black and White/Part 14) |
| 38 | `unova-route-11` | Route 11 | postgame | sì | sì, Part 16 |  |
| 39 | `village-bridge` | Village Bridge | postgame | sì | sì, Part 16 |  |
| 40 | `unova-route-12` | Route 12 | postgame | sì | sì, Part 16 |  |
| 41 | `unova-route-13` | Route 13 | postgame | sì | sì, Part 16 |  |
| 42 | `giant-chasm` | Giant Chasm | postgame | sì | sì, Part 16 | Assente in nuzlocke.data; dopo Route 13 (Bulbapedia, Walkthrough:Pokémon Black and White/Part 16) |
| 43 | `undella-town` | Undella Town | postgame | sì | sì, Part 17 |  |
| 44 | `undella-bay` | Undella Bay | postgame | sì | sì, Part 17 |  |
| 45 | `unova-route-14` | Route 14 | postgame | sì | sì, Part 17 |  |
| 46 | `abundant-shrine` | Abundant Shrine | postgame | sì | sì, Part 17 |  |
| 47 | `white-forest` | White Forest | postgame | no | sì, Part 18 | Esclusiva di Bianco. PokéAPI non ha incontri per quest'area: specie da completare a mano (P1-04) |
| 48 | `unova-route-15` | Route 15 | postgame | sì | sì, Part 18 |  |
| 49 | `marvelous-bridge` | Marvelous Bridge | postgame | sì | sì, Part 18 |  |
| 50 | `lostlorn-forest` | Lostlorn Forest | postgame | sì | sì, Part 18 | Ordine di nuzlocke.data; Bulbapedia, Walkthrough:Pokémon Black and White/Part 18 mette Route 16 prima di Lostlorn Forest. Postgame: l'ordine è a scelta del giocatore |
| 51 | `liberty-garden` | Liberty Garden | postgame | no | no | Ordine di nuzlocke.data; Bulbapedia, Walkthrough:Pokémon Black and White/Part 18 mette Route 16 prima di Lostlorn Forest. Postgame: l'ordine è a scelta del giocatore. Raggiungibile solo con il Liberty Pass, distribuito come evento |
| 52 | `unova-route-16` | Route 16 | postgame | sì | sì, Part 18 | Ordine di nuzlocke.data; Bulbapedia, Walkthrough:Pokémon Black and White/Part 18 mette Route 16 prima di Lostlorn Forest. Postgame: l'ordine è a scelta del giocatore |

#### Nero 2 e Bianco 2

| # | Area (`key`) | Nome inglese | Fase | Selvatici in PokéAPI | Ordine verificato | Note |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `starter` | Starter | storia | no | sì, Part 1 (scelta dello starter) | Area speciale (decisione 16). Starter da PokéAPI: regali in `aspertia-city` (snivy, tepig, oshawott, pokeapi@6fd69df encounters gift) |
| 2 | `aspertia-city` | Aspertia City | storia | sì | sì, Part 1 |  |
| 3 | `unova-route-19` | Route 19 | storia | sì | sì, Part 1 |  |
| 4 | `floccesy-town` | Floccesy Town | storia | no | sì, Part 1 |  |
| 5 | `unova-route-20` | Route 20 | storia | sì | sì, Part 2 |  |
| 6 | `floccesy-ranch` | Floccesy Ranch | storia | sì | sì, Part 2 |  |
| 7 | `virbank-city` | Virbank City | storia | sì | sì, Part 3 |  |
| 8 | `virbank-complex` | Virbank Complex | storia | sì | sì, Part 3 |  |
| 9 | `castelia-city` | Castelia City | storia | sì | sì, Part 4 |  |
| 10 | `castelia-sewers` | Castelia Sewers | storia | sì | sì, Part 4 |  |
| 11 | `relic-passage` | Relic Passage | storia | sì | sì, Part 8 | Ordine di nuzlocke.data; Bulbapedia, Walkthrough:Pokémon Black 2 and White 2/Part 8 la percorre dopo Driftveil City |
| 12 | `unova-route-4` | Route 4 | storia | sì | sì, Part 5 |  |
| 13 | `desert-resort` | Desert Resort | storia | sì | sì, Part 5 |  |
| 14 | `relic-castle` | Relic Castle | storia | sì | sì, Part 5 |  |
| 15 | `unova-route-16` | Route 16 | storia | sì | sì, Part 6 |  |
| 16 | `lostlorn-forest` | Lostlorn Forest | storia | sì | sì, Part 6 |  |
| 17 | `unova-route-5` | Route 5 | storia | sì | sì, Part 7 |  |
| 18 | `driftveil-drawbridge` | Driftveil Drawbridge | storia | sì | no |  |
| 19 | `driftveil-city` | Driftveil City | storia | no | sì, Part 7 |  |
| 20 | `unova-route-6` | Route 6 | storia | sì | sì, Part 9 |  |
| 21 | `mistralton-cave` | Mistralton Cave | storia | sì | sì, Part 9 |  |
| 22 | `guidance-chamber` | Guidance Chamber | storia | sì | no | Assente in nuzlocke.data; parte interna di Mistralton Cave, messa subito dopo |
| 23 | `chargestone-cave` | Chargestone Cave | storia | sì | sì, Part 9 |  |
| 24 | `unova-route-7` | Route 7 | storia | sì | sì, Part 10 |  |
| 25 | `celestial-tower` | Celestial Tower | storia | sì | sì, Part 10 |  |
| 26 | `reversal-mountain` | Reversal Mountain | storia | sì | sì, Part 11 |  |
| 27 | `strange-house` | Strange House | storia | sì | sì, Part 11 |  |
| 28 | `undella-town` | Undella Town | storia | sì | no |  |
| 29 | `undella-bay` | Undella Bay | storia | sì | no |  |
| 30 | `unova-route-13` | Route 13 | storia | sì | sì, Part 12 |  |
| 31 | `unova-route-12` | Route 12 | storia | sì | no |  |
| 32 | `village-bridge` | Village Bridge | storia | sì | sì, Part 12 |  |
| 33 | `unova-route-11` | Route 11 | storia | sì | sì, Part 12 |  |
| 34 | `unova-route-9` | Route 9 | storia | sì | no |  |
| 35 | `seaside-cave` | Seaside Cave | storia | sì | no |  |
| 36 | `unova-route-21` | Route 21 | storia | sì | no |  |
| 37 | `humilau-city` | Humilau City | storia | sì | no |  |
| 38 | `unova-route-22` | Route 22 | storia | sì | no |  |
| 39 | `giant-chasm` | Giant Chasm | storia | sì | no |  |
| 40 | `unova-route-23` | Route 23 | storia | sì | sì, Part 15 |  |
| 41 | `unova-victory-road-2` | Victory Road | storia | sì | sì, Part 15 |  |
| 42 | `marvelous-bridge` | Marvelous Bridge | postgame | sì | sì, Part 18 |  |
| 43 | `unova-route-15` | Route 15 | postgame | sì | sì, Part 18 |  |
| 44 | `unova-route-14` | Route 14 | postgame | sì | sì, Part 18 |  |
| 45 | `abundant-shrine` | Abundant Shrine | postgame | sì | sì, Part 18 |  |
| 46 | `unova-route-8` | Route 8 | postgame | sì | sì, Part 19 | Assente in nuzlocke.data; postgame, prima di Moor of Icirrus (Bulbapedia, Walkthrough:Pokémon Black 2 and White 2/Part 19) |
| 47 | `unova-victory-road` | Victory Road (Black and White) | postgame | sì | sì, Part 19 | Assente in nuzlocke.data; postgame, prima di Moor of Icirrus (Bulbapedia, Walkthrough:Pokémon Black 2 and White 2/Part 19) |
| 48 | `moor-of-icirrus` | Moor of Icirrus | postgame | sì | no |  |
| 49 | `icirrus-city` | Icirrus City | postgame | sì | sì, Part 19 |  |
| 50 | `dragonspiral-tower` | Dragonspiral Tower | postgame | sì | sì, Part 19 |  |
| 51 | `twist-mountain` | Twist Mountain | postgame | sì | no |  |
| 52 | `clay-tunnel` | Clay Tunnel | postgame | sì | no |  |
| 53 | `underground-ruins` | Underground Ruins | postgame | sì | no |  |
| 54 | `rocky-mountain-room` | Rocky Mountain Room | postgame | sì | no | Assente in nuzlocke.data; stanza di Underground Ruins, messa subito dopo |
| 55 | `iron-room` | Iron Room | postgame | sì | no | Assente in nuzlocke.data; stanza di Underground Ruins, messa subito dopo |
| 56 | `glacier-room` | Glacier Room | postgame | sì | no | Assente in nuzlocke.data; stanza di Underground Ruins, messa subito dopo |
| 57 | `pinwheel-forest` | Pinwheel Forest | postgame | sì | no |  |
| 58 | `nacrene-city` | Nacrene City | postgame | no | no |  |
| 59 | `unova-route-3` | Route 3 | postgame | sì | no |  |
| 60 | `wellspring-cave` | Wellspring Cave | postgame | sì | no |  |
| 61 | `striaton-city` | Striaton City | postgame | sì | no |  |
| 62 | `dreamyard` | Dreamyard | postgame | sì | no |  |
| 63 | `unova-route-2` | Route 2 | postgame | sì | sì, Part 21 |  |
| 64 | `accumula-town` | Accumula Town | postgame | no | sì, Part 21 |  |
| 65 | `unova-route-1` | Route 1 | postgame | sì | sì, Part 21 |  |
| 66 | `unova-route-17` | Route 17 | postgame | sì | sì, Part 21 |  |
| 67 | `unova-route-18` | Route 18 | postgame | sì | sì, Part 21 |  |
| 68 | `p2-laboratory` | P2 Laboratory | postgame | sì | no |  |
| 69 | `nature-sanctuary` | Nature Sanctuary | postgame | sì | no |  |

### Decisioni prese

- **Formato**: un file JSON per versione, con chiavi di area uguali agli identificatori delle località PokéAPI e la fonte su ogni riga. Motivo: gli incontri si leggono dal Pokédex senza tabelle di corrispondenza, e le versioni della stessa coppia differiscono (White Forest, incontri, scambi).
- **Fonte dell'ordine**: nuzlocke.data, corretto dove la seconda fonte lo contraddice per un passaggio obbligato della storia; per le aree opzionali e il postgame resta l'ordine di nuzlocke.data.
- **Regali, incontri fissi e scambi**: da PokéAPI, più gli scambi di Nero e Bianco a mano; ognuno con chiave propria e area di appartenenza.
- **Stanze e parti interne** (Guidance Chamber, Trial Chamber, stanze di Underground Ruins) sono aree separate, come in PokéAPI.
- **Aree personalizzate**: nel database, dopo un'area indicata, con chiave `custom:<id>` (sezione sopra).

### Domande aperte

| Domanda | PBI che la chiude |
| --- | --- |
| Nomi italiani delle aree: PokéAPI non li ha per Unima e le fonti italiane non sono raggiungibili dall'ambiente dell'agente. Il product owner può indicare una fonte o fornire l'elenco? | P1-05 |
| 15 aree di Nero e Bianco e 26 di Nero 2 e Bianco 2 hanno l'ordine non verificato con la seconda fonte | Verifica del product owner su questa PR, oppure una sessione con accesso diretto a Bulbapedia |
| Stanze e parti interne come aree separate (più incontri) o unite all'area principale (Mistralton Cave, Victory Road, Underground Ruins)? | P1-19 |
| Grotte nascoste di Nero 2 e Bianco 2: incontro dell'area, incontro speciale o niente? | P1-19 |
| Specie di White Forest: usare l'elenco di nuzlocke.data, non verificato? | P1-19 |
| Livelli degli scambi di Nero e Bianco | Prima di P4-09 (regali separati, rilascio 0.2) |
| Colore della run per ogni gioco (`runColor`) | P2-12, con il design |
