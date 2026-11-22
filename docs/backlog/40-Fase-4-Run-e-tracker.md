# Fase 4 – Run e tracker

21 PBI. Le regole del Soul Link (P4-06, P4-07, P4-11, P4-13) sono il cuore dell'app: vanno applicate dal server e coperte da test automatici.

| ID | PBI | Dipende da | Taglia | Stato |
| --- | --- | --- | --- | --- |
| P4-01 | Creazione di una run con regole | P3-07 | M | In verifica |
| P4-02 | Inviti e ruoli nella run | P4-01 | M | In verifica |
| P4-03 | Gioco unico della run | P4-01 | XS | Da iniziare |
| P4-04 | Lista delle aree in ordine di progressione | P4-01 | M | Da iniziare |
| P4-05 | Registrazione dell'incontro per area | P4-02, P4-03, P4-04 | M | Da iniziare |
| P4-06 | Collegamento Soul Link automatico | P4-05 | M | Da iniziare |
| P4-07 | Area saltata per tutti | P4-06 | S | Da iniziare |
| P4-08 | Dupes clause | P4-05 | S | Da iniziare |
| P4-09 | Regali come incontri separati | P4-05 | S | Da iniziare |
| P4-10 | Dettaglio dell'esemplare | P4-05 | M | Da iniziare |
| P4-11 | Team e box con posizione condivisa | P4-06 | M | Da iniziare |
| P4-12 | Restrizione del tipo primario | P4-11 | S | Da iniziare |
| P4-13 | Morte con causa e propagazione | P4-11 | M | Da iniziare |
| P4-14 | Fine della run | P4-13 | S | Da iniziare |
| P4-15 | Medaglie e level cap | P4-01 | S | Da iniziare |
| P4-16 | Timeline degli eventi | P4-05 | M | Da iniziare |
| P4-17 | Cimitero | P4-13 | XS | Da iniziare |
| P4-18 | Sync in tempo reale della run | P3-10, P4-05 | M | Da iniziare |
| P4-19 | Creazione di una run già iniziata | P4-11, P4-15 | M | Da iniziare |
| P4-20 | Flag randomizer | P4-04 | S | Da iniziare |
| P4-21 | Lock sul dato in modifica | P4-18 | M | Da iniziare |

## P4-01 Creazione di una run con regole

