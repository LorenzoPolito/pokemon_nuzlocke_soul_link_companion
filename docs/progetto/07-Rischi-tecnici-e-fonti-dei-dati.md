# Nuzlocke SoulLink Companion – Rischi tecnici e fonti dei dati

Oct 3, 2026 · @Lorenzo

Prima verifica leggera dei rischi tecnici e delle fonti dei dati, fatta su documentazione e repository pubblici senza scrivere codice. Le prove pratiche restano nei PBI di fase 1.

## Registro dei rischi

Il rischio più alto per l'MVP sono i dati di progressione (ordine delle aree, capipalestra, level cap): non stanno in PokéAPI, le fonti della community non hanno licenze chiare e in un caso si contraddicono. Lo stack tecnico, invece, regge sulla carta.

| Rischio | Cosa ho verificato | Esito | Azione |
| --- | --- | --- | --- |
| Ordine delle aree, capipalestra e level cap per Bianco, Nero, Bianco 2, Nero 2 | PokéAPI non li fornisce. Il progetto nuzlocke.data ha aree in ordine con lotte dei boss, ma la pagina del repository non mostra una licenza. Per Cheren in Bianco 2 due fonti danno livelli diversi (Lillipup 12 contro 13). P1-06 e P1-07 (19 ottobre 2026): dati importati e verificati con Bulbapedia, PokémonDB e Serebii; tutti i level cap in modalità normale coincidono; Cheren risolto (Lillipup Lv. 12 è la modalità facile, Lv. 13 la normale); ordine di 15 aree di Nero e Bianco e 26 di Nero 2 e Bianco 2 non verificato | Medio | Rischio di licenza invariato (decisione 7). Resta da verificare l'ordine di alcune aree; dati in `data/games/` ([Dati di gioco](11-Dati-di-gioco.md)) |
| Incontri per area della quinta generazione in PokéAPI | Le aree di Unima esistono e sono mantenute: a maggio 2026 sono stati aggiunti scambi in gioco di Bianco 2 e Nero 2 e le aree delle grotte nascoste. P1-04 (19 ottobre 2026): confronto area per area con nuzlocke.data; Nero 2 e Bianco 2 coincidono (differenze solo per metodo), in Nero e Bianco mancano scambi in gioco, sciami e White Forest | Basso | Lacune di Nero e Bianco da completare a mano in P1-06 ([Analisi delle fonti dati](10-Analisi-delle-fonti-dati.md#p1-04-copertura-pokéapi-incontri-per-area)) |
| Nomi italiani | PokéAPI ha la lingua italiana e negli ultimi rilasci ha aggiunto nomi italiani delle mosse e altre traduzioni; P1-04 (19 ottobre 2026): nessun nome italiano per le località di Unima (0 su 122); presenti solo per Hoenn, Kalos e Alola | Medio | P1-05: contare le altre lacune; nomi delle aree in italiano nei file dei dati di gioco, da una fonte da individuare |
| Cambio lingua senza ricaricare | Con Paraglide 2 setLocale() ricarica la pagina; il cambio senza ricarica è un'eccezione limitata al browser | Medio | Accettare la ricarica e correggere i criteri di P1-14 e P6-07 |
| Better Auth su libSQL | Better Auth ha un adattatore Drizzle per SQLite; la CLI genera lo schema, le migrazioni passano da drizzle-kit | Basso | P1-13 conferma con il client libSQL asincrono |
| Override di specie nel calcolatore | Nel codice di @smogon/calc il Pokémon unisce i dati della specie con le opzioni di override, da cui prende anche i tipi | Basso | P1-11 misura anche il peso aggiunto al bundle |
| Sprite | Copyright di The Pokémon Company (non di Nintendo); il repository PokeAPI/sprites è dichiarato CC0, ma la CC0 non copre le immagini, che restano senza licenza d'uso. P1-10 (19 ottobre 2026): tollerato per l'uso privato, non ridistribuibile | Basso per l'uso privato, alto se si ridistribuisse | Gli sprite non vanno mai nel repository né nell'immagine: si caricano da PokéAPI; nota di attribuzione nell'app e nel README ([Analisi delle fonti dati](10-Analisi-delle-fonti-dati.md#p1-10-licenze-di-dati-e-sprite)) |
| Licenza dei dati PokéAPI | Licenza BSD a 3 clausole, con nomi e personaggi marchi di Nintendo | Basso | Citare PokéAPI nell'app |
| Sync SSE con l'adapter Node | Non verificato in questa sessione | Basso | P1-16 |
| Dimensione del Pokédex SQLite | Non verificato | Da misurare | P1-15 |
| HTTPS | Tolto dall'ambito: l'app parla solo HTTP; chi vuole HTTPS mette un reverse proxy davanti | Chiuso | P3-13 ridotto a compatibilità con reverse proxy |

## Dove troveremo i dati

Quasi tutti i dati dei Pokémon arrivano da PokéAPI; i dati di progressione dei quattro giochi andranno compilati a mano da guide pubbliche.

| Dato per l'MVP | Fonte candidata | Uso consentito | Stato |
| --- | --- | --- | --- |
| Specie, tipi, statistiche, abilità | PokéAPI, snapshot PokeAPI/api-data | Licenza BSD, con attribuzione | Fonte confermata, copertura da contare in P1-02 |
| Mosse e learnset | PokéAPI | Come sopra | Da contare in P1-03 (non serve all'MVP) |
| Nomi in italiano | PokéAPI, lingua "it" | Come sopra | Parziale: mosse e altre traduzioni presenti; luoghi assenti per Unima (P1-04) |
| Incontri per area | PokéAPI, aree di Unima per black, white, black-2, white-2 | Come sopra | Presenti e verificati area per area in P1-04; lacune in Nero e Bianco |
| Regali, scambi, incontri fissi | PokéAPI, metodi `gift`, `gift-egg`, `static`, `npc-trade` (scambi di Bianco 2 e Nero 2 aggiunti a maggio 2026) | Come sopra | Presenti, tranne gli scambi di Nero e Bianco (P1-04): quelli a mano |
| Ordine delle aree | nuzlocke.data (file delle aree in ordine con le lotte dei boss) | Nessuna licenza: uso privato accettato, da rivedere prima di qualsiasi condivisione | Importato e verificato in P1-06, con correzioni annotate |
| Capipalestra, medaglie, level cap | nuzlocke.data (squadre dei boss), verificato con PokémonDB, Bulbapedia e Serebii; il level cap è il livello più alto nella squadra del boss | nuzlocke.data senza licenza (decisione 7); dati di fatto verificati | Fatto in P1-07 per la quinta generazione |
| Sprite | PokeAPI/sprites | Copyright The Pokémon Company, senza licenza d'uso; caricati a runtime, mai inclusi nel repository né nell'immagine | Uso privato tollerato (P1-10) |
| Tabelle dei tipi | Dati di @smogon/calc o guide pubbliche | Licenza MIT per @smogon/calc (confermata in P1-10) | Non serve all'MVP |

## Fonti consultate

- [Better Auth, adattatore Drizzle](https://better-auth.com/docs/adapters/drizzle)
- [@smogon/calc, pokemon.ts](https://github.com/smogon/damage-calc/blob/e3561c72a926c0972133b48427a8ae67573aad5e/calc/src/pokemon.ts)
- [Paraglide JS](https://github.com/opral/paraglide-js) e [errori di Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/errors)
- [PokéAPI, scambi di Bianco 2 e Nero 2](https://github.com/PokeAPI/pokeapi/pull/1524) e [grotte nascoste di Unima](https://github.com/PokeAPI/pokeapi/pull/1507/files)
- [PokéAPI, rilasci](https://www.github.com/PokeAPI/pokeapi/releases) e [licenza](https://github.com/PokeAPI/pokeapi/blob/master/LICENSE.md)
- [PokeAPI/sprites, domanda sull'uso](https://github.com/PokeAPI/sprites/issues/38)
- [nuzlocke.data](https://github.com/domtronn/nuzlocke.data)
- [Capipalestra di Bianco/Nero e Bianco 2/Nero 2 (PokeJungle)](https://pokejungle.net/pokemon-black-white-black-2-and-white-2/gym-leaders-elite-4-and-champions) e [domanda su Bianco 2 (PokéBase)](https://pokemondb.net/pokebase/361912/)
- [Definizione di level cap (PokeTools)](https://www.poketools.com/emerald/gym-leaders)
