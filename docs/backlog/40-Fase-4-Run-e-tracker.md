# Fase 4 – Run e tracker

21 PBI. Le regole del Soul Link (P4-06, P4-07, P4-11, P4-13) sono il cuore dell'app: vanno applicate dal server e coperte da test automatici.

| ID | PBI | Dipende da | Taglia | Stato |
| --- | --- | --- | --- | --- |
| P4-01 | Creazione di una run con regole | P3-07 | M | Da iniziare |
| P4-02 | Inviti e ruoli nella run | P4-01 | M | Da iniziare |
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

- [ ] Si scelgono nome, gioco e regole opzionali (dupes clause, tipo primario, regali separati, randomizer, calcolatore, stanze interne come aree separate, accesa di base); per Nero 2 e Bianco 2 anche la difficoltà, normale di default ([ADR 0003](../adr/0003-giochi-aree-e-impostazioni-della-run.md)).
- [ ] Le regole base e Soul Link sono sempre attive e non disattivabili.
- [ ] Chi crea la run ne diventa proprietario.
- [ ] Elenco «Le mie run» con filtri In corso / Finite / Tutte e riepilogo (medaglie del proprio giocatore, gruppi vivi e morti) ([flussi](../progetto/17-Flussi-e-schermate.md#p2-12-bozze-schermate-tracker)).


## P4-02 Inviti e ruoli nella run

- [ ] Il proprietario invita utenti come giocatori o spettatori.
- [ ] Lo spettatore vede tutto ma non modifica nulla, verificato lato server.
- [ ] Il proprietario può rimuovere un partecipante finché la run non ha incontri registrati.
- [ ] Posti in attesa: il proprietario riserva un posto con nome e invito; chi accetta lo occupa con i dati già inseriti; chi rifiuta lascia il posto in attesa ([modello](../progetto/06-Modello-dati-bozza.md#p2-11-posti-in-attesa)).


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
