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

## P1-09 Differenze di meccaniche per generazione

Data: 19 ottobre 2026. Taglia S.

### Fonti e limiti

| Fonte | Uso |
| --- | --- |
| Bulbapedia (pagine "Physical move", "Special move", "Category:Abilities that alter damage taken", "Terastal phenomenon"), via ricerca web | Regola fisico/speciale, abilità, Teracristallizzazione |
| Serebii ("Changes to the Battle System", "The Stellar Type"), via ricerca web | Confronto sul tipo Astrale |
| PokéBase (PokémonDB) | Confronto sulle abilità |
| `abilities.csv` di PokéAPI | Generazione in cui compare ogni abilità |

Le pagine non sono apribili direttamente da questo ambiente (rete limitata): i fatti sono letti dai risultati della ricerca, non dalle pagine intere. Dove le fonti divergono o non ho potuto verificare, è scritto.

### Fisico e speciale

- **Generazioni 1–3**: la categoria dipende dal **tipo** della mossa. Fisici: Normale, Lotta, Volante, Veleno, Terra, Roccia, Coleottero, Spettro, Acciaio. Speciali: Fuoco, Acqua, Erba, Elettro, Psico, Ghiaccio, Drago, Buio. Ogni mossa che infligge danno segue il suo tipo.
- **Dalla generazione 4**: la categoria è una proprietà della **singola mossa**, indipendente dal tipo. Alcune mosse cambiano rispetto alla regola per tipo (per esempio Iper Raggio e Fangobomba diventano speciali).
- In 1–3 solo Introforza (Hidden Power) e Palla Clima (Weather Ball) possono cadere in entrambe le categorie, perché cambiano tipo; dalla 4 non è più un caso particolare.
- Nelle generazioni 1–3 Buio esiste solo dalla 2 e Acciaio solo dalla 2: la regola per tipo vale per i tipi della tabella dell'epoca.

Per i dati: PokéAPI conserva la categoria **attuale** di ogni mossa (`damage_class`), non storicizzata ([P1-03](10-Analisi-delle-fonti-dati.md)). Quindi:

- per le generazioni 4 e successive si usa la categoria della mossa, con il rischio (non verificato) che qualche mossa abbia cambiato categoria dopo la quarta;
- per le generazioni 1–3 si deriva dal tipo della mossa nella versione del gioco, con una tabella di 17 voci nel file di dati.

I giochi dell'MVP sono tutti di quinta generazione, quindi nell'MVP vale sempre la categoria della mossa.

### Abilità che cambiano l'efficacia dei tipi

Generazione in cui l'abilità compare, da `abilities.csv` di PokéAPI. Un'abilità non esiste nei giochi precedenti alla sua generazione.

| Abilità | Gen. | Effetto sul calcolo |
| --- | --- | --- |
| Levitazione (Levitate) | 3 | Immunità alle mosse di tipo Terra |
| Assorbacqua (Water Absorb) | 3 | Immunità a Acqua, cura 1/4 dei PS |
| Assorbivolt (Volt Absorb) | 3 | Immunità a Elettro, cura 1/4 dei PS |
| Prodigio (Flash Fire) | 3 | Immunità a Fuoco, potenzia le proprie mosse Fuoco (+50 %) dopo il colpo |
| Parafulmine (Lightning Rod) | 3 | Attira le mosse Elettro; immunità dalla quinta (confermato con @smogon/calc, P1-11) |
| Grassospesso (Thick Fat) | 3 | Dimezza il danno di Fuoco e Ghiaccio |
| Magicguardia (Wonder Guard) | 3 | Subisce solo mosse superefficaci |
| Pellearida (Dry Skin) | 4 | Immunità a Acqua con cura 1/4; +25 % dal Fuoco |
| Ignifugo (Heatproof) | 4 | Dimezza il danno di Fuoco |
| Motorizzato (Motor Drive) | 4 | Immunità a Elettro, +1 Velocità |
| Acquascolo (Storm Drain) | 4 | Immunità a Acqua, +1 Att. Sp. (dalla quinta, confermato con @smogon/calc, P1-11) |
| Filtro (Filter) e Roccia (Solid Rock) | 4 | Riducono del 25 % il danno superefficace |
| Lentiscelta (Tinted Lens) | 4 | Le mosse poco efficaci infliggono danno pieno (raddoppia il danno) |
| Intrepidopiede (Scrappy) | 4 | Normale e Lotta colpiscono lo Spettro |
| Rompiforma (Mold Breaker) | 4 | Ignora le abilità difensive del bersaglio |
| Raccolto (Sap Sipper) | 5 | Immunità a Erba, +1 Attacco |
| Turbofiamma / Teravolt | 5 | Come Rompiforma (Turboblaze, Teravolt) |
| Corrente Delta (Delta Stream) | 6 | Elimina le debolezze dei Volanti |
| Pelle Corazza (Prism Armor) e Pelo Soffice (Fluffy) | 7 | Prism Armor: come Filtro; Fluffy: dimezza il contatto, raddoppia Fuoco |
| Normalizzazione e simili (Normalize, Aerilate, Pixilate, Refrigerate, Galvanize) | 4–7 | Cambiano il tipo delle mosse in uscita |
| Guscio Tera (Tera Shell), Terra-Mangiatore (Earth Eater), Sale Purificante (Purifying Salt) e altre della nona | 9 | Si aggiungono all'elenco; non servono nell'MVP |

