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
