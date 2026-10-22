# Nuzlocke SoulLink Companion – Revisione del gate 2

Documento di output di P2-14. Raccoglie la revisione incrociata di modello dati, API e schermate, la tracciabilità dei requisiti sui PBI delle fasi 3–7 e le decisioni che servono al product owner per chiudere il gate. Data: 20 ottobre 2026.

## 1. Revisione incrociata

Documenti confrontati: [modello dati](06-Modello-dati-bozza.md), [schema del Pokédex](15-Schema-del-Pokedex.md), [architettura e API](16-Architettura-e-API.md), [flussi e schermate](17-Flussi-e-schermate.md), [specifica](01-Specifica-dei-requisiti.md), [ADR](../adr/README.md) e i PBI delle fasi 3–7. Nella revisione sono emerse le incoerenze qui sotto; tutte sono state corrette nei documenti, tranne dove è indicata una decisione.

| # | Incoerenza trovata | Esito |
| --- | --- | --- |
| 1 | Il mockup delle impostazioni blocca dupes clause, regali e tipo primario dopo il primo incontro; P2-02 li lasciava modificabili | Corretto P2-02 e il catalogo API (P2-12) |
| 2 | Il flusso di creazione richiede posti per invitati che non hanno ancora un account, ma `run_member.user_id` era obbligatorio | Posti in attesa (P2-11): `user_id` nullo, `display_name`, `invite.member_id` |
| 3 | Gli esiti dell'incontro nel mockup («Sconfitto», «Regalo») non coincidevano con quelli del modello | Modello: `caught`, `failed`, `fled`, `dupe`, `untracked`; il regalo è una provenienza; mockup da allineare (elenco in P2-12) |
| 4 | Il segnale SSE come commento non è visibile al client del browser | Evento con nome `ping` (P2-10); criterio di P3-10 aggiornato |
| 5 | La specifica dice che Paraglide «carica solo la lingua in uso» e stima l'immagine in 150–200 MB; le prove danno entrambe le lingue e 300 MB | Specifica corretta con riferimento alle prove e all'[ADR 0008](../adr/0008-esiti-della-fase-1.md) |
| 6 | Il diagramma entità-relazioni era un segnaposto con un'immagine fuori dal repository | Sostituito con un diagramma Mermaid nel modello dati |
| 7 | Nessun PBI copriva: elenco «Le mie run», profilo dell'utente, tabella e middleware di idempotenza, funzione `authorize` con test della matrice, posti in attesa, riepilogo e nuova run dalla fine di una run, job di eliminazione delle run dopo 30 giorni, endpoint di `seen_trainer` e calcolo sul server | Criteri aggiunti a P3-03, P3-07, P4-01, P4-02, P4-14, P4-19, P5-10, P5-12 |
| 8 | Il criterio di P4-02 permette di rimuovere un partecipante solo fino al primo incontro; P2-02 lo permette sempre | Deciso: sempre ammessa; P4-02 corretto ([ADR 0009](../adr/0009-decisioni-della-fase-2.md)) |
| 9 | Nessun PBI prevede i dati di gioco dei giochi del rilascio 0.5 e 1.0 ([ADR 0004](../adr/0004-fonti-dei-dati-nomi-e-giochi-per-rilascio.md)) | **Da pianificare** (sezione 4) |
| 10 | Le tabelle dei tipi, le meccaniche e il Pokédex sono già in tre posti (file dati, schema, documento): rischio di divergenza | Regola: `data/mechanics/type-chart.json` è l'unica fonte delle tabelle dei tipi; il Pokédex SQLite non le duplica |

Controlli che non hanno trovato problemi: ogni endpoint del catalogo ha un'azione di permesso; ogni azione è nella matrice; ogni evento del diario ha un evento SSE; ogni colonna citata nei flussi esiste nel modello; i nomi di chiave dei dati di gioco usati dal modello (`areaKey`, `special_key`, `milestone_key`) esistono nello schema dei file di gioco.

## 2. Tracciabilità dei requisiti

Ogni riga della specifica ha almeno un PBI delle fasi 3–7. «Rilascio» è quello di [MVP e rilasci](03-MVP-e-rilasci.md).

