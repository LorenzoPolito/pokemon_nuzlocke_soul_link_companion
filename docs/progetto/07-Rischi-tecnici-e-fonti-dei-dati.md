# Nuzlocke SoulLink Companion – Rischi tecnici e fonti dei dati

Oct 3, 2026 · @Lorenzo

Prima verifica leggera dei rischi tecnici e delle fonti dei dati, fatta su documentazione e repository pubblici senza scrivere codice. Le prove pratiche restano nei PBI di fase 1.

## Registro dei rischi

Il rischio più alto per l'MVP sono i dati di progressione (ordine delle aree, capipalestra, level cap): non stanno in PokéAPI, le fonti della community non hanno licenze chiare e in un caso si contraddicono. Lo stack tecnico, invece, regge sulla carta.

| Rischio | Cosa ho verificato | Esito | Azione |
| --- | --- | --- | --- |
| Ordine delle aree, capipalestra e level cap per Bianco, Nero, Bianco 2, Nero 2 | PokéAPI non li fornisce. Il progetto nuzlocke.data ha aree in ordine con lotte dei boss, ma la pagina del repository non mostra una licenza. Per Cheren in Bianco 2 due fonti danno livelli diversi (Lillipup 12 contro 13) | Alto | Deciso il 3 ottobre 2026: si usano i dati di nuzlocke.data senza chiedere, perché l'app resta privata e non commerciale. Rischio accettato: se un giorno l'app viene condivisa, quei dati vanno sostituiti o autorizzati. In P1-06 e P1-07 si importano e si verificano, risolvendo i conflitti (come Cheren) con una seconda fonte annotata |
| Incontri per area della quinta generazione in PokéAPI | Le aree di Unima esistono e sono mantenute: a maggio 2026 sono stati aggiunti scambi in gioco di Bianco 2 e Nero 2 e le aree delle grotte nascoste | Medio | P1-04: confronto area per area con una seconda fonte |
| Nomi italiani | PokéAPI ha la lingua italiana e negli ultimi rilasci ha aggiunto nomi italiani delle mosse e altre traduzioni; i nomi dei luoghi in italiano non sono verificati | Medio | P1-05: contare le lacune; nomi delle aree in italiano nei file dei dati di gioco se mancano |
| Cambio lingua senza ricaricare | Con Paraglide 2 setLocale() ricarica la pagina; il cambio senza ricarica è un'eccezione limitata al browser | Medio | Accettare la ricarica e correggere i criteri di P1-14 e P6-07 |
| Better Auth su libSQL | Better Auth ha un adattatore Drizzle per SQLite; la CLI genera lo schema, le migrazioni passano da drizzle-kit | Basso | P1-13 conferma con il client libSQL asincrono |
| Override di specie nel calcolatore | Nel codice di @smogon/calc il Pokémon unisce i dati della specie con le opzioni di override, da cui prende anche i tipi | Basso | P1-11 misura anche il peso aggiunto al bundle |
| Sprite | Copyright degli sprite di Nintendo, repository con licenza Creative Commons; per un'app personale basta citare la proprietà di Nintendo. Gli sprite della quinta generazione sono ufficiali | Basso | Nota di attribuzione nell'app e nel README |
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
| Nomi in italiano | PokéAPI, lingua "it" | Come sopra | Parziale: mosse e altre traduzioni presenti, luoghi da verificare |
| Incontri per area | PokéAPI, aree di Unima per black, white, black-2, white-2 | Come sopra | Presenti; precisione da verificare area per area |
| Regali, scambi, incontri fissi | PokéAPI in parte (scambi di Bianco 2 e Nero 2 aggiunti a maggio 2026) | Come sopra | Parziale; il resto a mano |
| Ordine delle aree | nuzlocke.data (file delle aree in ordine con le lotte dei boss) | Nessuna licenza: uso privato accettato, da rivedere prima di qualsiasi condivisione | Import da nuzlocke.data e verifica |
| Capipalestra, medaglie, level cap | Guide pubbliche; il level cap è il livello più alto nella squadra del boss | Dati fattuali da ricompilare, non copiare | Compilazione manuale, fonti in conflitto da risolvere |
| Sprite | PokeAPI/sprites | Copyright Nintendo, attribuzione | Utilizzabili nel repository privato |
| Tabelle dei tipi | Dati di @smogon/calc o guide pubbliche | Licenza MIT per @smogon/calc (da confermare in P1-10) | Non serve all'MVP |

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
