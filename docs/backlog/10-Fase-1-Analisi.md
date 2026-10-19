# Fase 1 – Raccolta dati e analisi tecnica

19 PBI. Priorità: P1-01, P1-04, P1-06 e P1-07 sui primi quattro giochi (Bianco, Nero, Bianco 2, Nero 2), con P1-19 in parallelo. Gli altri PBI senza dipendenze possono partire in parallelo subito dopo.

| ID | PBI | Dipende da | Taglia | Stato |
| --- | --- | --- | --- | --- |
| P1-01 | Inventario dei giochi supportati | — | S | Completato |
| P1-04 | Copertura PokéAPI: incontri per area | P1-01 | M | In verifica |
| P1-06 | Ordine di progressione delle aree | P1-04 | M | Da iniziare |
| P1-07 | Medaglie e level cap per gioco | P1-01 | M | Da iniziare |
| P1-19 | Sessione di chiarimento dei requisiti | — | S | Da iniziare |
| P1-02 | Copertura PokéAPI: specie, forme, statistiche, tipi | P1-01 | M | Da iniziare |
| P1-03 | Copertura PokéAPI: mosse, learnset, abilità | P1-01 | M | Da iniziare |
| P1-05 | Nomi localizzati italiano e inglese | — | S | Da iniziare |
| P1-08 | Tabelle dei tipi per generazione | — | S | Da iniziare |
| P1-09 | Differenze di meccaniche per generazione | P1-08 | S | Da iniziare |
| P1-10 | Licenze di dati e sprite | — | XS | Da iniziare |
| P1-11 | Prova: @smogon/calc con override | — | S | Da iniziare |
| P1-12 | Prova: Drizzle e libSQL, locale e Turso | — | S | Da iniziare |
| P1-13 | Prova: Better Auth con admin da variabili d'ambiente | P1-12 | S | Da iniziare |
| P1-14 | Prova: Paraglide con cambio lingua | — | XS | Da iniziare |
| P1-15 | Prova: build del Pokédex SQLite | P1-02, P1-03 | M | Da iniziare |
| P1-16 | Prova: sync SSE tra due browser | — | S | Da iniziare |
| P1-17 | Prova: immagine Docker multi-stage | P1-12 | S | Da iniziare |
| P1-18 | Stime e chiusura del gate 1 | tutti i P1 | S | Da iniziare |

## P1-01 Inventario dei giochi supportati

