# Nuzlocke SoulLink Companion – Analisi delle fonti dati

Documento di output dei PBI di fase 1 sulle fonti dei dati Pokémon: inventario dei giochi (P1-01), copertura di PokéAPI (P1-02–P1-04), nomi localizzati (P1-05), licenze (P1-10). Le sezioni dei PBI non ancora svolti si aggiungono quando il PBI si chiude.

## Fonti usate

| Fonte | Versione consultata | Come | Note |
| --- | --- | --- | --- |
| PokéAPI, CSV del repository [PokeAPI/pokeapi](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv) | ramo `master`, commit `6fd69df`, letto il 19 ottobre 2026 | File CSV scaricati da raw.githubusercontent.com | Sono i dati da cui si genera PokeAPI/api-data. L'API online `pokeapi.co` non è raggiungibile dall'ambiente dell'agente (bloccata dal proxy) |
| [nuzlocke.data](https://github.com/domtronn/nuzlocke.data) | ramo `main`, commit `baf5df5` del 27 maggio 2023 | Clone Git | Dati del tracker nuzlocke.app (stesso autore). Nessuna licenza: uso privato accettato ([decisione 7](../decisioni.md#7-dati-di-gioco-da-nuzlockedata-e-pokéapi)). Il ramo `master` è più vecchio e non si usa |
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
| Raggruppamento dei giochi tra 0.5 e 1.0 (qui solo proposto) | P1-18 (stime e gate 1), con il product owner |
| Inclusione di Let's Go, Leggende: Arceus e Leggende: Z-A, che non hanno lotte selvatiche classiche o palestre | P1-19 |
| Espansioni come aree in coda al gioco base oppure come giochi separati | P1-06 per il formato, P1-19 per la conferma |
| Copertura degli incontri per i giochi inclusi, a partire dalla quinta generazione | P1-04 |
| Regola per i giochi senza palestre (Sole e Luna, Leggende) | P1-07 |

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
- Nella quinta generazione gli starter sono regali nella città di partenza (`nuvema-town` per Nero e Bianco, `aspertia-city` per Nero 2 e Bianco 2): si usano per l'area speciale `starter` ([decisione 16](../decisioni.md#16-starter-come-incontro-collegato-nellarea-starter)).
- Presenti in tutti i giochi con incontri; mancano del tutto gli scambi di Nero, Bianco, X, Y, Rubino Omega e Zaffiro Alpha.
- Conclusione per P1-06: regali, incontri fissi e scambi si possono importare da PokéAPI con chiave propria e località di appartenenza, come chiede la decisione 17; gli scambi di Nero e Bianco vanno aggiunti a mano.

### Decisioni prese

- Per la quinta generazione PokéAPI è la fonte degli incontri (specie per area, metodi, livelli, regali, fissi e scambi); nuzlocke.data serve come controllo e per l'ordine delle aree (P1-06). Motivo: PokéAPI distingue i metodi e le versioni, nuzlocke.data no.
- Gli sciami non entrano nei suggerimenti di specie dell'MVP: sono casuali e postgame, e una specie diversa da quella suggerita si sceglie comunque dal Pokédex.
- White Forest e gli scambi di Nero e Bianco si completano a mano nei dati di gioco, annotando la fonte.

### Domande aperte

| Domanda | PBI che la chiude |
| --- | --- |
| Specie di White Forest e scambi di Nero e Bianco: con quale fonte verificabile completarli (nuzlocke.data copre White Forest, ma con errori)? | P1-06 |
| Gli sciami vanno mostrati come suggerimento? | P1-19 |
| Nomi italiani delle aree di Unima: da quale fonte? Le fonti italiane (Pokémon Central) non sono raggiungibili dall'ambiente dell'agente | P1-05 e P1-06 |
| Incontri di Diamante Lucente, Perla Splendente, Scarlatto, Violetto: affidarsi a nuzlocke.data? Leggende: Arceus e Leggende: Z-A: inserimento manuale o niente suggerimenti? | P1-18, prima dei rilasci 0.5 e 1.0 |
| Precisione degli incontri dei giochi diversi dalla quinta generazione (qui solo contati) | Prima del rilascio di ciascun gioco (0.5) |
