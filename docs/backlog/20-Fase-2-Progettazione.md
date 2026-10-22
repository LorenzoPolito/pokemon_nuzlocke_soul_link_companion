# Fase 2 – Progettazione

14 PBI. Il modello dati si divide per area funzionale, così le parti si progettano in parallelo e si uniscono nella revisione finale.

| ID | PBI | Dipende da | Taglia | Stato |
| --- | --- | --- | --- | --- |
| P2-01 | Modello dati: utenti, sessioni, ruoli globali | P1-13 | S | Completato |
| P2-02 | Modello dati: run, giocatori, regole | P1-01 | S | Completato |
| P2-03 | Modello dati: aree, incontri, link Soul Link | P2-02, P1-06 | M | In verifica |
| P2-04 | Modello dati: esemplari, stato, eventi | P2-03 | M | In verifica |
| P2-05 | Modello dati: override per specie per giocatore | P2-02 | S | Completato |
| P2-06 | Modello dati: medaglie e level cap | P2-02, P1-07 | XS | Completato |
| P2-07 | Schema del Pokédex SQLite | P1-15 | M | In verifica |
| P2-08 | Modello dei permessi | P2-01, P2-02 | S | Completato |
| P2-09 | Catalogo delle API | P2-03, P2-04, P2-05, P2-06, P2-08 | M | In verifica |
| P2-10 | Catalogo degli eventi SSE | P2-09 | S | Completato |
| P2-11 | Flussi: creazione run, inviti, run già iniziata | P2-02 | S | Completato |
| P2-12 | Bozze schermate: tracker | P2-11 | M | In verifica |
| P2-13 | Bozze schermate: lotte, calcolatore, Pokédex | P1-09 | M | Da iniziare |
| P2-14 | Revisione e approvazione (gate 2) | tutti i P2 | S | Da iniziare |

## P2-01 Modello dati: utenti, sessioni, ruoli globali