- [x] Si scelgono nome, gioco e regole opzionali (dupes clause, tipo primario, regali separati, randomizer, calcolatore, stanze interne come aree separate, accesa di base); per Nero 2 e Bianco 2 anche la difficoltà, normale di default ([ADR 0003](../adr/0003-giochi-aree-e-impostazioni-della-run.md)).
- [x] Le regole base e Soul Link sono sempre attive e non disattivabili.
- [x] Chi crea la run ne diventa proprietario.
- [x] Elenco «Le mie run» con filtri In corso / Finite / Tutte e riepilogo (medaglie del proprio giocatore, gruppi vivi e morti) ([flussi](../progetto/17-Flussi-e-schermate.md#p2-12-bozze-schermate-tracker)).

Nota, 22 ottobre 2026: modulo `games` (catalogo dei quattro giochi letto da `data/games/*.json`, incluso nella build) e modulo `runs`. Tabelle `run` e `run_member` (migrazione 0003) con tutte le colonne del modello dati, i vincoli (nome 1–60, stato, ruolo, level cap 1–100, un solo proprietario per run, un posto per giocatore) e gli indici; un test li prova. Regole in `domain/settings.ts` (Zod): predefiniti come in P2-02, ogni chiave sconosciuta rifiutata, quindi le regole base e Soul Link non si possono né inviare né spegnere; la difficoltà esiste solo per Nero 2 e Bianco 2 (normale di base) ed è un errore per gli altri. `createRun` salva run e proprietario (posto 1, giocatore) in una transazione e scrive `run.created` nel diario tramite l'hub; `createRunOnce` la rende idempotente per chiave. API: `GET /api/runs` (filtro `status`, `deleted`), `POST /api/runs` (richiede `Idempotency-Key`: 400, 201, risposta ripetuta con `Idempotent-Replay`, 422 con codice), `GET /api/runs/{id}` (404 per i non membri; per ora solo run e membri, il resto dell'istantanea arriva con il tracker). Pagine: «Le mie run» con filtri Tutte / In corso / Finite, «Nuova run» (bozza nel browser per 24 ore, chiave unica per apertura: il doppio invio crea una sola run) e un dettaglio minimo della run. 29 test e prova con Chromium a 360 px: creazione per Bianco 2 con difficoltà, bozza ripristinata dopo il ricaricamento, doppio clic = una run, elenco e filtri, API.
**Limiti dichiarati**: il riepilogo di ogni run (medaglie, vivi, morti) c'è nel formato ma resta a zero finché non esistono i gruppi e le tappe: lo riempiono P4-06 e P4-15 (criteri aggiunti lì). Il passo «giocatori e ruoli» della creazione (posti in attesa e inviti) è P4-02: per ora il creatore è l'unico giocatore. Il diario si scrive dopo la transazione e non dentro: se la scrittura fallisce la run esiste lo stesso senza la sua riga; la scrittura nella stessa transazione si fa con il diario (P4-16/P4-18).


## P4-02 Inviti e ruoli nella run

- [x] Il proprietario invita utenti come giocatori o spettatori.
- [x] Lo spettatore vede tutto ma non modifica nulla, verificato lato server.
- [x] Quando un account viene eliminato (anonimizzato dal pannello admin, P3-09), la proprietà delle sue run passa al giocatore con il posto successivo; le run restano.
- [x] Il proprietario può rimuovere un partecipante o trasformarlo in spettatore in qualsiasi momento; i suoi dati restano ([ADR 0009](../adr/0009-decisioni-della-fase-2.md)).
- [x] Posti in attesa: il proprietario riserva un posto con nome e invito; chi accetta lo occupa con i dati già inseriti; chi rifiuta lascia il posto in attesa ([modello](../progetto/06-Modello-dati-bozza.md#p2-11-posti-in-attesa)).
- [x] La politica di accesso del flusso di eventi legge `run_member` (oggi `noRunsYet` nega tutto) e un membro rimosso viene scollegato con `disconnectUser` ([hub](../progetto/16-Architettura-e-API.md#p2-10-catalogo-degli-eventi-sse)).

Nota, 22 ottobre 2026: tabella `run_member` con la nuova colonna `removed_at` (migrazione 0004): chi è rimosso o esce resta nella tabella (così i suoi incontri, esemplari e tappe mantengono l'autore, come chiede l'[ADR 0009](../adr/0009-decisioni-della-fase-2.md)) ma non vede più la run, non segue il flusso e non conta come giocatore; se viene invitato di nuovo torna sulla stessa riga. Inviti: `createRunInvite` (link aperto con usi e durata, oppure posto riservato con nome = posto in attesa), elenco senza token, revoca; la creazione della run accetta `seats` (posti in attesa con il loro invito) e `ownerPlays` (il proprietario può non giocare: posto senza numero). Accettazione in una transazione: l'uso si conta con un aggiornamento condizionale, quindi con un link a uso singolo vince il primo; occupa il posto riservato o crea un membro sul primo posto libero (lo spettatore non ne ha); rifiutare un posto riservato revoca l'invito e il posto resta in attesa, rifiutare un link aperto non lo tocca. Un invito a una run non si consuma più alla registrazione (prima la consumava e poi l'accettazione falliva): si consuma all'accettazione. Ruoli: cambio giocatore/spettatore e posto, rimozione, uscita, passaggio di proprietà, tutto del solo proprietario (l'uscita è di chiunque, ma il proprietario non può uscire né essere rimosso: `last_owner`). Eliminazione di un account (P3-09): le sue run passano al giocatore con il posto successivo (o al primo, se aveva l'ultimo), il vecchio proprietario diventa spettatore e smette di giocare in ogni run, il diario scrive `run.owner_changed`; se nessun altro può subentrare la run resta all'account anonimizzato. Flusso SSE: la politica di accesso ora legge `run_member` (non rimossi, run non cancellata) e un cambio di ruolo o una rimozione scollega la persona (`reset`, poi non può più riconnettersi se rimossa). API: `GET/POST /api/runs/{id}/invites`, `DELETE …/invites/{inviteId}`, `PATCH/DELETE …/members/{memberId}`, `POST …/transfer-ownership` (tutte con `Idempotency-Key`), `GET /api/invites/{token}` (pubblico: 404 uguale per ogni token che non funziona), `POST …/accept` e `…/decline`. Pagine: `/invite/{token}` (anteprima, accedi o registrati con ritorno all'invito tramite `?next=`, accetta, rifiuta), gestione dei membri e degli inviti nella pagina della run, passo «Altre persone» nella nuova run (link mostrati una volta). Bug trovato e corretto: due transazioni contemporanee sul file locale fallivano con `SQLITE_BUSY` (la seconda connessione di libSQL non ha il busy timeout): ora le transazioni dell'app si mettono in coda, con un test. 39 test nuovi (domini, casi d'uso, permessi, eliminazione di un account, accesso al flusso, corsa a uso singolo) e prova con Chromium a 390 px con quattro persone: registrazione dal link, accettazione, spettatore rifiutato (403) su inviti, ruoli, rimozione e passaggio di proprietà, flusso SSE chiuso alla rimozione (404 alla riconnessione).
**Limiti dichiarati**: il percorso è `/invite/{token}` (in inglese come le altre pagine) e non `/invito/{token}` come nei flussi. Il corpo della risposta di creazione della run con i token è salvato in `request_key` per 24 ore (serve alla ripetizione idempotente): chi legge il database avrebbe i link, ma lo stesso vale per i dati; se si preferisce, in seguito la risposta ripetuta può omettere i token. Le azioni dei moduli (pagina della run) non usano `Idempotency-Key`: un doppio invio crea due inviti, innocuo. Nessun limite di tentativi sulla pagina pubblica dell'invito: i token hanno 192 bit. Un rimosso che accetta un invito a un posto riservato prende quel posto e perde il legame con la sua vecchia riga (caso raro, da rivedere se emergono dati). L'anteprima mostra ai possessori del link nome della run, regole e partecipanti, come previsto dal flusso C.


## P4-03 Gioco unico della run

- [ ] Il gioco si sceglie alla creazione della run ed è lo stesso per tutti i giocatori; impostazioni e regole valgono per tutti.
- [ ] Il gioco non si può cambiare dopo il primo incontro registrato.
- [ ] Il gioco è una versione (Nero, Bianco, Nero 2, Bianco 2) ([ADR 0003](../adr/0003-giochi-aree-e-impostazioni-della-run.md)).

## P4-04 Lista delle aree in ordine di progressione

- [ ] Aree mostrate nell'ordine dei dati di gioco, con lo stato di ogni giocatore affiancato; l'ordine è solo di visualizzazione e ogni area si registra quando si vuole ([ADR 0003](../adr/0003-giochi-aree-e-impostazioni-della-run.md)).
- [ ] Con la regola "stanze interne come aree separate" spenta, gli incontri in una stanza contano nell'area principale.
- [ ] L'admin può aggiungere aree personalizzate a un gioco.
- [ ] Senza flag randomizer, ogni area mostra le specie incontrabili come suggerimento.

## P4-05 Registrazione dell'incontro per area

- [ ] Esiti possibili: catturato, fallito, fuggito, saltato per dupe, regalo.
- [ ] Un secondo incontro nella stessa area viene rifiutato, salvo dupes clause e regali.
- [ ] Una cattura senza soprannome viene rifiutata.

## P4-06 Collegamento Soul Link automatico

- [ ] Quando tutti i giocatori hanno catturato nella stessa area, gli esemplari risultano collegati.
- [ ] Il link è visibile da ognuno degli esemplari collegati.
- [ ] Il riepilogo di «Le mie run» conta i gruppi vivi e morti del proprio giocatore (oggi a zero, P4-01).

## P4-07 Area saltata per tutti

- [ ] Se un giocatore fallisce o perde l'incontro, l'area risulta saltata per tutti.
- [ ] Gli esemplari già catturati dagli altri in quell'area non sono utilizzabili, con il motivo mostrato.

## P4-08 Dupes clause

- [ ] Con la regola attiva, una specie della stessa linea evolutiva di un Pokémon già posseduto, anche morto, da un giocatore concede un nuovo tentativo solo a lui; gli incontri degli altri nell'area restano validi e il gruppo si collega con il suo nuovo incontro.
- [ ] Con la regola disattiva, il primo incontro conta comunque.

## P4-09 Regali come incontri separati

- [ ] Con la regola attiva, un regalo, un incontro fisso o uno scambio in gioco non consuma l'incontro dell'area; senza la regola conta come incontro dell'area in cui avviene.
- [ ] I regali seguono le stesse regole di link degli incontri.

## P4-10 Dettaglio dell'esemplare

- [ ] Modificabili: soprannome, livello, natura, abilità effettiva, 4 mosse.
- [ ] Abilità e mosse proposte dai dati effettivi (Pokédex o override), con scelta libera dall'elenco completo.
- [ ] Ciò che si sta scrivendo resta compilato se la rete cade o la pagina si chiude: bozza nel browser, per modulo, fino al salvataggio o per 24 ore ([ADR 0002](../adr/0002-rete-instabile.md)).

## P4-11 Team e box con posizione condivisa

- [ ] Spostare un esemplare in team o in box sposta allo stesso modo tutti i collegati.
- [ ] Il team non supera 6 esemplari per giocatore; uno spostamento che lo farebbe superare viene rifiutato.

## P4-12 Restrizione del tipo primario

- [ ] Con la regola attiva, non si può mettere in team un esemplare con un tipo primario già presente, per nessun giocatore.
- [ ] Il tipo primario usato è quello effettivo (override compresi).

## P4-13 Morte con causa e propagazione

- [ ] Segnare un esemplare come morto segna morti tutti i collegati.
- [ ] La causa (avversario, mossa, area) è facoltativa ma registrabile.
- [ ] Un esemplare morto non può tornare in team o in box.

## P4-14 Fine della run

- [ ] La run risulta persa quando un giocatore resta senza esemplari vivi o registra un wipe.
- [ ] Il proprietario può segnare la run come completata.
- [ ] Una run finita resta consultabile in sola lettura; una run eliminata resta recuperabile dal proprietario per 30 giorni, poi viene cancellata definitivamente.
- [ ] Riepilogo della run finita (durata in sessioni di eventi con pause fino a 3 ore, medaglie, aree, morti) e «Crea una nuova run con gli stessi giocatori» ([flussi](../progetto/17-Flussi-e-schermate.md#p2-12-bozze-schermate-tracker)).
- [ ] Job di eliminazione definitiva delle run cancellate da più di 30 giorni, all'avvio e una volta al giorno.


## P4-15 Medaglie e level cap

- [ ] Tappe del gioco (medaglie, Superquattro, boss della storia) selezionabili per ogni giocatore.
- [ ] Il riepilogo di «Le mie run» conta le medaglie del proprio giocatore (oggi a zero, P4-01).
- [ ] Level cap per giocatore, dalla prima tappa non superata e con la difficoltà della run; un solo override manuale per la run ([ADR 0003](../adr/0003-giochi-aree-e-impostazioni-della-run.md)).

## P4-16 Timeline degli eventi

- [ ] Ogni cattura, spostamento, morte e medaglia genera un evento con data e autore.
- [ ] Timeline filtrabile per giocatore e per tipo di evento.

## P4-17 Cimitero

- [ ] Elenco dei morti con soprannome, specie, area, causa e partner collegati.

## P4-18 Sync in tempo reale della run

- [ ] Ogni modifica compare agli altri partecipanti collegati entro 2 secondi, senza ricaricare.
- [ ] Dopo una riconnessione la pagina mostra lo stato aggiornato.
- [ ] Con la connessione persa compare un avviso e i pulsanti di salvataggio sono disattivati, senza coda ([ADR 0002](../adr/0002-rete-instabile.md)).
- [ ] Le modifiche semplici si vedono subito, con "in invio"; le azioni Soul Link attendono la risposta del server.
- [ ] `run_event` ha la chiave esterna verso `run` e i trigger che rifiutano `UPDATE` e `DELETE` mentre la run esiste (la tabella è creata da P3-10) ([modello](../progetto/06-Modello-dati-bozza.md#p2-04-esemplari-morte-ed-eventi)).
- [ ] L'interfaccia usa `connectStream` e mostra l'avviso dopo 40 secondi di silenzio.


## P4-19 Creazione di una run già iniziata

- [ ] In creazione si indicano medaglie ottenute e level cap attuale.
- [ ] Le aree visitate si registrano con esito o come "precedenti, non tracciate".
- [ ] Team, box e morti attuali si inseriscono con i link tra giocatori, rispettando le regole Soul Link.
- [ ] I dati mancanti si completano dopo la creazione.
- [ ] La creazione è una sola transazione (`POST /api/runs` con avanzamento) con controllo `group_inconsistent`; gli eventi di caricamento portano `imported` ([flussi](../progetto/17-Flussi-e-schermate.md#b-run-già-iniziata-4-passi-i-due-precedenti-più-due)).


## P4-20 Flag randomizer

- [ ] Con il flag attivo, le aree non mostrano specie suggerite e la specie si sceglie dall'intero Pokédex.
- [ ] Il flag non si può cambiare dopo il primo incontro registrato.

## P4-21 Lock sul dato in modifica

- [ ] Chi apre in modifica un incontro, un esemplare, le medaglie o le impostazioni prende un lock consultivo; gli altri vedono "in modifica da" e il nome e possono modificare solo dopo una conferma.
- [ ] Il lock è un lease di 60 secondi rinnovato ogni 20 secondi mentre il modulo è aperto; si rilascia al salvataggio, all'annullamento, alla chiusura della pagina o alla scadenza.
- [ ] Se due giocatori salvano lo stesso dato, vince l'ultimo salvataggio; chi è stato sovrascritto riceve un avviso con il valore nuovo.
- [ ] Presa e rilascio dei lock arrivano agli altri giocatori in tempo reale.
- [ ] Alla riconnessione il client riprende i lock dei moduli aperti ([ADR 0002](../adr/0002-rete-instabile.md)).

* [ ] Ogni dato modificabile ha un numero di versione; il valore sovrascritto resta nel diario della run.
* [ ] I lock vivono nella memoria del server e un riavvio li azzera senza errori.
- [ ] `locks.snapshot` dell'hub riporta i lock attivi, e presa, rinnovo e rilascio arrivano come `lock.*`.