| # | Requisito | Sezione della specifica | PBI | Rilascio |
| --- | --- | --- | --- | --- |
| R-01 | Login con email e password; utenti e sessioni nel database | Account | P3-07 | 0.1 |
| R-02 | Admin da `ADMIN_EMAIL` e `ADMIN_PASSWORD`, cambio password al primo accesso | Account | P3-08 | 0.1 |
| R-03 | L'admin gestisce utenti, modalità di registrazione e inviti | Account | P3-09 | 0.1 |
| R-04 | Aree personalizzate aggiunte dall'admin | Account | P4-04 | 0.1 |
| R-05 | Ruoli per run: proprietario, giocatore, spettatore | Account | P4-02, P3-07 (`authorize`) | 0.1 |
| R-06 | Account eliminato: run restano, nome anonimo, proprietà al successivo | Account | P3-09 | 0.1 |
| R-07 | Run cancellata recuperabile per 30 giorni | Account | P4-14 | 0.1 |
| R-08 | Profilo: lingua, tema, password | Lingue | P3-07, P3-05 | 0.1 |
| R-09 | Un gioco per run, uguale per tutti; il gioco è una versione | Run | P4-03 | 0.1 |
| R-10 | Creazione della run con regole | Run | P4-01 | 0.1 |
| R-11 | Regole base e Soul Link sempre attive | Run | P4-01, P4-05, P4-06, P4-07, P4-11, P4-13 | 0.1 |
| R-12 | Collegamento automatico degli incontri; area saltata per tutti | Run | P4-06, P4-07 | 0.1 |
| R-13 | Dupes clause | Run | P4-08 | 0.2 |
| R-14 | Restrizione del tipo primario | Run | P4-12 | 0.2 |
| R-15 | Regali, incontri fissi e scambi separati | Run | P4-09 | 0.2 |
| R-16 | Stanze interne come aree separate; ordine delle aree solo di visualizzazione | Run | P4-01, P4-04 | 0.1 |
| R-17 | Difficoltà di Nero 2 e Bianco 2 e level cap | Run | P4-01, P4-15 | 0.1 |
| R-18 | Run già iniziata | Run | P4-19 | 0.2 |
| R-19 | Elenco delle mie run | Tracker | P4-01 | 0.1 |
| R-20 | Stato dell'incontro per giocatore | Tracker | P4-05 | 0.1 |
| R-21 | Dati dell'esemplare | Tracker | P4-10 | 0.1 |
| R-22 | Team e box con posizione condivisa | Tracker | P4-11 | 0.1 |
| R-23 | Morte con causa e propagazione; cimitero | Tracker | P4-13, P4-17 | 0.1 |
| R-24 | Fine della run | Tracker | P4-14 | 0.1 |
| R-25 | Tappe, medaglie e level cap | Tracker | P4-15 | 0.1 |
| R-26 | Timeline degli eventi | Tracker | P4-16 | 0.2 |
| R-27 | Sync in tempo reale (SSE) | Tracker, Rete instabile | P3-10, P4-18 | 0.1 |
| R-28 | Lock consultivi e «vince l'ultimo» | Concorrenza | P4-21 | 0.1 |
| R-29 | Senza rete non si modifica; avviso; riconnessione | Rete instabile | P4-18 | 0.1 |
| R-30 | Bozze nel browser | Rete instabile | P4-10 | 0.1 |
| R-31 | Idempotenza con chiave a 24 ore | Rete instabile | P3-03 | 0.1 |
| R-32 | Azioni di gruppo atomiche | Concorrenza | P4-06, P4-11, P4-13 | 0.1 |
| R-33 | Flag randomizer | Randomizer | P4-20 | 0.3 |
| R-34 | Override per specie per giocatore, segnalazione e ripristino, copia | Override | P5-01, P5-02, P5-03 | 0.3 |
| R-35 | Dati effettivi in tracker, helper e calcolatore | Override | P5-04 | 0.3 |
| R-36 | Helper: scelta di proprio Pokémon e avversario, tipi, debolezze, mosse, mosse osservate, squadre salvate, senza suggerimenti | Helper | P5-07, P5-08, P5-09, P5-10, P5-11 | 0.3 |
| R-37 | Tabella dei tipi per generazione; fisico o speciale per tipo fino alla Gen 3 | Helper | P5-05 | 0.3 |
| R-38 | Abilità che cambiano l'efficacia | Helper | P5-06 | 0.3 |
| R-39 | Teracristallizzazione | Helper | P5-14 | 1.0 |
| R-40 | Calcolatore danni attivabile per run, con override | Helper | P5-12, P5-13 | 0.4 |
| R-41 | Pokédex incluso nell'immagine, generato in build da api-data | Pokédex | P3-04 | 0.1 |
| R-42 | Lista, ricerca, scheda, learnset, incontri, mosse e abilità del Pokédex | Pokédex | P6-01, P6-02, P6-03, P6-04, P6-05 | 0.4 |
| R-43 | Sprite con cache e immagine di riserva | Pokédex | P6-06 | 0.4 |
| R-44 | Nomi localizzati con inglese come riserva | Lingue | P6-07, P3-04 | 0.1 |
| R-45 | Interfaccia in italiano e inglese; selettore di lingua | Lingue | P3-05 | 0.1 |
| R-46 | Collegamenti dal tracker e dall'helper al Pokédex | Pokédex | P6-08 | 0.4 |
| R-47 | Skeleton, immagine Docker, volume dei dati | Architettura | P3-01, P3-02 | 0.1 |
| R-48 | Database libSQL locale o Turso; migrazioni | Architettura | P3-03 | 0.1 (Turso 1.0) |
| R-49 | Solo HTTP, reverse proxy, avviso all'admin in HTTP | Vincoli | P3-13, P3-09 | 0.1 |
| R-50 | Layout, navigazione, tema chiaro e scuro, 360 px | Architettura | P3-06 | 0.1 |
| R-51 | Una sola istanza; backup a carico di chi installa | Vincoli | P7-05, P7-06 | 0.1 |
| R-52 | Dati di incontro incompleti: messaggio e aree aggiunte a mano | Vincoli | P6-04, P4-04 | 0.1 e 0.4 |
| R-53 | Giochi dei rilasci 0.5 e 1.0 | Vincoli | **nessun PBI** (sezione 4) | 0.5, 1.0 |
| R-54 | Verifica locale, hook, repository | Processo | P3-11, P3-12 | 0.1 |
| R-55 | Piano di test, test end-to-end, prestazioni, guida, rilascio | Processo | P7-01, P7-02, P7-03, P7-04, P7-05, P7-07 | 0.1 e 1.0 |

