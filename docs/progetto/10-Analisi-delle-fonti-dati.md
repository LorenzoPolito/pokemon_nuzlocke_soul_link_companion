# Nuzlocke SoulLink Companion – Analisi delle fonti dati

Documento di output dei PBI di fase 1 sulle fonti dei dati Pokémon: inventario dei giochi (P1-01), copertura di PokéAPI (P1-02–P1-04), nomi localizzati (P1-05), licenze (P1-10). Le sezioni dei PBI non ancora svolti si aggiungono quando il PBI si chiude.

## Fonti usate

| Fonte | Versione consultata | Come | Note |
| --- | --- | --- | --- |
| PokéAPI, CSV del repository [PokeAPI/pokeapi](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv) | ramo `master`, commit `6fd69df`, letto il 19 ottobre 2026 | File CSV scaricati da raw.githubusercontent.com | Sono i dati da cui si genera PokeAPI/api-data. L'API online `pokeapi.co` non è raggiungibile dall'ambiente dell'agente (bloccata dal proxy) |
| [nuzlocke.data](https://github.com/domtronn/nuzlocke.data) | ramo `main`, commit `baf5df5` del 27 maggio 2023 | Clone Git | Dati del tracker nuzlocke.app (stesso autore). Nessuna licenza: uso privato accettato ([decisione 7](../adr/0001-decisioni-di-progetto.md#7-dati-di-gioco-da-nuzlockedata-e-pokéapi)). Il ramo `master` è più vecchio e non si usa |
| [MVP e rilasci](03-MVP-e-rilasci.md), PDF in `pdf/03-MVP-e-rilasci.pdf` | 3 ottobre 2026 | Lettura | Il diagramma dei rilasci (visibile solo nel PDF) assegna: 0.1 quinta generazione; 0.5 "altre generazioni, dati di gioco aggiunti a gruppi"; 1.0 "tutte le generazioni" |

## P1-01 Inventario dei giochi supportati

Data: 19 ottobre 2026. Taglia S.

### Criteri usati

- **Gioco** per il companion = un *version group* di PokéAPI, perché aree, incontri, learnset e meccaniche in PokéAPI sono per version group. Le due versioni di una coppia (per esempio Nero e Bianco) condividono aree e progressione; cambiano alcune specie selvatiche e, per Nero 2 e Bianco 2, alcune aree. Nei dati di gioco ogni versione sarà un `game_id` (`black`, `white`, `black-2`, `white-2`), così la run sceglie la versione esatta e gli incontri sono quelli giusti.
- **Incluso**: gioco della serie principale con aree da esplorare, incontri selvatici e una progressione a tappe (palestre o equivalenti), su cui si gioca una Nuzlocke Soul Link. I remake sono giochi a sé, con aree e progressione proprie.
- **Escluso**: giochi fuori serie principale, versioni solo giapponesi doppione di un gioco incluso, giochi senza esplorazione.
- **Espansioni** (DLC): PokéAPI le tratta come version group separati, ma si giocano sullo stesso salvataggio del gioco base. Proposta: fanno parte del gioco base come aree in coda all'ordine, non come giochi separati.
- **Rilascio**: 0.1 per i quattro giochi dell'MVP (decisione 19). Per gli altri il documento MVP e rilasci dice solo "0.5 a gruppi" e "1.0 tutti": l'assegnazione qui sotto è una **proposta**, basata su un criterio verificabile, la presenza di aree in ordine e lotte dei boss in nuzlocke.data (che abbassa il costo di P1-06 e P1-07 per quel gioco).

### Giochi principali, Gen 1–Gen 9

PokéAPI conta 32 version group in 9 generazioni. Nomi italiani e inglesi da `version_names.csv` di PokéAPI (lingua 8 = italiano, 9 = inglese).

| Gen | Version group PokéAPI | Versioni (`game_id`) | Nome italiano | Regione | nuzlocke.data (aree / boss) | Inclusione | Rilascio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `red-blue` | `red`, `blue` | Rossa, Blu | Kanto | sì / sì (`rb`) | Incluso | 0.5 (proposta) |
| 1 | `yellow` | `yellow` | Gialla | Kanto | sì / sì (`yel`) | Incluso | 0.5 (proposta) |
| 2 | `gold-silver` | `gold`, `silver` | Oro, Argento | Johto, Kanto | sì / sì (`gsc`) | Incluso | 0.5 (proposta) |
| 2 | `crystal` | `crystal` | Cristallo | Johto, Kanto | sì / sì (`gsc`) | Incluso | 0.5 (proposta) |
| 3 | `ruby-sapphire` | `ruby`, `sapphire` | Rubino, Zaffiro | Hoenn | sì / sì (`rs`) | Incluso | 0.5 (proposta) |
| 3 | `emerald` | `emerald` | Smeraldo | Hoenn | sì / sì (`em`) | Incluso | 0.5 (proposta) |
| 3 | `firered-leafgreen` | `firered`, `leafgreen` | Rosso Fuoco, Verde Foglia | Kanto | sì / sì (`frlg`) | Incluso (remake) | 0.5 (proposta) |
| 4 | `diamond-pearl` | `diamond`, `pearl` | Diamante, Perla | Sinnoh | sì / sì (`dp`) | Incluso | 0.5 (proposta) |
| 4 | `platinum` | `platinum` | Platino | Sinnoh | sì / sì (`plat`) | Incluso | 0.5 (proposta) |
| 4 | `heartgold-soulsilver` | `heartgold`, `soulsilver` | Oro HeartGold, Argento SoulSilver | Johto, Kanto | sì / sì (`hgss`) | Incluso (remake) | 0.5 (proposta) |
| 5 | `black-white` | `black`, `white` | Nera, Bianca | Unima | sì / sì (`bw`) | Incluso | **0.1** |
| 5 | `black-2-white-2` | `black-2`, `white-2` | Nera 2, Bianca 2 | Unima | sì / sì (`b2w2`) | Incluso | **0.1** |
| 6 | `x-y` | `x`, `y` | X, Y | Kalos | sì / sì (`xy`) | Incluso | 0.5 (proposta) |
| 6 | `omega-ruby-alpha-sapphire` | `omega-ruby`, `alpha-sapphire` | Rubino Omega, Zaffiro Alpha | Hoenn | sì / sì (`oras`) | Incluso (remake) | 0.5 (proposta) |
| 7 | `sun-moon` | `sun`, `moon` | Sole, Luna | Alola | sì / sì (`sm`) | Incluso; prove al posto delle palestre (regola in P1-07) | 0.5 (proposta) |
| 7 | `ultra-sun-ultra-moon` | `ultra-sun`, `ultra-moon` | Ultrasole, Ultraluna | Alola | sì / sì (`usum`) | Incluso; prove al posto delle palestre (regola in P1-07) | 0.5 (proposta) |
| 7 | `lets-go-pikachu-lets-go-eevee` | `lets-go-pikachu`, `lets-go-eevee` | Let's Go, Pikachu! / Let's Go, Eevee! | Kanto | no / no | Incluso con riserva: niente lotte selvatiche (si cattura senza combattere) e niente abilità; da confermare in P1-19 | 1.0 (proposta) |
| 8 | `sword-shield` | `sword`, `shield` | Spada, Scudo | Galar | sì / sì (`swsh`) | Incluso; la Terra Selvaggia ha molti incontri in un'unica zona (da trattare in P1-06) | 0.5 (proposta) |
| 8 | `the-isle-of-armor` | `the-isle-of-armor-sword`, `the-isle-of-armor-shield` | L'isola solitaria dell'armatura | Galar | no / no | Espansione di Spada e Scudo: aree del gioco base (proposta) | con Spada e Scudo |
| 8 | `the-crown-tundra` | `the-crown-tundra-sword`, `the-crown-tundra-shield` | Le terre innevate della corona | Galar | no / no | Espansione di Spada e Scudo: aree del gioco base (proposta) | con Spada e Scudo |
| 8 | `brilliant-diamond-shining-pearl` | `brilliant-diamond`, `shining-pearl` | Diamante Lucente, Perla Splendente | Sinnoh | sì / sì (`bdsp`) | Incluso (remake) | 0.5 (proposta) |
| 8 | `legends-arceus` | `legends-arceus` | Leggende: Arceus | Hisui | no / no | Incluso con riserva: nessuna palestra né medaglia (regola in P1-07), incontri visibili sul campo; da confermare in P1-19 | 1.0 (proposta) |
| 9 | `scarlet-violet` | `scarlet`, `violet` | Scarlatto, Violetto | Paldea | sì / sì (`sv`) | Incluso; mondo aperto, ordine delle palestre libero (da trattare in P1-06 e P1-07) | 0.5 (proposta) |
| 9 | `the-teal-mask` | `the-teal-mask-scarlet`, `the-teal-mask-violet` | La maschera turchese | Paldea | no / no | Espansione di Scarlatto e Violetto: aree del gioco base (proposta) | con Scarlatto e Violetto |
| 9 | `the-indigo-disk` | `the-indigo-disk-scarlet`, `the-indigo-disk-violet` | Il disco indaco | Paldea | no / no | Espansione di Scarlatto e Violetto: aree del gioco base (proposta) | con Scarlatto e Violetto |
| 9 | `legends-za` | `legends-za` | Leggende: Z-A | Kalos (Luminopoli) | no / no | Incluso con riserva: una sola città, nessuna palestra (classifica Z-A al posto delle medaglie); in PokéAPI non ha ancora una regione associata; da confermare in P1-19 | 1.0 (proposta) |
| 9 | `mega-dimension` | `mega-dimension` | Megadimensione | — | no / no | Espansione di Leggende: Z-A (proposta) | con Leggende: Z-A |

### Giochi esclusi

| Version group PokéAPI | Gen | Motivo dell'esclusione |
| --- | --- | --- |
| `red-green-japan` (Rossa e Verde giapponesi) | 1 | Versioni uscite solo in Giappone, con le stesse aree e la stessa progressione di Rossa e Blu, che sono incluse |
| `blue-japan` (Blu giapponese) | 1 | Come sopra |
| `colosseum` | 3 | Fuori serie principale: niente incontri selvatici, i Pokémon si sottraggono agli allenatori (regione Orre) |
| `xd` (XD: Tempesta oscura) | 3 | Come Colosseum |
| `champions` | 9 | Fuori serie principale: gioco di sole lotte, senza esplorazione né catture |

I giochi fuori serie principale che non sono in PokéAPI (Mystery Dungeon, Ranger, Stadium, Snap e simili) sono esclusi per lo stesso motivo; le ROM hack, che nuzlocke.data supporta in parte (Radical Red, Unbound e altre), sono fuori ambito: la specifica non le prevede.

### Riepilogo

- 32 version group in PokéAPI: 22 giochi inclusi (di cui 3 con riserva da confermare), 5 espansioni proposte come parte del gioco base, 5 esclusi.
- Rilascio 0.1: Nero, Bianco, Nero 2, Bianco 2 (2 version group, 4 `game_id`).
- Proposta per la 0.5: i 17 giochi con aree e boss già presenti in nuzlocke.data. Proposta per la 1.0: Let's Go, Leggende: Arceus e Leggende: Z-A, da compilare a mano.

### Decisioni prese

- Un gioco del companion corrisponde a una versione di PokéAPI (`game_id` = identificatore della versione), raggruppata nel suo version group per aree, learnset e incontri. Motivo: la run sceglie la versione esatta, perché gli incontri cambiano tra versioni della stessa coppia.
- Esclusi i doppioni giapponesi di prima generazione, Colosseum, XD e Champions, con i motivi sopra.

### Domande aperte

| Domanda | PBI che la chiude |
| --- | --- |
| Raggruppamento dei giochi tra 0.5 e 1.0 (qui solo proposto) | Deciso il 19 ottobre 2026: 17 giochi in 0.5, Let's Go e i due Leggende in 1.0 ([ADR 0004](../adr/0004-fonti-dei-dati-nomi-e-giochi-per-rilascio.md)); P1-18 stima le durate |
| Inclusione di Let's Go, Leggende: Arceus e Leggende: Z-A, che non hanno lotte selvatiche classiche o palestre | Decisa: inclusi, in 1.0 |
| Espansioni come aree in coda al gioco base oppure come giochi separati | Decisa: aree in coda al gioco base |
| Copertura degli incontri per i giochi inclusi, a partire dalla quinta generazione | P1-04 (fatto) |
| Regola per i giochi senza palestre (Sole e Luna, Leggende) | P1-07 (fatto) |

## P1-04 Copertura PokéAPI: incontri per area

Data: 19 ottobre 2026. Taglia M. I nomi dei luoghi sono in inglese, come in PokéAPI: i nomi italiani non sono disponibili (vedi sotto).

### Metodo

- Conteggio, per ogni versione, delle righe di `encounters.csv` di PokéAPI, delle aree (`location_areas`) e delle località (`locations`) con almeno un incontro, delle specie distinte e dei metodi di incontro (`encounter_methods`). Il numero di località della regione serve solo come ordine di grandezza: comprende città, cancelli ed edifici senza incontri.
- Per la quinta generazione, confronto area per area e specie per specie con la seconda fonte, nuzlocke.data (`routes/bl.txt`, `wh.txt`, `bl2.txt`, `wh2.txt`), che elenca per ogni area le specie incontrabili. Le specie si confrontano per specie (forme unite: `basculin-red-striped` vale `basculin`), separando gli incontri selvatici da regali, incontri fissi, scambi e grotte nascoste.
- Legenda delle tabelle: **sel** incontri selvatici (erba, grotte, surf, pesca, punti speciali), **reg** regali (`gift`, `gift-egg`), **fis** incontri fissi (`static`), **sca** scambi in gioco (`npc-trade`), **grt** grotte nascoste (`hidden-grotto`); il numero è quello delle specie distinte.

### Copertura per gioco

"Presenti" vuol dire che PokéAPI ha incontri per la gran parte delle località con incontri; la precisione area per area è verificata solo per la quinta generazione (sezione successiva).

| Gen | Gioco | Righe | Località con incontri | Specie | Righe di regali / fissi / scambi | Esito |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Rossa, Blu | 891 | 45 | 106 | 18 / 12 / 9 | Presenti |
| 1 | Gialla | 877 | 45 | 106 | 19 / 12 / 7 | Presenti |
| 2 | Oro, Argento | 2820 | 84 | 151 | 14 / 29 / 6 | Presenti |
| 2 | Cristallo | 3183 | 85 | 170 | 22 / 31 / 7 | Presenti |
| 3 | Rubino, Zaffiro | ~1530 | 68–69 | 129 | 8 / 13–16 / 3 | Presenti |
| 3 | Smeraldo | 1647 | 81 | 158 | 11 / 24 / 4 | Presenti |
| 3 | Rosso Fuoco, Verde Foglia | 2117 | 83 | 140 | 18 / 11 / 9 | Presenti |
| 4 | Diamante, Perla | 4392 | 74 | 277–278 | 13 / 11 / 4 | Presenti (comprese le condizioni di sciame) |
| 4 | Platino | 4231 | 76 | 290 | 14 / 14 / 4 | Presenti |
| 4 | Oro HeartGold, Argento SoulSilver | 6215 | 99 | 284 | 33 / 36 / 10 | Presenti |
| 5 | Nero, Bianco | 2691 | 52 | 240 | 18 / 19 / **0** | **Parziali**: mancano scambi in gioco, sciami e White Forest (dettaglio sotto) |
| 5 | Nero 2, Bianco 2 | 3850 | 68 | 293–294 | 18 / 36 / 6 | Presenti; mancano gli sciami (dettaglio sotto) |
| 6 | X, Y | 1470 | 46 | 357–358 | 10 / 10 / **0** | Presenti, senza scambi in gioco |
| 6 | Rubino Omega, Zaffiro Alpha | **302** | 57 | 132 | 23 / 39 / **0** | **Parziali**: solo erba, orde, Spaccaroccia e Devonscopio; mancano pesca, surf e scambi |
| 7 | Sole, Luna | 890–891 | 68 | 251–253 | 80 / 14–15 / 7 | Presenti (compresi gli incontri SOS) |
| 7 | Ultrasole, Ultraluna | 1216 | 75 | 377–378 | 91 / 121–123 / 7 | Presenti |
| 7 | Let's Go, Pikachu! / Eevee! | 693 | 44 | 125 | 12 / 5 / 8 | Presenti (incontri visibili sul campo) |
| 8 | Spada, Scudo | ~10 800 | 47 | 396–397 | 12 / 17 / 9 | Presenti (Terre Selvagge, Pokémon erranti, raid Dynamax) |
| 8 | L'isola solitaria dell'armatura | ~7150 | 18 | 299 | 15 / 0 / 9 | Presenti |
| 8 | Le terre innevate della corona | ~5600 | 24 | 424 | 2 / 16 / 0 | Presenti (comprese le Avventure Dynamax) |
| 8 | Diamante Lucente, Perla Splendente | 0 | 0 | 0 | — | **Assenti** |
| 8 | Leggende: Arceus | 0 | 0 | 0 | — | **Assenti** |
| 9 | Scarlatto, Violetto | 0 | 0 | 0 | — | **Assenti** |
| 9 | La maschera turchese, Il disco indaco | 0 | 0 | 0 | — | **Assenti** |
| 9 | Leggende: Z-A, Megadimensione | 0 | 0 | 0 | — | **Assenti** |

Per i giochi esclusi in P1-01: Rossa e Verde giapponesi hanno incontri (882 righe), Blu giapponese quasi nulla (6 righe), Colosseum e XD hanno solo `snag` e `pokespot`; Champions nessuno.

### Generazioni 8 e 9

- **Gen 8**: Spada e Scudo, con le due espansioni, sono coperti in modo ampio, anche con i metodi propri di Galar (Pokémon visibili, erranti, raid). Diamante Lucente e Perla Splendente e Leggende: Arceus non hanno nessun incontro in PokéAPI.
- **Gen 9**: nessun gioco ha incontri in PokéAPI (Scarlatto, Violetto e le espansioni, Leggende: Z-A e Megadimensione).
- Conseguenza: per Diamante Lucente e Perla Splendente, Scarlatto e Violetto la fonte degli incontri è nuzlocke.data, che ha le specie per area (file `bd.txt`, `sp.txt`, `sc.txt`, `vi.txt`); per Leggende: Arceus e Leggende: Z-A non c'è nessuna fonte raggiungibile e gli incontri vanno inseriti a mano. Senza tabelle di incontro l'app funziona comunque: la specie si sceglie da tutto il Pokédex, come con il flag randomizer.

### Quinta generazione, area per area

PokéAPI ha 122 località di Unima: 75 hanno almeno un incontro in uno dei quattro giochi, le altre sono città, cancelli, edifici o luoghi senza Pokémon selvatici. La tabella elenca le 76 località con incontri in PokéAPI o presenti in nuzlocke.data (N = Nero, B = Bianco, N2 = Nero 2, B2 = Bianco 2).

| Località PokéAPI | Nome inglese | Nero | Bianco | Nero 2 | Bianco 2 | In nuzlocke.data |
| --- | --- | --- | --- | --- | --- | --- |
| `abundant-shrine` | Abundant Shrine | sel 19 · fis 1 | sel 19 · fis 1 | sel 17 · grt 5 | sel 17 · grt 5 | N, B, N2, B2 |
| `accumula-town` | Accumula Town | — | — | sca 2 | sca 2 | N2, B2 |
| `aspertia-city` | Aspertia City | — | — | sel 4 · reg 3 | sel 4 · reg 3 | N2, B2 |
| `castelia-city` | Castelia City | reg 1 | reg 1 | sel 8 · reg 1 | sel 8 · reg 1 | N, B, N2, B2 |
| `castelia-sewers` | Castelia Sewers | — | — | sel 4 | sel 4 | N2, B2 |
| `celestial-tower` | Celestial Tower | sel 2 | sel 2 | sel 3 · fis 1 | sel 3 · fis 1 | N, B, N2, B2 |
| `challengers-cave` | Challenger's Cave | sel 13 | sel 13 | — | — | no |
| `chargestone-cave` | Chargestone Cave | sel 6 | sel 6 | sel 7 | sel 7 | N, B, N2, B2 |
| `clay-tunnel` | Clay Tunnel | — | — | sel 13 | sel 13 | N2, B2 |
| `cold-storage` | Cold Storage | sel 7 | sel 7 | — | — | N, B |
| `desert-resort` | Desert Resort | sel 6 | sel 6 | sel 8 | sel 8 | N, B, N2, B2 |
| `dragonspiral-tower` | Dragonspiral Tower | sel 18 · fis 1 | sel 18 · fis 1 | sel 17 · fis 1 | sel 17 · fis 1 | N, B, N2, B2 |
| `dreamyard` | Dreamyard | sel 12 · reg 3 · fis 1 | sel 12 · reg 3 · fis 1 | sel 11 · fis 1 | sel 11 · fis 1 | N, B, N2, B2 |
| `driftveil-city` | Driftveil City | sel 8 | sel 8 | reg 1 | reg 1 | N, B, N2, B2 |
| `driftveil-drawbridge` | Driftveil Drawbridge | sel 1 | sel 1 | sel 1 | sel 1 | N, B, N2, B2 |
| `floccesy-ranch` | Floccesy Ranch | — | — | sel 16 · grt 3 | sel 16 · grt 3 | N2, B2 |
| `floccesy-town` | Floccesy Town | — | — | reg 1 | reg 1 | N2, B2 |
| `giant-chasm` | Giant Chasm | sel 30 · fis 1 | sel 30 · fis 1 | sel 25 · fis 1 · grt 4 | sel 25 · fis 1 · grt 4 | N2, B2 |
| `glacier-room` | Glacier Room | — | — | sel 8 | sel 8 | no |
| `guidance-chamber` | Guidance Chamber | sel 4 | sel 4 | sel 5 | sel 5 | no |
| `humilau-city` | Humilau City | — | — | sel 10 · sca 1 | sel 10 · sca 1 | N2, B2 |
| `icirrus-city` | Icirrus City | sel 6 | sel 6 | sel 8 | sel 8 | N, B, N2, B2 |
| `iron-room` | Iron Room | — | — | sel 8 | sel 8 | no |
| `liberty-garden` | Liberty Garden | fis 1 | fis 1 | — | — | N, B |
| `lostlorn-forest` | Lostlorn Forest | sel 15 · fis 1 | sel 15 · fis 1 | sel 23 · grt 4 | sel 23 · grt 4 | N, B, N2, B2 |
| `marvelous-bridge` | Marvelous Bridge | sel 1 · reg 1 | sel 1 · reg 1 | sel 1 · reg 1 · fis 1 | sel 1 · reg 1 · fis 1 | N, B, N2, B2 |
| `mistralton-cave` | Mistralton Cave | sel 4 · fis 1 | sel 4 · fis 1 | sel 5 | sel 5 | N, B, N2, B2 |
| `moor-of-icirrus` | Moor of Icirrus | sel 6 | sel 6 | sel 8 | sel 8 | N, B, N2, B2 |
| `ns-castle` | N's Castle | fis 1 | fis 1 | — | — | no |
| `nacrene-city` | Nacrene City | reg 9 | reg 9 | reg 10 · fis 1 | reg 10 · fis 1 | N, B, N2, B2 |
| `nature-sanctuary` | Nature Sanctuary | — | — | sel 16 · fis 1 | sel 16 · fis 1 | N2, B2 |
| `nuvema-town` | Nuvema Town | reg 3 | reg 3 | — | — | no |
| `p2-laboratory` | P2 Laboratory | sel 15 | sel 15 | sel 19 | sel 19 | N, B, N2, B2 |
| `pinwheel-forest` | Pinwheel Forest | sel 20 · fis 1 | sel 20 · fis 1 | sel 25 · grt 8 | sel 25 · grt 8 | N, B, N2, B2 |
| `relic-castle` | Relic Castle | sel 7 · fis 1 | sel 7 · fis 1 | sel 6 · fis 1 | sel 6 · fis 1 | N, B, N2, B2 |
| `relic-passage` | Relic Passage | — | — | sel 16 | sel 16 | N2, B2 |
| `reversal-mountain` | Reversal Mountain | — | — | sel 11 · fis 1 | sel 11 · fis 1 | N2, B2 |
| `rocky-mountain-room` | Rocky Mountain Room | — | — | sel 8 | sel 8 | no |
| `unova-route-1` | Route 1 | sel 10 | sel 10 | sel 12 | sel 12 | N, B, N2, B2 |
| `unova-route-10` | Route 10 | sel 10 · fis 2 | sel 10 · fis 2 | — | — | N, B |
| `unova-route-11` | Route 11 | sel 19 | sel 19 | sel 18 · fis 2 | sel 18 · fis 2 | N, B, N2, B2 |
| `unova-route-12` | Route 12 | sel 15 | sel 15 | sel 12 | sel 12 | N, B, N2, B2 |
| `unova-route-13` | Route 13 | sel 21 | sel 21 | sel 18 · fis 1 · grt 5 | sel 18 · fis 1 · grt 5 | N, B, N2, B2 |
| `unova-route-14` | Route 14 | sel 18 | sel 18 | sel 14 | sel 14 | N, B, N2, B2 |
| `unova-route-15` | Route 15 | sel 12 | sel 12 | sel 10 · sca 1 | sel 10 · sca 1 | N, B, N2, B2 |
| `unova-route-16` | Route 16 | sel 7 | sel 7 | sel 7 | sel 7 | N, B, N2, B2 |
| `unova-route-17` | Route 17 | sel 9 | sel 9 | sel 8 | sel 8 | N, B, N2, B2 |
| `unova-route-18` | Route 18 | sel 17 · reg 1 | sel 17 · reg 1 | sel 18 · grt 4 | sel 18 · grt 4 | N, B, N2, B2 |
| `unova-route-19` | Route 19 | — | — | sel 7 | sel 7 | N2, B2 |
| `unova-route-2` | Route 2 | sel 4 | sel 4 | sel 10 · grt 4 | sel 10 · grt 4 | N, B, N2, B2 |
| `unova-route-20` | Route 20 | — | — | sel 16 | sel 16 | N2, B2 |
| `unova-route-21` | Route 21 | — | — | sel 8 | sel 8 | N2, B2 |
| `unova-route-22` | Route 22 | — | — | sel 15 · fis 2 · grt 3 | sel 15 · fis 2 · grt 3 | N2, B2 |
| `unova-route-23` | Route 23 | — | — | sel 19 · fis 2 · grt 5 | sel 19 · fis 2 · grt 5 | N2, B2 |
| `unova-route-3` | Route 3 | sel 10 | sel 10 | sel 16 · grt 6 | sel 16 · grt 6 | N, B, N2, B2 |
| `unova-route-4` | Route 4 | sel 12 | sel 12 | sel 13 · fis 1 · sca 1 | sel 13 · fis 1 · sca 1 | N, B, N2, B2 |
| `unova-route-5` | Route 5 | sel 7 | sel 7 | sel 7 · grt 3 | sel 7 · grt 3 | N, B, N2, B2 |
| `unova-route-6` | Route 6 | sel 15 · fis 1 | sel 15 · fis 1 | sel 19 · reg 1 · fis 1 · grt 4 | sel 19 · reg 1 · fis 1 · grt 4 | N, B, N2, B2 |
| `unova-route-7` | Route 7 | sel 9 | sel 9 | sel 11 · fis 1 · sca 1 · grt 4 | sel 11 · fis 1 · sca 1 · grt 4 | N, B, N2, B2 |
| `unova-route-8` | Route 8 | sel 6 | sel 6 | sel 8 | sel 8 | N, B |
| `unova-route-9` | Route 9 | sel 9 | sel 9 | sel 10 · grt 4 | sel 10 · grt 4 | N, B, N2, B2 |
| `seaside-cave` | Seaside Cave | — | — | sel 14 · fis 1 | sel 14 · fis 1 | N2, B2 |
| `strange-house` | Strange House | — | — | sel 6 | sel 6 | N2, B2 |
| `striaton-city` | Striaton City | sel 4 | sel 4 | sel 6 | sel 6 | N, B, N2, B2 |
| `trial-chamber` | Trial Chamber | sel 5 | sel 5 | — | — | no |
| `twist-mountain` | Twist Mountain | sel 6 | sel 6 | sel 10 · fis 1 | sel 10 · fis 1 | N, B, N2, B2 |
| `undella-bay` | Undella Bay | sel 14 | sel 14 | sel 13 · fis 1 | sel 13 · fis 1 | N, B, N2, B2 |
| `undella-town` | Undella Town | sel 11 | sel 11 | sel 9 | sel 9 | N, B, N2, B2 |
| `underground-ruins` | Underground Ruins | — | — | sel 8 · fis 3 | sel 8 · fis 3 | N2, B2 |
| `unova-victory-road` | Victory Road | sel 14 · fis 1 | sel 14 · fis 1 | sel 2 | sel 2 | N, B |
| `unova-victory-road-2` | Victory Road | — | — | sel 29 | sel 29 | N2, B2 |
| `village-bridge` | Village Bridge | sel 13 | sel 13 | sel 13 | sel 13 | N, B, N2, B2 |
| `virbank-city` | Virbank City | — | — | sel 8 | sel 8 | N2, B2 |
| `virbank-complex` | Virbank Complex | — | — | sel 15 | sel 15 | N2, B2 |
| `wellspring-cave` | Wellspring Cave | sel 8 | sel 8 | sel 8 | sel 8 | N, B, N2, B2 |
| `white-forest` | White Forest | — | — | — | — | N, B |

Confronto con nuzlocke.data:

| Gioco | Aree in nuzlocke.data | Trovate in PokéAPI | Specie selvatiche identiche | Differenze |
| --- | --- | --- | --- | --- |
| Nero, Bianco | 46 più lo starter | 45 | 11 aree su 45 | In 21 aree nuzlocke.data ha una o due specie selvatiche in più, spesso diverse tra Nero e Bianco (per esempio Route 9: Houndour in Nero, Poochyena in Bianco): sono verosimilmente gli **sciami** (*mass outbreak*), che PokéAPI non registra per la quinta generazione (la condizione `swarm` esiste solo per la quarta); da confermare con una terza fonte. In 5 di queste aree la specie in più è invece uno **scambio in gioco**, confermato da Bulbapedia e Serebii: Petilil o Cottonee a Nacrene City, Basculin a Driftveil City, Emolga su Route 7, Rotom su Route 15, Munchlax a Undella Town. In 5 aree PokéAPI ha specie in più (pesca nei punti speciali di Route 17 e 18, Emolga su Route 13 e 14, Audino e Stoutland nel P2 Laboratory). Le altre differenze sono regali, incontri fissi e fossili, che nuzlocke.data elenca insieme ai selvatici |
| Nero 2, Bianco 2 | 62 più lo starter | 62 | 40 aree su 62 | Le differenze sono tutte regali, incontri fissi o scambi, presenti in PokéAPI con il metodo giusto. Uniche eccezioni: Underground Ruins, dove PokéAPI ha 8 specie selvatiche delle stanze interne; Dratini e Gible a Floccesy Town, regali che nuzlocke.data elenca per entrambi i giochi mentre PokéAPI li separa per versione (Gible in Nero 2, Dratini in Bianco 2); le grotte nascoste, solo in PokéAPI |

Lacune trovate:

- **White Forest** (`white-forest`, solo in Bianco): esiste in PokéAPI ma senza incontri; nuzlocke.data elenca 30 specie (e le mette per errore anche in Nero).
- **Scambi in gioco di Nero e Bianco**: zero in PokéAPI; sono 5 secondo Bulbapedia e Serebii (elenco sopra), aggiunti a mano in P1-06. In Nero 2 e Bianco 2 ci sono i 6 scambi aggiunti a maggio 2026 (Accumula Town, Route 4, Route 7, Route 15, Humilau City).
- **Sciami** di Nero e Bianco: assenti in PokéAPI, verosimilmente presenti in nuzlocke.data senza indicarli come tali.
- **Route 8 in Nero 2 e Bianco 2**: presente in PokéAPI (8 specie), assente da nuzlocke.data. Mancano da nuzlocke.data anche Challenger's Cave, N's Castle, Trial Chamber e Guidance Chamber (Nero e Bianco), Guidance Chamber e le tre stanze di Underground Ruins (Nero 2 e Bianco 2).
- **Nomi italiani delle località**: PokéAPI non ne ha nessuno per Unima (0 su 122). In tutto PokéAPI ha nomi italiani di località solo per Hoenn (93 su 110), Kalos (104 su 106) e Alola (89 su 101). Lo conferma P1-05; per l'MVP i nomi italiani delle aree vanno scritti nei file dei dati di gioco (P1-06).

### Regali, incontri fissi e scambi in gioco

- PokéAPI li modella come metodi di incontro: `gift` e `gift-egg` per i regali, `static` per gli incontri fissi (leggendari, Pokémon visibili sul campo), `npc-trade` per gli scambi in gioco. Ogni record ha località, specie e livello, e spesso una condizione (fossile da portare, stagione, avanzamento della storia).
- Nella quinta generazione gli starter sono regali nella città di partenza (`nuvema-town` per Nero e Bianco, `aspertia-city` per Nero 2 e Bianco 2): si usano per l'area speciale `starter` ([decisione 16](../adr/0001-decisioni-di-progetto.md#16-starter-come-incontro-collegato-nellarea-starter)).
- Presenti in tutti i giochi con incontri; mancano del tutto gli scambi di Nero, Bianco, X, Y, Rubino Omega e Zaffiro Alpha.
- Conclusione per P1-06: regali, incontri fissi e scambi si possono importare da PokéAPI con chiave propria e località di appartenenza, come chiede la decisione 17; gli scambi di Nero e Bianco vanno aggiunti a mano.

### Decisioni prese

- Per la quinta generazione PokéAPI è la fonte degli incontri (specie per area, metodi, livelli, regali, fissi e scambi); nuzlocke.data serve come controllo e per l'ordine delle aree (P1-06). Motivo: PokéAPI distingue i metodi e le versioni, nuzlocke.data no.
- ~~Gli sciami non entrano nei suggerimenti di specie dell'MVP.~~ Sostituito il 19 ottobre 2026 dal product owner: gli sciami e White Forest si suggeriscono con le specie di nuzlocke.data, non verificate ([ADR 0004](../adr/0004-fonti-dei-dati-nomi-e-giochi-per-rilascio.md)).
- White Forest e gli scambi di Nero e Bianco si completano a mano nei dati di gioco, annotando la fonte.

### Domande aperte

| Domanda | PBI che la chiude |
| --- | --- |
| Specie di White Forest e scambi di Nero e Bianco: con quale fonte verificabile completarli (nuzlocke.data copre White Forest, ma con errori)? | Decisa il 19 ottobre 2026: si usa nuzlocke.data, non verificato ([ADR 0004](../adr/0004-fonti-dei-dati-nomi-e-giochi-per-rilascio.md)); livelli degli scambi vuoti |
| Gli sciami vanno mostrati come suggerimento? | Decisa: sì, con le specie di nuzlocke.data (`additionalSpecies`), non verificate |
| Nomi italiani delle aree di Unima: da quale fonte? Le fonti italiane (Pokémon Central) non sono raggiungibili dall'ambiente dell'agente | Decisa: tutto in inglese per l'MVP |
| Incontri di Diamante Lucente, Perla Splendente, Scarlatto, Violetto: affidarsi a nuzlocke.data? Leggende: Arceus e Leggende: Z-A: inserimento manuale o niente suggerimenti? | Decisa: nuzlocke.data per i primi quattro; nessun suggerimento per i Leggende |
| Precisione degli incontri dei giochi diversi dalla quinta generazione (qui solo contati) | Prima del rilascio di ciascun gioco (0.5) |

## P1-10 Licenze di dati e sprite

Data: 19 ottobre 2026. Taglia XS.

### Licenze

| Cosa | Licenza | Fonte letta il 19 ottobre 2026 | Cosa impone |
| --- | --- | --- | --- |
| Dati di PokéAPI (CSV di [PokeAPI/pokeapi](https://github.com/PokeAPI/pokeapi), copia in [PokeAPI/api-data](https://github.com/PokeAPI/api-data)) | BSD a 3 clausole, "© 2013–2023 Paul Hallett and PokéAPI contributors"; "Pokémon and Pokémon character names are trademarks of Nintendo" | [`LICENSE.md`](https://github.com/PokeAPI/pokeapi/blob/master/LICENSE.md) (api-data non ha un file di licenza proprio: copia i dati di PokéAPI) | Chi ridistribuisce, anche in forma binaria, deve riportare l'avviso di copyright, le condizioni e l'esclusione di garanzia; non si usa il nome PokéAPI per promuovere l'app |
| Sprite di PokéAPI ([PokeAPI/sprites](https://github.com/PokeAPI/sprites)) | Il repository è dichiarato CC0 1.0, ma "all image contents within are Copyright The Pokémon Company" | [`LICENCE.txt`](https://github.com/PokeAPI/sprites/blob/master/LICENCE.txt); il `package.json` dice invece ISC | La CC0 non può dare diritti sulle immagini, che non sono di chi la applica: gli sprite restano proprietà di The Pokémon Company, senza una licenza d'uso. Le immagini per i Pokémon con ID oltre 650 sono sprite della comunità Smogon, usati con il loro permesso (README del repository) |
| @smogon/calc ([smogon/damage-calc](https://github.com/smogon/damage-calc)) | MIT, "© 2013–2025 Honko and other contributors"; la versione 0.12.0 su npm riporta MIT | [`LICENSE`](https://github.com/smogon/damage-calc/blob/master/LICENSE), registro npm | Includere l'avviso di copyright e di licenza nelle copie del software |
| nuzlocke.data | Nessuna licenza | Repository senza file di licenza (già noto) | Nessun diritto concesso: uso privato accettato ([decisione 7](../adr/0001-decisioni-di-progetto.md#7-dati-di-gioco-da-nuzlockedata-e-pokéapi)) |

I marchi e i nomi dei Pokémon sono di Nintendo, Creatures e Game Freak; il copyright delle immagini è di The Pokémon Company.

### Compatibilità con un'app self-hosted

- **Dati di PokéAPI**: compatibile. L'app incorpora nell'immagine il Pokédex SQLite generato dai dati: l'immagine deve contenere l'avviso della licenza BSD (per esempio un file `THIRD-PARTY-NOTICES` nel repository e nell'immagine), e l'app cita PokéAPI nelle informazioni sull'app.
- **@smogon/calc**: compatibile; stesso file di avvisi. Il codice finisce nel bundle dell'app: l'avviso va anche lì.
- **Sprite**: **non compatibile con una ridistribuzione, tollerato per l'uso privato**. L'app li carica a runtime dal repository di PokéAPI e li tiene nella cache del browser, senza copiarli nel repository né nell'immagine ([Specifica, Pokédex](01-Specifica-dei-requisiti.md#pokédex)): è la scelta che regge. Un'immagine Docker o un repository pubblico che li contenesse ridistribuirebbe immagini con copyright senza licenza.
- **Segnalazione**: la domanda di PokéAPI/sprites sull'uso personale ([issue 38](https://github.com/PokeAPI/sprites/issues/38)) non ha una risposta dei manutentori che si possa citare; la tolleranza per l'uso privato è un'interpretazione, non un permesso.
- **Dipendenza di disponibilità**: gli sprite dipendono dal repository di un terzo; con lo sprite assente la pagina resta utilizzabile (immagine di riserva, [Linee guida](05-Linee-guida-di-sviluppo.md#codice-antifragile)).
- **Se il repository o l'immagine diventassero pubblici**: servono prima una licenza per il codice, la sostituzione o l'autorizzazione dei dati di nuzlocke.data e il controllo che nessuno sprite sia incluso.

### Correzioni ai documenti

- Il documento [Rischi tecnici](07-Rischi-tecnici-e-fonti-dei-dati.md) diceva "copyright degli sprite di Nintendo, repository con licenza Creative Commons": il copyright è di **The Pokémon Company** e la CC0 vale per il repository, non per le immagini. Corretto.
- La licenza MIT di @smogon/calc, segnata "da confermare in P1-10", è confermata.

### Decisioni prese

- Gli sprite non si copiano mai nel repository né nell'immagine: si caricano da PokéAPI e si tengono nella cache del browser.
- L'avviso della licenza BSD di PokéAPI e quello MIT di @smogon/calc si riportano in un file `THIRD-PARTY-NOTICES` e nelle informazioni sull'app (si crea con P3-01; a quel punto si aggiungono anche le dipendenze npm).
- Nessuna licenza per il repository finché resta privato.

### Domande aperte

| Domanda | PBI che la chiude |
| --- | --- |
| Se un giorno il repository diventa pubblico: quale licenza per il codice (proposta: MIT) e cosa sostituire (dati di nuzlocke.data) | Decisione del product owner, solo se si decide di pubblicare; chiude il criterio "licenza" di P3-12 |

## P1-05 Nomi localizzati italiano e inglese

Data: 19 ottobre 2026. Taglia S. Fonte: i CSV di nomi di PokéAPI (`pokemon_species_names`, `move_names`, `ability_names`, `type_names`, `nature_names`, `pokemon_form_names`, `location_names`), ramo `master`, commit `6fd69df`, lingue 8 (italiano) e 9 (inglese). Una voce conta come presente se il nome non è vuoto.

### Copertura

| Categoria | Totale | Inglese | Italiano |
| --- | --- | --- | --- |
| Specie | 1025 | 100 % | **100 %** (1025) |
| Mosse | 937 | 100 % | **100 %** (937) |
| Abilità della serie principale | 314 | 100 % | **99,0 %** (311; mancano 3) |
| Tipi | 21 | 100 % | **100 %** |
| Nature | 25 | 100 % | **100 %** |
| Forme con identificativo proprio | 618 | 93,0 % (575) | **57,6 %** (356) |
| Località (aree) | 1104 | 99,3 % (1096) | **25,9 %** (286) |

Per generazione (specie e mosse in italiano, presenti su totale): le specie sono 151/151, 100/100, 135/135, 107/107, 156/156, 72/72, 88/88, 96/96 e 120/120 dalla prima alla nona generazione; le mosse 165/165, 86/86, 121/121, 113/113, 92/92, 62/62, 121/121, 108/108 e 69/69. Le abilità sono complete fino all'ottava generazione; nella nona ne mancano 3 su 47 (`eelevate`, `fire-mane`, `aura-guard`).

**Località**, per regione (italiano presente su totale): Hoenn 93/110, Kalos 104/106, Alola 89/101; **zero** per Kanto, Johto, Sinnoh, **Unima (0/122)**, Galar, Hisui, Paldea, Orre e le località senza regione.

### Cosa significa per l'MVP

- Per la quinta generazione e per tutto ciò che l'MVP mostra (specie, mosse, abilità, tipi, nature) il nome italiano c'è sempre.
- Un controllo di qualità: i nomi italiani delle **mosse** sono traduzioni vere (solo 10 su 937 coincidono con l'inglese); i nomi italiani delle **specie** coincidono con l'inglese in 1004 casi su 1025, perché in italiano quasi tutti i Pokémon mantengono il nome inglese. Non è una lacuna.
- Le **aree** di Unima non hanno nessun nome italiano: come deciso, nell'MVP aree e medaglie restano in inglese ([ADR 0004](../adr/0004-fonti-dei-dati-nomi-e-giochi-per-rilascio.md)).
- Le **forme** (per esempio Basculin a strisce rosse, Deerling di stagione) sono il punto debole: il 42 % non ha nome italiano e il 7 % nemmeno inglese. Per le specie fino alla quinta generazione le forme sono 272 e 70 non hanno il nome italiano; sono quasi tutte forme speciali (Pikachu cosplay, forme Gigamax, Mothim per terreno), che l'MVP non usa. La regola di riserva sotto le copre.

### Regola di riserva

Il nome si risolve **per campo e per lingua**, in questo ordine, e si ferma al primo non vuoto:

1. il nome nella lingua scelta dall'utente;
2. il nome in inglese;
3. l'identificativo di PokéAPI (per esempio `eelevate`), reso leggibile (trattini sostituiti da spazi, iniziali maiuscole).

Dettagli:

- Vale per specie, forme, mosse, abilità, tipi, nature, località e medaglie.
- Per una **forma** senza nome proprio si usa il nome della specie, seguito dall'identificativo della forma se serve a distinguerla.
- La riserva si applica **in lettura** (per esempio con `COALESCE` sulla tabella dei nomi del Pokédex, P2-07) e non copia mai un nome inglese nella colonna italiana: così, quando PokéAPI aggiunge una traduzione, un nuovo rilascio dei dati la prende da sola.
- Il Pokédex SQLite porta una sola tabella dei nomi (entità, id, lingua, nome); non si salva quale riga è una riserva.
- Nei file di gioco i nomi mancanti sono `null` e seguono la stessa regola ([Dati di gioco](11-Dati-di-gioco.md#formato-dei-file)).
- Un controllo automatico in fase di build (P3-04) segnala in un rapporto i nomi italiani mancanti, senza far fallire la build.

### Decisioni prese

- La regola di riserva sopra: lingua scelta, poi inglese, poi identificativo.
- Nessun lavoro di traduzione per l'MVP: i nomi italiani che mancano si colmano quando PokéAPI li aggiunge.

### Domande aperte

| Domanda | PBI che la chiude |
| --- | --- |
| Nomi italiani delle forme (e delle 3 abilità della nona generazione): compilarli a mano o aspettare PokéAPI? | Prima del rilascio che porta quelle forme (0.5 per la sesta generazione in poi); non serve all'MVP |
| Nomi italiani di aree e medaglie, da una fonte da individuare | Dopo l'MVP: [ADR 0004](../adr/0004-fonti-dei-dati-nomi-e-giochi-per-rilascio.md) li lascia in inglese |

## P1-02 Copertura PokéAPI: specie, forme, statistiche, tipi

Data: 19 ottobre 2026. Taglia M. Fonte: CSV di [PokeAPI/pokeapi](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv), commit `6fd69df` (`pokemon_species`, `pokemon`, `pokemon_forms`, `pokemon_stats`, `pokemon_stats_past`, `pokemon_types`, `pokemon_types_past`, `types`, `type_efficacy_past`).

### Copertura per generazione

Il totale atteso delle specie è quello ufficiale della serie principale (Pokédex nazionale).

| Gen | Specie in PokéAPI | Atteso | Varietà (`pokemon`) | Forme (`pokemon_forms`) |
| --- | --- | --- | --- | --- |
| 1 | 151 | 151 | 238 | 238 |
| 2 | 100 | 100 | 115 | 143 |
| 3 | 135 | 135 | 167 | 167 |
| 4 | 107 | 107 | 129 | 154 |
| 5 | 156 | 156 | 185 | 197 |
| 6 | 72 | 72 | 104 | 184 |
| 7 | 88 | 88 | 131 | 148 |
| 8 | 96 | 96 | 133 | 197 |
| 9 | 120 | 120 | 149 | 151 |
| **Totale** | **1025** | **1025** | **1351** | **1579** |

- **Specie**: complete, 1025 su 1025. Fino alla quinta generazione sono 649, tante quante i Pokémon dei giochi dell'MVP (PokéAPI ha 649 indici di gioco per Nero, Bianco, Nero 2 e Bianco 2).
- **Varietà e forme**: per le varietà e le forme non esiste un totale atteso da una fonte raggiungibile. Ho quindi controllato la coerenza interna: ogni specie ha una varietà predefinita (1025 su 1025); tutte le 1351 varietà hanno le sei statistiche di base e almeno un tipo (765 ne hanno due); le forme introdotte fino a Nero 2 e Bianco 2 sono 735 su 1579, e nessuna è una mega evoluzione.
- **Forme dei giochi di quinta generazione**: ho controllato che ci siano tutte quelle che compaiono in Nero, Bianco, Nero 2 e Bianco 2: le varianti a strisce rosse e blu di Basculin, Darmanitan zen, Keldeo, Meloetta, Tornadus, Thundurus e Landorus nelle due forme, Kyurem Nero e Bianco, Genesect, Wormadam, Rotom, Shaymin, Giratina e Deoxys; le stagioni di Deerling e Sawsbuck e i mantelli di Burmy sono **forme cosmetiche** (tabella `pokemon_forms`), non varietà.

### Tipi e statistiche cambiati tra generazioni

PokéAPI conserva i valori **storici** in due tabelle, che elencano solo ciò che è cambiato:

- `pokemon_types_past`: 36 righe per 29 Pokémon. La `generation_id` della riga è l'**ultima generazione in cui valevano i tipi vecchi**. Esempi: Clefairy era Normale fino alla quinta generazione e oggi è Folletto; Magnemite era Elettro nella prima generazione e poi Elettro/Acciaio; le cinque forme di Rotom degli elettrodomestici erano Elettro/Spettro fino alla quarta. Coprono i cambi di tipo di Folletto (sesta generazione), di Acciaio (seconda) e di Rotom.
- `pokemon_stats_past`: 235 righe per 200 Pokémon, con la stessa convenzione. In 151 righe è la statistica **Speciale** della prima generazione (nessuna delle altre generazioni la usa). Il resto sono cambi veri di statistiche base, per esempio Butterfree (Att. Sp. 80, poi 90 dalla sesta generazione), Pikachu (Dif. 30, poi 40), Aegislash (150, poi 140 dall'ottava) e Zacian (Att. 130, poi 120 dalla nona). Sette righe (6 della terza e 1 della settima generazione) hanno la statistica di base **uguale** a quella di oggi: cambia solo il valore degli EV, che non serve all'app.
- `type_efficacy_past`: 6 righe. Sono i cambi della tabella dei tipi (per esempio Spettro e Buio resistiti da Acciaio fino alla quinta generazione); la tabella completa è oggetto di P1-08.

**Regola di lettura** per una generazione G: per ogni Pokémon e statistica (o slot di tipo) vale la riga storica con la `generation_id` più piccola maggiore o uguale a G; se non c'è, vale il valore attuale. Verificata su Butterfree (G = 5 dà 80, G = 6 dà 90) e Clefairy (G = 5 dà Normale, G = 6 dà Folletto). Per G = 1, Attacco Speciale e Difesa Speciale sono entrambi il valore **Speciale**.

I tipi in PokéAPI sono 21: i 18 della serie principale (Acciaio e Buio dalla seconda generazione, Folletto dalla sesta), più `stellar` (nona generazione, solo per la Teracristallizzazione), `unknown` e `shadow` (Colosseum e XD).

### Lacune e decisioni

| Lacuna | Decisione |
| --- | --- |
| Nessun totale atteso per varietà e forme da una fonte raggiungibile | Verificate la coerenza interna e le forme dei giochi dell'MVP (sopra). Nessun'altra fonte è necessaria finché i giochi di altre generazioni non arrivano (0.5) |
| 37 varietà predefinite hanno un identificativo diverso da quello della specie (13 fino alla quinta generazione: `deoxys-normal`, `wormadam-plant`, `giratina-altered`, `shaymin-land`, `basculin-red-striped`, `darmanitan-standard`, `frillish-male`, `jellicent-male`, `tornadus-incarnate`, `thundurus-incarnate`, `landorus-incarnate`, `keldeo-ordinary`, `meloetta-aria`) | Le specie si indicizzano sempre per **id numerico** (`species_id`, come nel modello dati) e le varietà per `pokemon_id`, mai per nome. I nomi di nuzlocke.data si risolvono sull'identificativo di **specie** |
| Storico dei tipi e delle statistiche in tabelle "passate" con regola di lettura | Il Pokédex SQLite materializza in **fase di build** i valori già risolti per ogni generazione (statistiche e tipi per Pokémon e generazione): a runtime non c'è nessuna logica di risoluzione. Lo schema è oggetto di P2-07 |
| Righe storiche che cambiano solo gli EV | Ignorate |
| Statistica Speciale della prima generazione | Conservata nei dati storici; per la prima generazione il servizio dei dati effettivi (P5-04) usa lo Speciale per Attacco Speciale e Difesa Speciale. Non serve all'MVP |
| Tipi `unknown` e `shadow` | Esclusi dai tipi selezionabili; `stellar` solo con la Teracristallizzazione (P5-14) |
| Forme cosmetiche (stagione di Deerling, mantello di Burmy, le forme di Unown e simili) | Non si tracciano: l'esemplare registra la specie. Le varietà con tipi, statistiche o abilità diversi (Wormadam, Rotom, Darmanitan zen, Kyurem, e così via) sono un caso a parte, vedi la domanda sotto |

### Domande aperte

| Domanda | PBI che la chiude |
| --- | --- |
| Un esemplare registra solo la specie oppure anche la varietà (Wormadam sabbia, Rotom lavatrice), che cambia tipi e statistiche? | Deciso il 19 ottobre 2026: anche la varietà, facoltativa ([ADR 0006](../adr/0006-varieta-dell-esemplare.md)); si recepisce in P2-04 |
| Forme cosmetiche: ignorarle (proposta) o mostrarle come informazione | Proposta di ignorarle, in attesa di conferma esplicita (ADR 0006); si chiude in P2-04 |

## P1-03 Copertura PokéAPI: mosse, learnset, abilità

Data: 19 ottobre 2026. Taglia M. Fonte: CSV di [PokeAPI/pokeapi](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv), commit `6fd69df` (`moves`, `move_changelog`, `pokemon_moves`, `machines`, `abilities`, `ability_changelog`, `pokemon_abilities`, `pokemon_abilities_past`).

### Mosse

- **Totale**: 937, tutte con tipo, categoria (stato, fisica, speciale) e nome inglese e italiano. Fino alla quinta generazione sono 577 (165, 86, 121, 113 e 92 per generazione). Delle 577, 37 non sono di stato e non hanno una potenza fissa (colpi KO in un colpo, potenza variabile): è corretto.
- **Macchine**: Nero, Bianco, Nero 2 e Bianco 2 hanno 101 macchine ciascuno (95 MT e 6 MN), come nei giochi.

### Learnset per version group

Righe di `pokemon_moves` per ognuno dei giochi inclusi in P1-01 (Pokémon con learnset / mosse distinte / righe). I metodi presenti sono sempre i metodi del gioco (livello, uovo, MT e MN, tutor, più i metodi speciali di alcuni giochi).

| Version group | Pokémon | Mosse | Righe | Esito |
| --- | --- | --- | --- | --- |
| Rossa e Blu, Gialla | 151 | 163–164 | 4128–4152 | Presente |
| Oro e Argento, Cristallo | 251 | 250 | 9056–9286 | Presente |
| Rubino e Zaffiro, Smeraldo | 389 | 348–349 | 13 955–19 304 | Presente |
| Rosso Fuoco e Verde Foglia | 390 | 352 | 16 486 | Presente |
| Diamante e Perla, Platino | 501–508 | 466 | 26 301–30 897 | Presente |
| HeartGold e SoulSilver | 508 | 465 | 32 216 | Presente |
| **Nero e Bianco** | **667** | **555** | **33 756** | **Presente: tutti i 649 Pokémon** |
| **Nero 2 e Bianco 2** | **673** | **557** | **41 544** | **Presente: tutti i 649 Pokémon** |
| X e Y | 784 | 609 | 42 886 | Presente |
| Rubino Omega e Zaffiro Alpha | 811 | 613 | 54 392 | Presente |
| Sole e Luna, Ultrasole e Ultraluna | 944–959 | 666–669 | 49 542–62 019 | Presente |
| Let's Go | 188 | 223 | 5776 | Presente (solo i Pokémon del gioco) |
| Spada e Scudo | 750 | 637 | 44 204 | Presente |
| Diamante Lucente e Perla Splendente | 491 | 506 | 24 797 | Presente |
| Leggende: Arceus | 247 | 175 | 2230 | Presente, parziale (livello e tutor; nessuna macchina) |
| Scarlatto e Violetto | 867 | 679 | 54 658 | Presente |
| L'isola solitaria dell'armatura, Le terre innevate della corona, La maschera turchese, Il disco indaco, Leggende: Z-A, Megadimensione | 0 | 0 | 0 | **Assenti** |

Per i giochi dell'MVP ogni Pokémon dal numero 1 al 649 ha il learnset sia a livello sia complessivo.

### Storico di potenza, tipo e categoria delle mosse

- **Potenza, tipo, precisione, PP, priorità, bersaglio ed effetto sono storicizzati**: la tabella `move_changelog` ha 198 righe per 168 mosse (115 cambi di potenza, 47 di precisione, 43 di PP, 8 di tipo, 11 di probabilità dell'effetto, 9 di effetto, 7 di bersaglio, 5 di priorità). Una mossa può avere più righe (27 ne hanno).
- **Come si legge** (attenzione, è diverso dalle tabelle di tipi e statistiche di P1-02): ogni riga contiene i valori **vecchi**, che valgono in tutti i version group **precedenti** a quello indicato in `changed_in_version_group_id`; da quel gruppo in poi vale il valore successivo. Regola: per una mossa, un campo e un version group V vale il valore della riga con l'ordine di version group **strettamente maggiore** di V più piccolo; se non c'è, vale il valore attuale. Verificata su 15 casi noti, tutti corretti: Azione (Tackle) 35 fino a Diamante e Perla, 50 in Nero e Bianco, 40 da Sole e Luna; Fulmine (Thunderbolt) 95 fino a Nero 2 e Bianco 2, 90 da X e Y; Tossina (Toxic) 85 fino a Diamante e Perla, 90 da Nero e Bianco; Volo (Fly) 70 fino a Rubino e Zaffiro, 90 da Diamante e Perla; Martellata (Crabhammer) 90 fino a Nero 2 e Bianco 2, 100 da X e Y; Colpokarate (Karate Chop) Normale in Rossa e Blu, Lotta da Oro e Argento; Morso (Bite) Normale in Gialla, Buio da Oro e Argento.
- **Le tabelle di tipi, statistiche e abilità dei Pokémon** (P1-02) usano invece la convenzione "ultima generazione con i valori vecchi".
- **La categoria (fisica o speciale) non è storicizzata**: esiste un solo valore per mossa, quello attuale. Fino alla terza generazione la categoria dipende dal **tipo** della mossa e non dalla mossa (P1-09); dalla quarta si assume costante, perché PokéAPI non registra cambi.
- Da notare: i cambi sono concentrati in poche transizioni (Oro e Argento 20, Diamante e Perla 19, Nero e Bianco 40, X e Y 83, Sole e Luna 11, Spada e Scudo 16). Per i giochi dell'MVP contano le righe di Nero e Bianco e quelle successive (che dicono come erano le mosse prima).

### Abilità

- **Totale**: 314 nella serie principale, tutte con nome inglese; 311 con nome italiano (P1-05). Fino alla quinta generazione sono 164.
- **Abilità dei Pokémon per generazione**: `pokemon_abilities_past` ha 569 righe per 467 Pokémon (terza generazione 89, quarta 420, quinta 24, sesta 15, settima 2, ottava 19), con la convenzione "ultima generazione con i valori vecchi". 540 righe hanno l'abilità vuota: indicano che quello slot **non esisteva** (le abilità nascoste arrivano con la quinta generazione, e prima di allora lo slot è vuoto). Per Nero, Bianco, Nero 2 e Bianco 2 si usano le righe con generazione 5 o maggiore.
- **Cambi di effetto delle abilità**: `ability_changelog` ha 52 righe, in Smeraldo (19), Diamante e Perla (13), Platino (1) e Nero e Bianco (19). Riportano solo che la descrizione dell'effetto è cambiata, con il testo vecchio a parte: non ci sono numeri. Per ciò che serve all'app (le abilità che cambiano l'efficacia, P1-09) basta la descrizione dell'effetto per generazione.

### Lacune e decisioni

| Lacuna | Decisione |
| --- | --- |
| Nessun learnset per le espansioni di Spada e Scudo e di Scarlatto e Violetto, né per Leggende: Z-A e Megadimensione | Le espansioni sono aree del gioco base ([ADR 0004](../adr/0004-fonti-dei-dati-nomi-e-giochi-per-rilascio.md)): si usa il learnset del gioco base. Da verificare prima della 0.5 se le mosse e i Pokémon nuovi delle espansioni mancano. Leggende: Z-A è del rilascio 1.0 |
| Leggende: Arceus ha solo livello e tutor, senza macchine | Compatibile con il gioco (non ha macchine); è del rilascio 1.0 |
| Storico delle mosse con regola "strettamente maggiore" | Il Pokédex SQLite materializza in **fase di build** i valori già risolti per ogni mossa e version group (circa 937 × 28 righe): a runtime non c'è logica di risoluzione. Lo schema è oggetto di P2-07 |
| Categoria non storicizzata | Fino alla terza generazione deriva dal tipo della mossa (regola in P1-09); dalla quarta è quella attuale |
| Effetti delle abilità solo come testo per generazione | Si usano le descrizioni; le abilità che modificano l'efficacia si elencano a mano in P1-09 |
| Learnset di Leggende: Arceus e Let's Go parziali | Coerente con i giochi; Let's Go e Leggende sono del rilascio 1.0 |

### Domande aperte

Nessuna per il product owner. Resta da verificare, prima della 0.5, se le espansioni di Spada e Scudo e di Scarlatto e Violetto hanno mosse e Pokémon che il learnset del gioco base non contiene (PBI di dati della 0.5).