Output: [Analisi delle fonti dati](../progetto/10-Analisi-delle-fonti-dati.md#p1-01-inventario-dei-giochi-supportati).

- [x] Elenco di tutti i giochi principali dalla Gen 1 alla Gen 9, con generazione e version group di PokéAPI.
- [x] Ogni gioco marcato con il rilascio che lo supporta: Bianco, Nero, Bianco 2 e Nero 2 nell'MVP.
- [x] Remake e giochi fuori serie principale marcati come inclusi o esclusi, con motivo.

Nota di chiusura, 19 ottobre 2026: i rilasci dei giochi diversi dalla quinta generazione (0.5 o 1.0) sono una proposta, da confermare in P1-18; l'inclusione di Let's Go e dei due Leggende è da confermare in P1-19.

## P1-02 Copertura PokéAPI: specie, forme, statistiche, tipi

Output: Analisi delle fonti dati.

- [ ] Per ogni generazione: numero di specie e forme presenti rispetto al totale atteso.
- [ ] Verificato come PokéAPI gestisce tipi e statistiche cambiati tra generazioni.
- [ ] Lacune elencate con la decisione presa per ciascuna.

## P1-03 Copertura PokéAPI: mosse, learnset, abilità

Output: Analisi delle fonti dati.

- [ ] Learnset disponibili per version group, con i giochi mancanti elencati.
- [ ] Verificato se potenza, tipo e categoria delle mosse sono storicizzati per generazione.
- [ ] Lacune elencate con la decisione presa per ciascuna.

## P1-04 Copertura PokéAPI: incontri per area

Output: [Analisi delle fonti dati](../progetto/10-Analisi-delle-fonti-dati.md#p1-04-copertura-pokéapi-incontri-per-area).

- [x] Per ogni gioco: incontri presenti, parziali o assenti, partendo da Bianco, Nero, Bianco 2 e Nero 2.
- [x] Verificata la copertura di Gen 8 e Gen 9.
- [x] Regali e scambi in gioco: indicato se sono presenti come incontri.

## P1-05 Nomi localizzati italiano e inglese

Output: Analisi delle fonti dati.

- [ ] Percentuale di nomi italiani presenti per Pokémon, mosse, abilità, aree.
- [ ] Regola di fallback all'inglese definita.

## P1-06 Ordine di progressione delle aree

Output: Dati di gioco: aree, medaglie, level cap.

- [ ] Fonte scelta per l'ordine delle aree, o processo di inserimento manuale definito.
- [ ] Formato del file dati deciso, con i dati completi di Bianco, Nero, Bianco 2 e Nero 2 e l'area speciale starter in testa all'ordine; regali, incontri fissi e scambi hanno una chiave propria e l'area a cui appartengono.
- [ ] Modalità di aggiunta di aree personalizzate da parte dell'admin definita.

## P1-07 Medaglie e level cap per gioco

Output: Dati di gioco: aree, medaglie, level cap.

- [ ] Fonte scelta per medaglie e level cap, con licenza verificata.
- [ ] Formato dati deciso, con i dati completi di Bianco, Nero, Bianco 2 e Nero 2.
- [ ] Regola per i giochi senza palestre (per esempio le prove di Sole e Luna) definita.

## P1-08 Tabelle dei tipi per generazione

Output: Meccaniche per generazione.

- [ ] Tabelle complete per Gen 1, Gen 2–5 e Gen 6+, con le differenze evidenziate.
- [ ] Fonte citata e verificata su almeno 10 combinazioni campione.

## P1-09 Differenze di meccaniche per generazione

Output: Meccaniche per generazione.

- [ ] Regola fisico/speciale per tipo (Gen 1–3) e per mossa (Gen 4+) documentata.
- [ ] Elenco delle abilità che cambiano l'efficacia dei tipi, con effetto.
- [ ] Effetto della Teracristallizzazione su tipi e STAB documentato.

## P1-10 Licenze di dati e sprite

Output: Analisi delle fonti dati.

- [ ] Licenze di PokéAPI, dei suoi sprite e di @smogon/calc riportate.
- [ ] Condizioni d'uso compatibili con un'app self-hosted confermate o segnalate.

## P1-11 Prova: @smogon/calc con override

Output: Prove di fattibilità dello stack.

- [ ] Calcolo eseguito con tipi e statistiche di specie modificati.
- [ ] Verificato in almeno 3 generazioni diverse.
- [ ] Dimensione aggiunta al bundle misurata.

## P1-12 Prova: Drizzle e libSQL, locale e Turso

Output: Prove di fattibilità dello stack.

- [ ] Stesso codice funzionante su file locale e su Turso, cambiando solo variabili d'ambiente.
- [ ] Migrazioni applicate all'avvio in entrambi i casi.
- [ ] Modalità WAL attiva in locale.

## P1-13 Prova: Better Auth con admin da variabili d'ambiente

Output: Prove di fattibilità dello stack.

- [ ] Registrazione e login funzionanti su libSQL.
- [ ] Admin creato al primo avvio da `ADMIN_EMAIL` e `ADMIN_PASSWORD`, non ricreato ai riavvii.
- [ ] Cambio password obbligatorio al primo accesso dimostrato.

## P1-14 Prova: Paraglide con cambio lingua

Output: Prove di fattibilità dello stack.

- [ ] Cambio tra italiano e inglese con una ricarica della pagina che mantiene la schermata corrente.
- [ ] Lingua scelta ricordata tra le sessioni.
- [ ] Verificato che nel browser arrivi solo la lingua in uso.

## P1-15 Prova: build del Pokédex SQLite

Output: Prove di fattibilità dello stack.

- [ ] Script che genera il file SQLite da PokeAPI/api-data.
- [ ] Dimensione del file e tempo di build misurati.
- [ ] Tempo di una ricerca per nome misurato.

## P1-16 Prova: sync SSE tra due browser

Output: Prove di fattibilità dello stack.

- [ ] Una modifica in un browser compare nell'altro senza ricaricare.
- [ ] Riconnessione automatica dopo la perdita di connessione.

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

- [ ] Dupes clause: deciso il 3 ottobre 2026 che vale per il singolo giocatore; "già posseduta" vale per l'intera linea evolutiva. Contano tutti i Pokémon posseduti dal giocatore, anche quelli morti.
- [ ] Starter: deciso il 3 ottobre 2026, conta come un normale incontro collegato. Incontri fissi e scambi in gioco si trattano come i regali.
- [ ] Verificato con il product owner il disegno dei lock già scritto nella specifica (lease di 60 secondi, avviso a chi è sovrascritto).
- [ ] Definito il comportamento con rete instabile durante la partita.
- [ ] Specifica aggiornata con le decisioni prese.