Tutti i requisiti hanno un PBI tranne R-53 (sezione 4).

## 3. Decisioni che servono al product owner

**Tutte accettate dal product owner il 22 ottobre 2026 («Come proposto»), registrate nell'[ADR 0009](../adr/0009-decisioni-della-fase-2.md).**

| # | Decisione | Proposta | Dove |
| --- | --- | --- | --- |
| 1 | Modalità di registrazione predefinita | **Su invito** | [P2-01](06-Modello-dati-bozza.md#modalità-di-registrazione) |
| 2 | Valori predefiniti delle regole opzionali | Dupes clause e regali separati accesi; tipo primario e randomizer spenti; calcolatore acceso; stanze interne accese | [P2-02](06-Modello-dati-bozza.md#impostazioni-della-run-runsettings) |
| 3 | Proprietario che non gioca | Ammesso | [P2-02](06-Modello-dati-bozza.md#giocatori-e-ruoli-nella-run) |
| 4 | Modifica dei dati di un altro giocatore | Solo i propri; il proprietario tutti; le azioni di gruppo (spostare, morte) ogni giocatore | [P2-08](16-Architettura-e-API.md#dati-di-un-altro-giocatore) |
| 5 | Rimozione di un giocatore dopo il primo incontro | Sempre ammessa (conversione in spettatore o rimozione); da cambiare il criterio di P4-02, che oggi la limita al periodo senza incontri | [P2-02](06-Modello-dati-bozza.md#giocatori-e-ruoli-nella-run) |
| 6 | L'admin non entra nei dati di una run di cui non è membro | Sì | [P2-08](16-Architettura-e-API.md#p2-08-modello-dei-permessi) |
| 7 | Varietà nella chiave degli override; `base_stats` salvato completo | Sì | [P2-05](06-Modello-dati-bozza.md#chiave-e-righe) |
| 8 | Gruppo `untracked` e giocatori che entrano a run iniziata; regalo e selvatico con `separateGifts` spento: vale il primo registrato | Come scritto | [P2-03](06-Modello-dati-bozza.md#p2-03-aree-incontri-e-link-soul-link) |
| 9 | Cancellazione di un incontro catturato: riservata al proprietario | Sì | [P2-09](16-Architettura-e-API.md#p2-09-catalogo-delle-api) |
| 10 | Colore dei moltiplicatori e ordine di «riceve» nell'helper | Colore mantenuto come informazione; ordine fisso dei tipi | [P2-13](17-Flussi-e-schermate.md#verifica-sul-mockup-criterio-di-p2-13) |
| 11 | Descrizioni di mosse e abilità | Non nel Pokédex dell'MVP | [P2-13](17-Flussi-e-schermate.md#differenze-tra-mockup-e-decisioni-lotte-e-pokédex) |
| 12 | Dove gira il calcolo | Sul server | [P2-13](17-Flussi-e-schermate.md#dove-si-calcola) |
| 13 | «Sessione» nel riepilogo di una run finita | Eventi senza pause oltre 3 ore | [P2-12](17-Flussi-e-schermate.md#differenze-tra-mockup-e-decisioni-tracker) |

## 4. Da pianificare: giochi dei rilasci 0.5 e 1.0

L'[ADR 0004](../adr/0004-fonti-dei-dati-nomi-e-giochi-per-rilascio.md) prevede 17 giochi nel rilascio 0.5 e tre nel 1.0, ma il backlog ha solo i PBI dei primi quattro giochi (P1-06, P1-07). Servono, per ogni gruppo di giochi, un PBI di dati (aree, tappe, level cap, fonti e verifica, come in P1-06 e P1-07) e uno di integrazione (nomi, meccaniche, test). Proposta: crearli all'apertura del rilascio 0.5, non ora, per non appesantire il backlog dell'MVP. Va deciso se creare subito i PBI come segnaposto.

## 5. Stato del gate

| Criterio di P2-14 | Stato |
| --- | --- |
| Modello dati, API e schermate rivisti insieme | Fatto (sezione 1) |
| Modello dati, API e schermate approvati | **In attesa del product owner** |
| Ogni requisito collegato ad almeno un PBI delle fasi 3–7 | Fatto, con l'eccezione R-53 (sezione 2) |

I PBI di fase 2 in verifica: P2-03, P2-04, P2-07, P2-09, P2-12, P2-13.