Note:

- I nomi italiani nella tabella sono indicativi: nell'app i nomi si leggono dai dati di PokéAPI ([P1-05](10-Analisi-delle-fonti-dati.md)), non da qui. I nomi italiani li ho scritti a memoria e non li ho riletti dai dati: vanno trattati come etichette di lavoro, l'identificativo è il nome inglese.
- Parafulmine e Acquascolo sono immunità dalla quinta generazione: verificato in P1-11 con @smogon/calc 0.12.0 (nelle generazioni 3 e 4 il Pokémon subisce il danno pieno; dalla 5 il danno è 0). Vedi le [prove di fattibilità](14-Prove-di-fattibilita.md#p1-11-prova-smogoncalc-con-override).
- Il tipo effettivo di una mossa può cambiare per abilità, strumenti o mosse (Normalizzazione, Introforza, Palla Clima, Pressa Volante, Gelo Secco): non sono nella tabella dei tipi, ma nel calcolo.
- Nell'MVP (quinta generazione) contano le abilità fino a Raccolto, Turbofiamma e Teravolt.

### Teracristallizzazione (nona generazione)

- **Fuori dall'MVP**: esiste solo in Scarlatto e Violetto (e nelle espansioni), previsti in 1.0.
- **Difesa**: il Pokémon prende il tipo Teracristallo e perde i tipi originali (Bulbapedia). Fa eccezione il tipo Astrale, vedi sotto.
- **Attacco (STAB)**: il Pokémon conserva lo STAB dei tipi originali e acquisisce lo STAB del tipo Tera. Se il tipo Tera coincide con uno dei suoi tipi originali, lo STAB per quel tipo passa da 1,5 a 2; con Adattabilità, a 2,25.
- **Tipo Astrale (Stellar)**: le fonti non coincidono. Bulbapedia scrive che il Pokémon Astrale diventa debole alle mosse Astrali; Serebii e PokéBase riportano che l'Astrale non cambia le debolezze e le resistenze e si limita a un bonus alle mosse (+20 % la prima volta che si usa un tipo, raddoppio per i tipi originali). **Non ho potuto risolvere il conflitto**: non lo decido io. Il tipo Astrale (e Terapagos, che lo ha sempre) è fuori dall'MVP; la scelta si prende prima della 1.0 con una prova su @smogon/calc.

### Cosa serve ai dati

- Una tabella `categoria per tipo` (17 voci) per le generazioni 1–3, accanto alla tabella dei tipi per epoca; dalla 4 si usa la categoria della mossa.
- Per le abilità: nessun ramo per generazione nel codice; i dati dicono, per ogni abilità, quale tipo bloccano o modificano, e da quale generazione esiste.
- La Teracristallizzazione è uno stato per Pokémon (tipo Tera) che sostituisce i tipi difensivi: modello dati da prevedere in 1.0.

### Decisioni prese

- La categoria fisica/speciale si decide per tipo in 1–3 e per mossa dalla 4; nell'MVP vale sempre la mossa.
- Le abilità e la Teracristallizzazione non stanno nella tabella dei tipi: sono modificatori applicati dal modulo `battle`.
- Il conflitto sul tipo Astrale resta aperto fino alla 1.0.

### Domande aperte

Nessuna per l'MVP. Per la 1.0: effetto difensivo del tipo Astrale (fonti discordi).
