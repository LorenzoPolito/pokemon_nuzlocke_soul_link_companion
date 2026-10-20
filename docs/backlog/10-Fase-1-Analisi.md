# Fase 1 – Raccolta dati e analisi tecnica

19 PBI. Priorità: P1-01, P1-04, P1-06 e P1-07 sui primi quattro giochi (Bianco, Nero, Bianco 2, Nero 2), con P1-19 in parallelo. Gli altri PBI senza dipendenze possono partire in parallelo subito dopo.

| ID | PBI | Dipende da | Taglia | Stato |
| --- | --- | --- | --- | --- |
| P1-01 | Inventario dei giochi supportati | — | S | Completato |
| P1-04 | Copertura PokéAPI: incontri per area | P1-01 | M | In verifica |
| P1-06 | Ordine di progressione delle aree | P1-04 | M | In verifica |
| P1-07 | Medaglie e level cap per gioco | P1-01 | M | In verifica |
| P1-19 | Sessione di chiarimento dei requisiti | — | S | Completato |
| P1-02 | Copertura PokéAPI: specie, forme, statistiche, tipi | P1-01 | M | In verifica |
| P1-03 | Copertura PokéAPI: mosse, learnset, abilità | P1-01 | M | In verifica |
| P1-05 | Nomi localizzati italiano e inglese | — | S | Completato |
| P1-08 | Tabelle dei tipi per generazione | — | S | Completato |
| P1-09 | Differenze di meccaniche per generazione | P1-08 | S | Completato |
| P1-10 | Licenze di dati e sprite | — | XS | Completato |
| P1-11 | Prova: @smogon/calc con override | — | S | Completato |
| P1-12 | Prova: Drizzle e libSQL, locale e Turso | — | S | In corso |
| P1-13 | Prova: Better Auth con admin da variabili d'ambiente | P1-12 | S | Completato |
| P1-14 | Prova: Paraglide con cambio lingua | — | XS | In corso |
| P1-15 | Prova: build del Pokédex SQLite | P1-02, P1-03 | M | Da iniziare |
| P1-16 | Prova: sync SSE tra due browser | — | S | Completato |
| P1-17 | Prova: immagine Docker multi-stage | P1-12 | S | Da iniziare |
| P1-18 | Stime e chiusura del gate 1 | tutti i P1 | S | Da iniziare |

## P1-01 Inventario dei giochi supportati