Output: [Modello dati](../progetto/06-Modello-dati-bozza.md#p2-01-utenti-sessioni-e-ruoli-globali).

- [x] Tabelle richieste da Better Auth riportate senza modifiche non necessarie.
- [x] Ruolo globale (admin, utente) e flag di cambio password obbligatorio definiti.
- [x] Impostazione della modalità di registrazione (aperta, su invito, chiusa) definita.

Nota di chiusura, 20 ottobre 2026: la disattivazione dell'utente usa le colonne di ban del plugin `admin`, al posto di `disabled_at`. Modalità di registrazione predefinita proposta: su invito (da confermare).

## P2-02 Modello dati: run, giocatori, regole

Output: [Modello dati](../progetto/06-Modello-dati-bozza.md#p2-02-run-giocatori-e-regole).

- [x] Una run ha un solo gioco, uguale per tutti gli N giocatori; impostazioni e regole valgono per tutti, salvo gli override per specie.
- [x] Regole opzionali e flag (randomizer, calcolatore) memorizzati per run.
- [x] Stato della run (in corso, persa, completata) definito.
- [x] Il gioco della run è una versione; le impostazioni comprendono la regola "stanze interne come aree separate" (accesa di base, non modificabile dopo il primo incontro) e, per Nero 2 e Bianco 2, la difficoltà ([ADR 0003](../adr/0003-giochi-aree-e-impostazioni-della-run.md)).

Nota di chiusura, 20 ottobre 2026: i valori predefiniti delle regole opzionali e il proprietario che non gioca sono proposte da confermare. Cambia l'invariante del gruppo collegato quando un giocatore viene rimosso (da trattare in P2-03).

## P2-03 Modello dati: aree, incontri, link Soul Link

Output: [Modello dati](../progetto/06-Modello-dati-bozza.md#p2-03-aree-incontri-e-link-soul-link).

- [x] Un incontro per area per giocatore, con esito (catturato, fallito, fuggito, saltato per dupe, regalo, precedente non tracciato).
- [x] Il link Soul Link unisce gli incontri della stessa area tra tutti i giocatori.
- [x] Aree personalizzate aggiunte dall'admin supportate.
- [x] Le stanze interne portano la chiave dell'area principale e, con la regola spenta, contano in quella; le grotte nascoste sono incontri speciali con la specie dal Pokédex ([ADR 0003](../adr/0003-giochi-aree-e-impostazioni-della-run.md)).

Nota, 20 ottobre 2026: l'esito `defeated` della bozza diventa `failed`; «regalo» è una provenienza (`special_key`), non un esito; nuovo stato di gruppo `untracked`. Due punti da confermare (vedi domande aperte del modello).

## P2-04 Modello dati: esemplari, stato, eventi

Output: [Modello dati](../progetto/06-Modello-dati-bozza.md#p2-04-esemplari-morte-ed-eventi).

- [x] Esemplare con soprannome, specie, varietà facoltativa, livello, natura, abilità, 4 mosse, posizione (team, box, morto) ([ADR 0006](../adr/0006-varieta-dell-esemplare.md)).
- [x] Causa della morte con avversario, mossa e area.
- [x] Eventi della timeline con tipo, data e riferimenti, scritti in sola aggiunta.

Nota, 20 ottobre 2026: il trigger di sola aggiunta del diario lascia passare la cascata dell'eliminazione della run (provato su SQLite 3.45; da riprovare su libSQL in P3-03).

## P2-05 Modello dati: override per specie per giocatore

Output: [Modello dati](../progetto/06-Modello-dati-bozza.md#p2-05-override-per-specie-per-giocatore).

- [x] Chiave univoca run + giocatore + specie.
- [x] Ogni campo sovrascrivibile (tipi, statistiche, abilità, mosse imparabili) memorizzato separatamente, così il ripristino è per singolo campo.

Nota di chiusura, 20 ottobre 2026: la chiave si estende con la varietà (proposta, da confermare); `base_stats` si salva completo; tornare all'originale = eliminare la riga.

## P2-06 Modello dati: medaglie e level cap

Output: [Modello dati](../progetto/06-Modello-dati-bozza.md#p2-06-tappe-medaglie-e-level-cap).

- [x] Tappe superate per giocatore (`run_milestone`, che sostituisce `run_badge`), con data: la medaglia è un attributo della tappa ([ADR 0003](../adr/0003-giochi-aree-e-impostazioni-della-run.md)).
- [x] Level cap calcolato per giocatore dai dati di gioco e dalla difficoltà della run; un solo override manuale per la run.

Nota di chiusura, 20 ottobre 2026: dove manca il livello della difficoltà scelta (Superquattro e Ghetsis in modalità facile) si usa il valore normale e l'interfaccia lo segnala.

## P2-07 Schema del Pokédex SQLite

Output: [Schema del Pokédex](../progetto/15-Schema-del-Pokedex.md).

- [x] Tabelle e indici per specie, forme, tipi, mosse, abilità, learnset, evoluzioni, incontri.
- [x] Nomi in più lingue con fallback all'inglese.
- [x] Dati per version group, così ogni run legge i dati del proprio gioco.
- [x] Parte dallo script di prova `tools/prove/build_pokedex.py` (tabelle, storico con `until_generation`, learnset per version group).

Nota, 20 ottobre 2026: lo schema è provato con lo script di prova esteso (41,9 MB, 117 127 incontri, 677 condizioni di evoluzione, 638 321 righe di learnset). Per le mosse la regola dei valori per gruppo di versioni tratta i campi nulli come «non cambiato», verificata su Colpo.

## P2-08 Modello dei permessi

Output: [Architettura e API](../progetto/16-Architettura-e-API.md#p2-08-modello-dei-permessi).

- [x] Matrice azioni × ruoli (admin, proprietario, giocatore, spettatore) completa.
- [x] Definito chi può modificare i dati di un altro giocatore della stessa run.

Nota di chiusura, 20 ottobre 2026: la regola sui dati di un altro giocatore (propri; proprietario tutto; azioni di gruppo per tutti i giocatori) e l'esclusione dell'admin dai dati delle run sono proposte da confermare.

## P2-09 Catalogo delle API

Output: [Architettura e API](../progetto/16-Architettura-e-API.md#p2-09-catalogo-delle-api).

- [x] Ogni endpoint con metodo, percorso, input, output, errori e permesso richiesto.
- [x] Le regole Soul Link sono applicate dal server, non solo dall'interfaccia.
- [x] Ogni scrittura porta una chiave di idempotenza generata dal client, valida 24 ore ([ADR 0002](../adr/0002-rete-instabile.md)).

Nota, 20 ottobre 2026: la sezione degli eventi SSE è in P2-10.

## P2-10 Catalogo degli eventi SSE

Output: [Architettura e API](../progetto/16-Architettura-e-API.md#p2-10-catalogo-degli-eventi-sse).

- [x] Ogni evento con nome, contenuto e destinatari.
- [x] Strategia di riallineamento dopo una riconnessione definita, insieme agli eventi di presa e rilascio dei lock.
- [x] Segnale ogni 15 secondi, avviso dopo 40 secondi senza eventi, recupero degli eventi dall'identificativo dell'ultimo ricevuto, lock ripresi alla riconnessione ([ADR 0002](../adr/0002-rete-instabile.md)).

Nota di chiusura, 20 ottobre 2026: il segnale è un evento con nome (`ping`) e non un commento SSE, perché `EventSource` non mostra i commenti e il client deve poter misurare i 40 secondi. Soglie proposte: 500 eventi di recupero, 5 connessioni per utente e run, coda di 200.

## P2-11 Flussi: creazione run, inviti, run già iniziata

Output: [Flussi e schermate](../progetto/17-Flussi-e-schermate.md#p2-11-flussi-creazione-run-inviti-run-già-iniziata).

- [x] Flusso di creazione per run nuova e per run già iniziata, passo per passo.
- [x] Flusso di invito e accettazione di un giocatore.

Nota di chiusura, 20 ottobre 2026: dal flusso è emersa una modifica al modello, i **posti in attesa** (`run_member.user_id` può essere NULL, `display_name`, `invite.member_id`); aggiunti `invite.decline` e l'evento `member.declined`. Elenco delle differenze tra mockup e decisioni nel documento, da chiudere in P2-12.

## P2-12 Bozze schermate: tracker

Output: [Flussi e schermate](../progetto/17-Flussi-e-schermate.md#p2-12-bozze-schermate-tracker).

- [x] Bozze per lista aree, dettaglio esemplare, team e box, cimitero, timeline.
- [x] Ogni bozza progettata prima per telefono.

Nota, 20 ottobre 2026: le bozze sono i mockup già esistenti (390 px; una sola versione tablet). Il lavoro è stato collegarli a dati, azioni ed eventi e fissare le differenze con le decisioni (tabella nel documento). P2-02 allineato al mockup delle impostazioni: dupes clause, regali e tipo primario bloccati dopo il primo incontro.

## P2-13 Bozze schermate: lotte, calcolatore, Pokédex

Output: Flussi e schermate.

- [ ] Bozze per helper delle lotte, calcolatore, lista e scheda del Pokédex.
- [ ] Verificato che l'helper non ordini né evidenzi una mossa migliore.

## P2-14 Revisione e approvazione (gate 2)

Output: Piano di progetto.

- [ ] Modello dati, API e schermate rivisti insieme e approvati.
- [ ] Ogni requisito della specifica collegato ad almeno un PBI delle fasi 3–7.
