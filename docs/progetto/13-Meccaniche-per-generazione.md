# Nuzlocke SoulLink Companion – Meccaniche per generazione

Documento di output di P1-08 (tabelle dei tipi per generazione) e P1-09 (differenze di meccaniche per generazione). Descrive ciò che cambia tra una generazione e l'altra e come i dati sono conservati: la logica di gioco non ha rami per generazione ([Linee guida](05-Linee-guida-di-sviluppo.md#evoluzione-guidata-dai-dati)). Le sezioni dei PBI non ancora svolti si aggiungono quando il PBI si chiude.

## P1-08 Tabelle dei tipi per generazione

Data: 19 ottobre 2026. Taglia S.

### Fonti e verifica

| Fonte | Versione | Uso |
| --- | --- | --- |
| PokéAPI, CSV `type_efficacy`, `type_efficacy_past`, `types` ([PokeAPI/pokeapi](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv)) | commit `6fd69df` | Costruzione delle tabelle: la tabella attuale più le 6 righe storiche che dicono cosa era diverso prima |
| [@smogon/calc](https://github.com/smogon/damage-calc), file `dist/data/types.js` del pacchetto npm | versione 0.12.0, licenza MIT | Verifica indipendente, cella per cella |

**Costruzione dalla fonte PokéAPI**: i tipi di una generazione G sono quelli introdotti entro G (Acciaio e Buio dalla seconda, Folletto dalla sesta; esclusi `unknown`, `shadow` e `stellar`). Ogni cella vale il valore attuale, tranne dove `type_efficacy_past` ha una riga con generazione maggiore o uguale a G (la generazione della riga è l'**ultima** in cui valeva il valore vecchio, come per tipi e statistiche dei Pokémon in P1-02).

**Verifica**: le tabelle costruite da PokéAPI coincidono con quelle di @smogon/calc in **tutte le 2677 celle** delle nove generazioni (225 per la prima, 289 per ciascuna dalla seconda alla quinta, 324 per ciascuna dalla sesta alla nona), con 0 differenze. Il pacchetto di @smogon/calc è stato letto come testo, senza eseguirne il codice. Inoltre 24 combinazioni campione, scelte dalle regole note del gioco, danno il valore atteso (sotto).

**Quante tabelle**: tre, perché le generazioni 2–5 sono identiche tra loro, come le generazioni 6–9 (la nona aggiunge solo il tipo Stellar, che si tratta con la Teracristallizzazione e non fa parte della tabella).

### Le tre tabelle

Legenda: la riga è il tipo dell'**attacco**, la colonna il tipo del **difensore**; `2` superefficace, `½` poco efficace, `0` nessun effetto, `·` normale (1). Le sigle dei tipi sono le prime quattro lettere del nome italiano.

#### Generazione 6 e successive (18 tipi)

| Att. \ Dif. | Norm | Lott | Vola | Vele | Terr | Rocc | Cole | Spet | Acci | Fuoc | Acqu | Erba | Elet | Psic | Ghia | Drag | Buio | Foll |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Normale | · | · | · | · | · | ½ | · | 0 | ½ | · | · | · | · | · | · | · | · | · |
| Lotta | 2 | · | ½ | ½ | · | 2 | ½ | 0 | 2 | · | · | · | · | ½ | 2 | · | 2 | ½ |
| Volante | · | 2 | · | · | · | ½ | 2 | · | ½ | · | · | 2 | ½ | · | · | · | · | · |
| Veleno | · | · | · | ½ | ½ | ½ | · | ½ | 0 | · | · | 2 | · | · | · | · | · | 2 |
| Terra | · | · | 0 | 2 | · | 2 | ½ | · | 2 | 2 | · | ½ | 2 | · | · | · | · | · |
| Roccia | · | ½ | 2 | · | ½ | · | 2 | · | ½ | 2 | · | · | · | · | 2 | · | · | · |
| Coleottero | · | ½ | ½ | ½ | · | · | · | ½ | ½ | ½ | · | 2 | · | 2 | · | · | 2 | ½ |
| Spettro | 0 | · | · | · | · | · | · | 2 | · | · | · | · | · | 2 | · | · | ½ | · |
| Acciaio | · | · | · | · | · | 2 | · | · | ½ | ½ | ½ | · | ½ | · | 2 | · | · | 2 |
| Fuoco | · | · | · | · | · | ½ | 2 | · | 2 | ½ | ½ | 2 | · | · | 2 | ½ | · | · |
| Acqua | · | · | · | · | 2 | 2 | · | · | · | 2 | ½ | ½ | · | · | · | ½ | · | · |
| Erba | · | · | ½ | ½ | 2 | 2 | ½ | · | ½ | ½ | 2 | ½ | · | · | · | ½ | · | · |
| Elettro | · | · | 2 | · | 0 | · | · | · | · | · | 2 | ½ | ½ | · | · | ½ | · | · |
| Psico | · | 2 | · | 2 | · | · | · | · | ½ | · | · | · | · | ½ | · | · | 0 | · |
| Ghiaccio | · | · | 2 | · | 2 | · | · | · | ½ | ½ | ½ | 2 | · | · | ½ | 2 | · | · |
| Drago | · | · | · | · | · | · | · | · | ½ | · | · | · | · | · | · | 2 | · | 0 |
| Buio | · | ½ | · | · | · | · | · | 2 | · | · | · | · | · | 2 | · | · | ½ | ½ |
| Folletto | · | 2 | · | ½ | · | · | · | · | ½ | ½ | · | · | · | · | · | 2 | 2 | · |

#### Generazioni 2–5 (17 tipi; in grassetto le celle diverse dalla 6+)

| Att. \ Dif. | Norm | Lott | Vola | Vele | Terr | Rocc | Cole | Spet | Acci | Fuoc | Acqu | Erba | Elet | Psic | Ghia | Drag | Buio |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Normale | · | · | · | · | · | ½ | · | 0 | ½ | · | · | · | · | · | · | · | · |
| Lotta | 2 | · | ½ | ½ | · | 2 | ½ | 0 | 2 | · | · | · | · | ½ | 2 | · | 2 |
| Volante | · | 2 | · | · | · | ½ | 2 | · | ½ | · | · | 2 | ½ | · | · | · | · |
| Veleno | · | · | · | ½ | ½ | ½ | · | ½ | 0 | · | · | 2 | · | · | · | · | · |
| Terra | · | · | 0 | 2 | · | 2 | ½ | · | 2 | 2 | · | ½ | 2 | · | · | · | · |
| Roccia | · | ½ | 2 | · | ½ | · | 2 | · | ½ | 2 | · | · | · | · | 2 | · | · |
| Coleottero | · | ½ | ½ | ½ | · | · | · | ½ | ½ | ½ | · | 2 | · | 2 | · | · | 2 |
| Spettro | 0 | · | · | · | · | · | · | 2 | **½** | · | · | · | · | 2 | · | · | ½ |
| Acciaio | · | · | · | · | · | 2 | · | · | ½ | ½ | ½ | · | ½ | · | 2 | · | · |
| Fuoco | · | · | · | · | · | ½ | 2 | · | 2 | ½ | ½ | 2 | · | · | 2 | ½ | · |
| Acqua | · | · | · | · | 2 | 2 | · | · | · | 2 | ½ | ½ | · | · | · | ½ | · |
| Erba | · | · | ½ | ½ | 2 | 2 | ½ | · | ½ | ½ | 2 | ½ | · | · | · | ½ | · |
| Elettro | · | · | 2 | · | 0 | · | · | · | · | · | 2 | ½ | ½ | · | · | ½ | · |
| Psico | · | 2 | · | 2 | · | · | · | · | ½ | · | · | · | · | ½ | · | · | 0 |
| Ghiaccio | · | · | 2 | · | 2 | · | · | · | ½ | ½ | ½ | 2 | · | · | ½ | 2 | · |
| Drago | · | · | · | · | · | · | · | · | ½ | · | · | · | · | · | · | 2 | · |
| Buio | · | ½ | · | · | · | · | · | 2 | **½** | · | · | · | · | 2 | · | · | ½ |

#### Generazione 1 (15 tipi; in grassetto le celle diverse dalle generazioni 2–5)

| Att. \ Dif. | Norm | Lott | Vola | Vele | Terr | Rocc | Cole | Spet | Fuoc | Acqu | Erba | Elet | Psic | Ghia | Drag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Normale | · | · | · | · | · | ½ | · | 0 | · | · | · | · | · | · | · |
| Lotta | 2 | · | ½ | ½ | · | 2 | ½ | 0 | · | · | · | · | ½ | 2 | · |
| Volante | · | 2 | · | · | · | ½ | 2 | · | · | · | 2 | ½ | · | · | · |
| Veleno | · | · | · | ½ | ½ | ½ | **2** | ½ | · | · | 2 | · | · | · | · |
| Terra | · | · | 0 | 2 | · | 2 | ½ | · | 2 | · | ½ | 2 | · | · | · |
| Roccia | · | ½ | 2 | · | ½ | · | 2 | · | 2 | · | · | · | · | 2 | · |
| Coleottero | · | ½ | ½ | **2** | · | · | · | ½ | ½ | · | 2 | · | 2 | · | · |
| Spettro | 0 | · | · | · | · | · | · | 2 | · | · | · | · | **0** | · | · |
| Fuoco | · | · | · | · | · | ½ | 2 | · | ½ | ½ | 2 | · | · | 2 | ½ |
| Acqua | · | · | · | · | 2 | 2 | · | · | 2 | ½ | ½ | · | · | · | ½ |
| Erba | · | · | ½ | ½ | 2 | 2 | ½ | · | ½ | 2 | ½ | · | · | · | ½ |
| Elettro | · | · | 2 | · | 0 | · | · | · | · | 2 | ½ | ½ | · | · | ½ |
| Psico | · | 2 | · | 2 | · | · | · | · | · | · | · | · | ½ | · | · |
| Ghiaccio | · | · | 2 | · | 2 | · | · | · | **·** | ½ | 2 | · | · | ½ | 2 |
| Drago | · | · | · | · | · | · | · | · | · | · | · | · | · | · | 2 |

### Differenze tra le tre tabelle

| Da | A | Celle |
| --- | --- | --- |
| Generazione 1 | Generazioni 2–5 | **4 celle**: Veleno su Coleottero (2 → 1), Coleottero su Veleno (2 → ½), Spettro su Psico (0 → 2: nella prima generazione un errore del gioco lo rendeva inefficace), Ghiaccio su Fuoco (1 → ½). In più compaiono i tipi Acciaio e Buio, con le loro righe e colonne |
| Generazioni 2–5 | Generazioni 6+ | **2 celle**: Spettro su Acciaio e Buio su Acciaio (½ → 1). In più compare il tipo Folletto, con la sua riga e la sua colonna |

### Campioni verificati

| Generazione | Attacco | Difensore | Valore | Regola |
| --- | --- | --- | --- | --- |
| 6+ | Fuoco | Erba | 2 | Fuoco batte Erba |
| 6+ | Acqua | Fuoco | 2 | Acqua batte Fuoco |
| 6+ | Elettro | Terra | 0 | Terra è immune all'Elettro |
| 6+ | Terra | Volante | 0 | Volante è immune a Terra |
| 6+ | Normale | Spettro | 0 | Spettro è immune a Normale |
| 6+ | Lotta | Spettro | 0 | Spettro è immune a Lotta |
| 6+ | Psico | Buio | 0 | Buio è immune a Psico |
| 6+ | Drago | Folletto | 0 | Folletto è immune a Drago |
| 6+ | Folletto | Drago | 2 | Folletto batte Drago |
| 6+ | Acciaio | Folletto | 2 | Acciaio batte Folletto |
| 6+ | Spettro | Acciaio | 1 | Dalla sesta Acciaio non resiste più a Spettro |
| 2–5 | Spettro | Acciaio | ½ | Acciaio resiste a Spettro |
| 2–5 | Buio | Acciaio | ½ | Acciaio resiste a Buio |
| 2–5 | Ghiaccio | Fuoco | ½ | Fuoco resiste a Ghiaccio |
| 2–5 | Coleottero | Veleno | ½ | Veleno resiste a Coleottero |
| 2–5 | Spettro | Psico | 2 | Spettro batte Psico |
| 1 | Ghiaccio | Fuoco | 1 | Nella prima generazione Fuoco non resiste a Ghiaccio |
| 1 | Coleottero | Veleno | 2 | Nella prima generazione Coleottero batte Veleno |
| 1 | Veleno | Coleottero | 2 | Nella prima generazione Veleno batte Coleottero |
| 1 | Spettro | Psico | 0 | Errore della prima generazione |
| 1 | Fuoco | Erba | 2 | Fuoco batte Erba |
| 1 | Elettro | Terra | 0 | Terra è immune all'Elettro |

(Le 24 combinazioni provate sono le 22 sopra più Spettro su Normale (6+) e Psico su Buio (2–5), entrambi 0.)

### Dati

Le tre tabelle sono in [`data/mechanics/type-chart.json`](../../data/mechanics/type-chart.json), una per epoca (`gen1`, `gen2-5`, `gen6+`) con l'elenco delle generazioni che ne fanno parte, i tipi e il moltiplicatore per ogni coppia (attacco, difensore). Il modulo `battle` sceglie l'epoca dalla generazione del gioco della run, senza rami per generazione. Non contengono le abilità né la Teracristallizzazione, che sono in P1-09.

### Decisioni prese

- Tre tabelle per epoca (1; 2–5; 6+), derivate da PokéAPI e verificate con @smogon/calc, conservate in un file di dati.
- I tipi `unknown`, `shadow` e `stellar` non fanno parte della tabella.
- Il test di P5-05 confronta il motore dei tipi con questo file, tutte le combinazioni.

### Domande aperte

Nessuna.