Output: [Analisi delle fonti dati](../progetto/10-Analisi-delle-fonti-dati.md#p1-01-inventario-dei-giochi-supportati).

- [x] Elenco di tutti i giochi principali dalla Gen 1 alla Gen 9, con generazione e version group di PokéAPI.
- [x] Ogni gioco marcato con il rilascio che lo supporta: Bianco, Nero, Bianco 2 e Nero 2 nell'MVP.
- [x] Remake e giochi fuori serie principale marcati come inclusi o esclusi, con motivo.

Nota di chiusura, 19 ottobre 2026: i rilasci dei giochi diversi dalla quinta generazione (0.5 o 1.0) sono una proposta, da confermare in P1-18; l'inclusione di Let's Go e dei due Leggende è da confermare in P1-19.

## P1-02 Copertura PokéAPI: specie, forme, statistiche, tipi

Output: [Analisi delle fonti dati](../progetto/10-Analisi-delle-fonti-dati.md#p1-02-copertura-pokéapi-specie-forme-statistiche-tipi).

- [x] Per ogni generazione: numero di specie e forme presenti rispetto al totale atteso.
- [x] Verificato come PokéAPI gestisce tipi e statistiche cambiati tra generazioni.
- [x] Lacune elencate con la decisione presa per ciascuna.

Nota di chiusura, 19 ottobre 2026: le specie sono 1025 su 1025; per varietà e forme non c'è un totale atteso da una fonte raggiungibile, e la copertura è verificata per coerenza interna e per le forme dei giochi dell'MVP. Due domande per P2-04 (varietà dell'esemplare, forme cosmetiche).

## P1-03 Copertura PokéAPI: mosse, learnset, abilità

Output: [Analisi delle fonti dati](../progetto/10-Analisi-delle-fonti-dati.md#p1-03-copertura-pokéapi-mosse-learnset-abilità).

- [x] Learnset disponibili per version group, con i giochi mancanti elencati.
- [x] Verificato se potenza, tipo e categoria delle mosse sono storicizzati per generazione.
- [x] Lacune elencate con la decisione presa per ciascuna.

Nota di chiusura, 19 ottobre 2026: potenza, tipo, precisione e PP sono storicizzati per version group (con una convenzione diversa da quella di tipi e statistiche dei Pokémon); la categoria no. I learnset dei giochi dell'MVP sono completi; mancano quelli delle espansioni di Spada, Scudo, Scarlatto e Violetto e di Leggende: Z-A.

## P1-04 Copertura PokéAPI: incontri per area

Output: [Analisi delle fonti dati](../progetto/10-Analisi-delle-fonti-dati.md#p1-04-copertura-pokéapi-incontri-per-area).

- [x] Per ogni gioco: incontri presenti, parziali o assenti, partendo da Bianco, Nero, Bianco 2 e Nero 2.
- [x] Verificata la copertura di Gen 8 e Gen 9.
- [x] Regali e scambi in gioco: indicato se sono presenti come incontri.

## P1-05 Nomi localizzati italiano e inglese

Output: [Analisi delle fonti dati](../progetto/10-Analisi-delle-fonti-dati.md#p1-05-nomi-localizzati-italiano-e-inglese).

- [x] Percentuale di nomi italiani presenti per Pokémon, mosse, abilità, aree.
- [x] Regola di fallback all'inglese definita.

Modifica dei criteri, 19 ottobre 2026 ([ADR 0004](../adr/0004-fonti-dei-dati-nomi-e-giochi-per-rilascio.md)): per l'MVP i nomi di aree e medaglie restano in inglese; la percentuale per le aree è già misurata in P1-04 (nessun nome italiano per le località di Unima). Resta da misurare quella per Pokémon, mosse e abilità.

## P1-06 Ordine di progressione delle aree

Output: [Dati di gioco](../progetto/11-Dati-di-gioco.md#p1-06-ordine-di-progressione-delle-aree) e i file `data/games/*.json`.

- [x] Fonte scelta per l'ordine delle aree, o processo di inserimento manuale definito.
- [x] Formato del file dati deciso, con i dati completi di Bianco, Nero, Bianco 2 e Nero 2 e l'area speciale starter in testa all'ordine; regali, incontri fissi e scambi hanno una chiave propria e l'area a cui appartengono.
- [x] Modalità di aggiunta di aree personalizzate da parte dell'admin definita.

Nota di chiusura, 19 ottobre 2026: i nomi italiani delle aree sono `null` (fallback all'inglese) perché PokéAPI non li ha per Unima; si completano in P1-05. L'ordine di 15 aree di Nero e Bianco e 26 di Nero 2 e Bianco 2 non è stato verificato con la seconda fonte.

## P1-07 Medaglie e level cap per gioco

Output: [Dati di gioco](../progetto/11-Dati-di-gioco.md#p1-07-medaglie-e-level-cap-per-gioco) e i file `data/games/*.json` (`milestones`).

- [x] Fonte scelta per medaglie e level cap, con licenza verificata.
- [x] Formato dati deciso, con i dati completi di Bianco, Nero, Bianco 2 e Nero 2.
- [x] Regola per i giochi senza palestre (per esempio le prove di Sole e Luna) definita.

Nota di chiusura, 19 ottobre 2026: "licenza verificata" vuol dire che nuzlocke.data non ha licenza ed è usato per la decisione 7 (uso privato); ogni livello è confermato da una seconda fonte. I nomi italiani delle medaglie sono `null` (P1-05).

## P1-08 Tabelle dei tipi per generazione

Output: [Meccaniche per generazione](../progetto/13-Meccaniche-per-generazione.md#p1-08-tabelle-dei-tipi-per-generazione) e [`data/mechanics/type-chart.json`](../../data/mechanics/type-chart.json).

- [x] Tabelle complete per Gen 1, Gen 2–5 e Gen 6+, con le differenze evidenziate.
- [x] Fonte citata e verificata su almeno 10 combinazioni campione.

Nota di chiusura, 19 ottobre 2026: oltre ai 24 campioni, le tabelle costruite da PokéAPI coincidono con quelle di @smogon/calc 0.12.0 in tutte le 2677 celle delle nove generazioni.

## P1-09 Differenze di meccaniche per generazione

Output: [Meccaniche per generazione](../progetto/13-Meccaniche-per-generazione.md#p1-09-differenze-di-meccaniche-per-generazione).

- [x] Regola fisico/speciale per tipo (Gen 1–3) e per mossa (Gen 4+) documentata.
- [x] Elenco delle abilità che cambiano l'efficacia dei tipi, con effetto.
- [x] Effetto della Teracristallizzazione su tipi e STAB documentato.

Nota di chiusura, 19 ottobre 2026: fonti lette solo tramite ricerca web (rete limitata). Due punti da verificare in P1-11 con @smogon/calc (Parafulmine e Acquascolo come immunità dalla quinta); il conflitto sul tipo Astrale tra Bulbapedia e Serebii è aperto e riguarda solo la 1.0.

## P1-10 Licenze di dati e sprite

Output: [Analisi delle fonti dati](../progetto/10-Analisi-delle-fonti-dati.md#p1-10-licenze-di-dati-e-sprite).

- [x] Licenze di PokéAPI, dei suoi sprite e di @smogon/calc riportate.
- [x] Condizioni d'uso compatibili con un'app self-hosted confermate o segnalate.

Nota di chiusura, 19 ottobre 2026: gli sprite non hanno una licenza d'uso (copyright The Pokémon Company): uso privato tollerato, ridistribuzione no; per questo non si includono mai nel repository né nell'immagine. Il criterio "licenza" di P3-12 resta in attesa di una eventuale pubblicazione.

## P1-11 Prova: @smogon/calc con override

Output: [Prove di fattibilità dello stack](../progetto/14-Prove-di-fattibilita.md#p1-11-prova-smogoncalc-con-override).

- [x] Calcolo eseguito con tipi e statistiche di specie modificati.
- [x] Verificato in almeno 3 generazioni diverse.
- [x] Dimensione aggiunta al bundle misurata.

Nota di chiusura, 20 ottobre 2026: generazioni 3, 5 e 8. Bundle 504 KB (117 KB gzip). Confermato che Parafulmine e Acquascolo sono immunità dalla quinta. Attenzione: le chiavi delle statistiche negli override sono `hp, atk, def, spa, spd, spe`, quelle sbagliate vengono ignorate in silenzio.

## P1-12 Prova: Drizzle e libSQL, locale e Turso

Output: [Prove di fattibilità dello stack](../progetto/14-Prove-di-fattibilita.md#p1-12-prova-drizzle-e-libsql-locale-e-turso).

- [ ] Stesso codice funzionante su file locale e su Turso, cambiando solo variabili d'ambiente. (locale sì; Turso non raggiungibile da questo ambiente)
- [ ] Migrazioni applicate all'avvio in entrambi i casi. (solo in locale)
- [x] Modalità WAL attiva in locale.

Nota, 20 ottobre 2026: manca la parte Turso. Servono un database di prova, il token come segreto dell'ambiente e la rete verso `*.turso.io`.

## P1-13 Prova: Better Auth con admin da variabili d'ambiente

Output: [Prove di fattibilità dello stack](../progetto/14-Prove-di-fattibilita.md#p1-13-prova-better-auth-con-admin-da-variabili-dambiente).

- [x] Registrazione e login funzionanti su libSQL.
- [x] Admin creato al primo avvio da `ADMIN_EMAIL` e `ADMIN_PASSWORD`, non ricreato ai riavvii.
- [x] Cambio password obbligatorio al primo accesso dimostrato.

Nota di chiusura, 20 ottobre 2026: provato su libSQL in locale (la parte Turso resta aperta in P1-12). Il cancello del cambio password è codice dell'app; l'avvio dell'admin va reso idempotente; la registrazione è aperta di base; il CLI di schema non si installa, schema scritto a mano.

## P1-14 Prova: Paraglide con cambio lingua

Output: [Prove di fattibilità dello stack](../progetto/14-Prove-di-fattibilita.md#p1-14-prova-paraglide-con-cambio-lingua).

- [x] Cambio tra italiano e inglese con una ricarica della pagina che mantiene la schermata corrente.
- [x] Lingua scelta ricordata tra le sessioni.
- [ ] Verificato che nel browser arrivi solo la lingua in uso. (verificato: arrivano entrambe le lingue; serve la decisione del PO)

Nota, 20 ottobre 2026: il terzo criterio non è soddisfatto così com'è. Proposta: accettare entrambe le lingue nel client (decine di KB).

## P1-15 Prova: build del Pokédex SQLite

Output: Prove di fattibilità dello stack.

- [ ] Script che genera il file SQLite da PokeAPI/api-data.
- [ ] Dimensione del file e tempo di build misurati.
- [ ] Tempo di una ricerca per nome misurato.

## P1-16 Prova: sync SSE tra due browser

Output: [Prove di fattibilità dello stack](../progetto/14-Prove-di-fattibilita.md#p1-16-prova-sync-sse-tra-due-browser).

- [x] Una modifica in un browser compare nell'altro senza ricaricare.
- [x] Riconnessione automatica dopo la perdita di connessione.
- [x] Al ritorno si recuperano gli eventi mancanti a partire dall'ultimo ricevuto ([ADR 0002](../adr/0002-rete-instabile.md)).
- [x] Verificato che un reverse proxy davanti all'app non memorizzi in blocco le risposte SSE.

Nota di chiusura, 20 ottobre 2026: con nginx la compressione (`gzip` sul tipo `text/event-stream`) trattiene il flusso; va spenta per `/api/stream` (da scrivere nella guida di installazione). Provato solo nginx.

## P1-17 Prova: immagine Docker multi-stage

Output: Prove di fattibilità dello stack.

- [ ] Dimensione dell'immagine misurata.
- [ ] Tempo di avvio a freddo misurato.
- [ ] Database su volume sopravvive alla ricreazione del container.

## P1-18 Stime e chiusura del gate 1

Output: Piano di progetto.

- [ ] Tutti i PBI di fase 1 completati.
- [ ] Durata stimata per le fasi 2–7.
- [ ] PBI delle fasi successive rivisti alla luce dei risultati.

## P1-19 Sessione di chiarimento dei requisiti

Output: Specifica dei requisiti.

Già deciso: un solo gioco per run, uguale per tutti; impostazioni comuni a tutti i giocatori salvo gli override; lock sul dato in modifica e vince l'ultima modifica; app su qualsiasi server, solo HTTP; lock consultivi a scadenza definiti nella specifica.

- [x] Dupes clause: deciso il 3 ottobre 2026 che vale per il singolo giocatore; "già posseduta" vale per l'intera linea evolutiva. Contano tutti i Pokémon posseduti dal giocatore, anche quelli morti.
- [x] Starter: deciso il 3 ottobre 2026, conta come un normale incontro collegato. Incontri fissi e scambi in gioco si trattano come i regali.
- [x] Verificato con il product owner il disegno dei lock già scritto nella specifica (lease di 60 secondi, avviso a chi è sovrascritto): confermato il 19 ottobre 2026.
- [x] Definito il comportamento con rete instabile durante la partita: nessuna coda, riconnessione e recupero degli eventi, bozze nel browser ([ADR 0002](../adr/0002-rete-instabile.md)).
- [x] Specifica aggiornata con le decisioni prese.

Output: [Domande aperte](../progetto/12-Domande-aperte.md) (19 ottobre 2026): 19 domande (R-1…R-7 sulla rete instabile, D-1…D-12 dai PBI di fase 1) e 4 scelte dell'agente (S-1…S-4), tutte risolte dal product owner il 19 ottobre 2026. Decisioni nelle ADR [0002](../adr/0002-rete-instabile.md), [0003](../adr/0003-giochi-aree-e-impostazioni-della-run.md), [0004](../adr/0004-fonti-dei-dati-nomi-e-giochi-per-rilascio.md) e [0005](../adr/0005-adr-e-scelte-di-processo.md); specifica, modello dati e dati di gioco aggiornati.
