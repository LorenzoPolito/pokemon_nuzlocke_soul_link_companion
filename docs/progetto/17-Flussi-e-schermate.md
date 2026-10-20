# Nuzlocke SoulLink Companion – Flussi e schermate

Documento di output di P2-11, P2-12 e P2-13: percorsi dell'utente e bozze delle schermate. Le schermate sono i 49 mockup in [`docs/mockup/`](../mockup/) (canvas su claude.ai; sorgenti `.dc.html`), disegnati prima per telefono. I flussi qui sono la fonte per la logica; i mockup sono la fonte per l'aspetto. Dove i due divergono, lo dice la sezione «Differenze tra mockup e decisioni».

## P2-11 Flussi: creazione run, inviti, run già iniziata

Data: 20 ottobre 2026. Taglia S. Schermate coinvolte: `NuovaRun`, `NuovaRunInviti`, `NuovaRunIniziata`, `NuovaRunIniziataTeam`, `Invito`, `Login`, `Registrazione`, `CambioPassword`.

### Principi dei flussi di creazione

- **Niente è salvato finché non si conferma.** I passaggi si compilano nel browser e la run nasce con **una sola richiesta** (`POST /api/runs`, [P2-09](16-Architettura-e-API.md#p2-09-catalogo-delle-api)) all'ultimo passo, in una transazione: o c'è tutto o non c'è nulla. La bozza compilata resta nel browser per 24 ore ([ADR 0002](../adr/0002-rete-instabile.md)); un doppio clic su «Crea run» non crea due run grazie alla chiave di idempotenza.
- **Il server ripete ogni controllo** dell'interfaccia con le stesse funzioni del dominio.
- Passi, indietro e avanti non perdono i dati; un passo non valido blocca «Avanti» e mostra il motivo vicino al campo.

### A. Run nuova (2 passi)

| Passo | Cosa si sceglie | Regole e controlli |
| --- | --- | --- |
| 1 · Gioco, regole e nome | **Nome** (1–60 caratteri); **gioco** tra Bianco, Nero, Bianco 2, Nero 2; per Bianco 2 e Nero 2 la **difficoltà** (`normal` di base); interruttori: dupes clause, regali/fissi/scambi separati, restrizione del tipo primario, randomizer, calcolatore, **stanze interne come aree separate** | Valori predefiniti di [P2-02](06-Modello-dati-bozza.md#impostazioni-della-run-runsettings). Il gioco, la difficoltà e le stanze interne si bloccano dopo il primo incontro: lo dice una riga sotto i campi. Cambiando gioco, la difficoltà compare o sparisce |
| 2 · Giocatori e ruoli | **Posti**: il proprietario è il primo; per ogni invitato un nome da mostrare, il ruolo (giocatore o spettatore) e il posto | Almeno un giocatore (il proprietario); nomi diversi tra loro; il proprietario può non giocare solo se indica un posto vuoto (vedi sotto). Ogni posto produce un **posto in attesa** e un invito ([P2-11](06-Modello-dati-bozza.md#p2-11-posti-in-attesa)) |
| Fine | «Crea run» | La run nasce `active`, con proprietario, posti in attesa, un invito per posto. Si apre la schermata della run e si offre di copiare i link degli inviti |

Gli inviti sono **link** con token; non si invita per email perché l'app non spedisce email: il proprietario copia il link e lo manda come vuole (messaggio, chat). Un posto resta «invito inviato» finché qualcuno non accetta.

### B. Run già iniziata (4 passi: i due precedenti più due)

Si sceglie «Run già iniziata» nel passo 1. Dopo i due passi comuni:

| Passo | Cosa si inserisce | Regole e controlli |
| --- | --- | --- |
| 3 · Dove siete arrivati | Per **ogni giocatore** (schede): le **tappe** già superate (medaglie e altre tappe del gioco, ad esempio 5 su 8 palestre) e le **aree già visitate**; il level cap attuale si mostra calcolato dalla prima tappa non superata. Un pulsante «Applica a tutti» copia le tappe del giocatore selezionato agli altri | Le tappe sono quelle del file di gioco, in ordine. Per ogni area visitata e per ogni giocatore l'esito è uno tra: **catturato e collegato** (richiede un esemplare al passo 4), **saltata** (incontro fallito o fuggito), **precedente non tracciata** (`untracked`) |
| 4 · Team, box e morti | Per ogni area con esiti «catturato e collegato», un **gruppo collegato**: per ogni giocatore un esemplare (soprannome, specie, livello, facoltativi natura, abilità, mosse) e una **posizione** unica per il gruppo: team, box o morto (con causa facoltativa) | Ogni gruppo ha un esemplare per giocatore attivo e una sola posizione; al massimo 6 in team per giocatore; con la restrizione del tipo, nessun tipo primario ripetuto; la dupes clause non si valuta sul passato; messaggio della schermata: «Ogni gruppo deve avere un Pokémon per giocatore e la stessa posizione» |
| Fine | «Crea run» | Vedi sotto |

Cosa produce la creazione di una run già iniziata, **nella stessa transazione**:

1. La run (`started_in_progress = 1`) e i membri.
2. Per ogni area visitata e ogni giocatore, un **incontro** con l'esito scelto: `caught` (con esemplare), `failed` (area saltata per tutti) o `untracked`. Aree in cui tutti sono `untracked` danno un gruppo `untracked`.
3. I **gruppi** calcolati con la funzione di ricalcolo di [P2-03](06-Modello-dati-bozza.md#p2-03-aree-incontri-e-link-soul-link) e, per i gruppi collegati, la posizione e, per i morti, `died_at` e `death_cause`.
4. Le **tappe** `run_milestone` di ogni giocatore, con data = momento della creazione.
5. Un evento `run.created` e gli eventi `encounter.recorded`, `group.*` e `milestone.reached` che rappresentano il caricamento, con `payload.imported = true` (il diario dice che sono dati inseriti alla creazione, non giocati).
6. Il **blocco** di `game_id`, `separateRooms` e `difficulty` parte dalla creazione ([P2-02](06-Modello-dati-bozza.md#una-run-un-gioco)).

Se i dati non sono coerenti (un gruppo senza un esemplare per giocatore, una posizione diversa tra partner, più di 6 in team) la richiesta è rifiutata con `group_inconsistent` e dettagli per gruppo; la bozza resta nel browser.

Il testo della schermata «Puoi completare i dati mancanti anche dopo la creazione» resta vero: le aree `untracked` si possono correggere in seguito con le normali operazioni di registrazione, e il proprietario può inserire i dati di chi non ha ancora accettato.

### C. Invito e accettazione

Un invito è un link `…/invito/<token>` ([P2-01](06-Modello-dati-bozza.md#app_setting-e-invite)).

```text
Apre il link
 ├─ token non valido / scaduto / revocato / esaurito → pagina «Invito non valido» (nessun dettaglio sul perché), con invito a chiedere un nuovo link
 └─ token valido → pagina «Invito a una run» (nome, gioco, ruolo offerto, regole, partecipanti)
      ├─ non autenticato → Accesso o Registrazione, poi torna alla pagina
      │     └─ registrazione: consentita se la modalità è aperta, o su invito (questo link vale come invito), non se chiusa
      ├─ già membro della run → «Fai già parte di questa run» e va alla run
      └─ autenticato → «Accetta e unisciti» o «Rifiuta»
           ├─ Accetta → diventa membro (occupa il posto in attesa, con i dati già inseriti) → apre la run
           └─ Rifiuta → l'invito è revocato; il posto resta in attesa; il proprietario lo vede nel diario
```

Dettagli:

- L'accettazione è una transazione: valorizza `run_member.user_id`, incrementa `invite.uses`, scrive `member.joined`. Se due persone aprono lo stesso link contemporaneamente (`max_uses` = 1) vince la prima, l'altra riceve `invite_invalid`.
- Un invito a **spettatore** non occupa un posto di gioco; un invito a una run senza posto riservato (link generico dal proprietario) crea un membro nuovo con il ruolo dell'invito e il primo posto libero.
- Chi accetta in una run già in corso trova i gruppi esistenti: per un posto creato alla nascita della run ci sono già i suoi dati; per un membro nuovo, i gruppi terminali ricevono incontri `untracked` per lui ([P2-03](06-Modello-dati-bozza.md#stato-del-gruppo)).
- Un utente con cambio password obbligatorio o disattivato non può accettare.
- Il proprietario vede gli inviti pendenti (con stato) e può revocarli o crearne di nuovi; un token in chiaro non si mostra due volte.

### D. Inviti e account senza run

Chi apre un invito all'app (creato dall'admin) arriva a una pagina di registrazione prestabilita; dopo la registrazione va alla pagina «Le mie run» vuota. Chi apre un invito a una run ma ha già un account entra con il normale accesso.

### Il proprietario che non gioca

Ammesso ([P2-02](06-Modello-dati-bozza.md#giocatori-e-ruoli-nella-run)): nel passo 2 il proprietario può togliere la spunta «Gioco anch'io»; allora ha un posto senza numero e partecipa come proprietario-spettatore con i diritti di gestione. Il flusso B, per un proprietario che non gioca, non gli chiede esemplari.

### Differenze tra mockup e decisioni

I mockup sono stati disegnati il 3 ottobre 2026, prima delle decisioni di P1-19. Da aggiornare in P2-12:

| Schermata | Differenza |
| --- | --- |
| `NuovaRun` | Mancano «Stanze interne come aree separate» e, per Bianco 2 e Nero 2, la difficoltà; il campo «Invita» sta nel passo 1 mentre il flusso lo mette nel passo 2 |
| `NuovaRunInviti` | Il campo «Email o nome utente» diventa un nome da mostrare: gli inviti sono link, non email |
| `NuovaRunIniziata` | Le medaglie sono uguali per tutti: devono essere per giocatore, con «Applica a tutti»; la tappa può non essere una medaglia (Superquattro, boss della storia) |
| `NuovaRunIniziataTeam` | Aggiungere «Morti» con causa facoltativa e il controllo del limite di 6 e del tipo primario |
| `Invito` | Mostrare anche difficoltà e stanze interne tra le regole |

### Domande aperte

Nessuna bloccante. Il proprietario che non gioca resta una proposta di P2-02.

## P2-12 Bozze schermate: tracker

Data: 20 ottobre 2026. Taglia M. Le bozze sono i mockup della pagina «Run e tracker» (16 schermate) più quelle di creazione e account già descritte in P2-11. Qui si collega ogni schermata ai dati, alle azioni e agli eventi, e si dichiara cosa manca o cambia.

### Regole comuni a tutte le schermate della run

- **Telefono prima.** Tutte le bozze sono a 390 × 844 px; esiste una sola versione tablet (1024 px, `Tablet`) che affianca elenco e dettaglio. Il tablet non cambia le funzioni.
- **Navigazione.** Barra in basso: Run · Pokédex · Profilo. Dentro una run, schede in alto: Aree · Team · Lotta · Cimitero · Diario. Intestazione: nome della run, gioco e giocatori, level cap.
- **Level cap in intestazione.** Con i level cap per giocatore ([P2-06](06-Modello-dati-bozza.md#p2-06-tappe-medaglie-e-level-cap)) l'intestazione mostra quello del **giocatore che guarda**; per il proprietario che non gioca o per uno spettatore mostra il più basso tra i giocatori, con l'etichetta «più basso». La schermata Medaglie mostra tutti.
- **Dati dal server e in tempo reale.** Ogni schermata parte dall'istantanea (`GET /api/runs/{id}`) e si aggiorna con gli eventi SSE ([P2-10](16-Architettura-e-API.md#p2-10-catalogo-degli-eventi-sse)): non fa ricariche.
- **Lock.** Aprire un modulo di modifica prende il lock del dato; gli altri vedono «In modifica da …» sul dato e una conferma prima di modificare comunque. Se si salva sopra una modifica altrui compare la schermata di conflitto.
- **Senza rete.** Pulsanti di salvataggio disattivati, avviso dopo 40 secondi, bozze conservate nel browser ([ADR 0002](../adr/0002-rete-instabile.md)).
- **Azioni Soul Link non ottimistiche.** Registrazione con collegamento, spostamento, morte, area saltata: la schermata attende la risposta del server e mostra «in invio». Le altre modifiche semplici (soprannome, livello, mosse) si vedono subito e si annullano con un messaggio se il server le rifiuta.
- **Errori di regola.** Il server risponde con un codice ([P2-09](16-Architettura-e-API.md#codici-di-errore)); l'interfaccia mostra la frase della schermata `Errore` (per esempio `team_full` → «Il team ha già 6 Pokémon», `type_clause_violation` → «Marco ha già un Coleottero come tipo primario»).
- **Spettatore.** Stesse schermate, senza pulsanti di modifica; banner «Sei spettatore: puoi guardare tutto, ma non modificare».
- **Run finita.** Sola lettura con banner e riepilogo; tutte le azioni di scrittura sono nascoste.
- **Stato vuoto.** `Vuota`: elenco di run senza elementi, e inviti a creare la prima.
- **Tema scuro.** `ScuroAree`; tutte le schermate usano i token del design system.

### Schermate, dati, azioni ed eventi

| Schermata (mockup) | Dati | Azioni (permesso) | Eventi che la aggiornano | Stati particolari |
| --- | --- | --- | --- | --- |
| **Le mie run** (`Main`) | `GET /api/runs`: nome, gioco e generazione, giocatori, stato, ruolo, riepilogo (medaglie, vivi, morti), etichetta Randomizer | Aprire; «Nuova run» (`run.create`); filtri In corso / Finite / Tutte | `run.*` per le run aperte | Vuoto; run persa con motivo («wipe a …») |
| **Aree** (`RunAree`, `AreeTre`) | Aree del gioco in ordine unite ai gruppi (`GET /api/runs/{id}/areas`): per area e giocatore l'esito, la specie e il soprannome; filtri Tutte / Da registrare / Catturate / Saltate; riga «Area saltata per tutti» con il motivo | «Registra incontro» (`encounter.create`, sui propri dati; il proprietario per tutti) | `encounter.*`, `group.*`, `lock.*`, `conflict.overwritten` | Aree con stanze interne figlie sotto la grotta se `separateRooms`; area personalizzata marcata; lock «In modifica da Luca»; gruppi `untracked` con l'etichetta «precedente, non tracciata» |
| **Registra incontro** (`RegistraIncontro`, `RegistraRandomizer`) | Specie incontrabili nell'area per il gioco (da `encounter` del Pokédex), o l'intero Pokédex con il randomizer; specie già possedute per la dupes clause | Salvare (`encounter.create`); con dupes clause il modulo propone «Specie già posseduta: nuovo tentativo» | Idem | Esiti del modulo: **Catturato**, **Fuggito**, **Non catturato**, e tipo di incontro **Selvatico / Regalo / Incontro fisso / Scambio** (vedi differenze); soprannome obbligatorio per «Catturato» |
| **Team** (`RunTeam`, `TeamTre`) | Gruppi `linked` con posizione `team`, per giocatore, con partner affiancati | Spostare in box (`group.move`); «Segna morto» (`group.die`) | `group.moved`, `group.died` | Messaggio fisso: «Spostare o segnare come morto un Pokémon applica la stessa azione al suo partner»; lock di gruppo se un partner è in modifica |
| **Box** (`Box`) | Gruppi in box | Mettere in team (`group.move`) con controllo di 6 e del tipo | Idem | Errore `type_clause_violation` mostrato sul gruppo |
| **Conferma morte** (`ConfermaMorte`) | Gruppo e partner da segnare | Conferma con avversario e mossa facoltativi, area (`group.die`); «L'azione non si può annullare» | `group.died`; eventualmente `run.status_changed` (wipe) | Dopo la conferma, se un giocatore resta senza vivi la schermata passa a Run finita |
| **Dettaglio esemplare** (`Esemplare`) | Esemplare, partner collegati, mosse con potenza/PP/categoria dei dati effettivi (override compresi), abilità possibili | Modificare livello, natura, abilità, mosse, soprannome (`specimen.update`, propri); evoluzione; «Sposta in box» / «Segna morto» | `specimen.*`, `group.*` | Dati sovrascritti marcati; abilità da elenco possibile o completo |
| **Cimitero** (`Cimitero`) | Gruppi `dead` con causa (avversario, mossa, area), filtro per giocatore | Correggere la causa (`group.die`) | `group.died`, `group.death_corrected` | «morto con il gruppo» per i partner; vuoto se non ci sono morti |
| **Diario** (`Diario`) | `GET /api/runs/{id}/events` con filtri Tutti / Catture / Morti / Medaglie; attore e orario | Nessuna (sola lettura) | Tutti i persistenti, in testa | Messaggio fisso «Il diario si scrive da solo e non si modifica: una correzione aggiunge un nuovo evento»; paginazione con `after` |
| **Medaglie e level cap** (`Medaglie`) | Tappe del gioco per giocatore, tappa successiva, level cap calcolato (valore normale con etichetta se manca), override della run | Segnare o togliere una tappa (`milestone.set`, proprie); override del level cap (proprietario, `run.update`) | `milestone.*`, `levelcap.override_set` | Banner «Modificare il level cap vale per tutti i giocatori» |
| **Impostazioni della run** (`ImpostazioniRun`) | Nome, gioco, regole, partecipanti con ruolo | Rinominare, cambiare calcolatore e randomizer, ruoli, rimuovere, invitare, segnare completata, eliminare (`run.*`, proprietario) | `run.settings_changed`, `member.*` | Regole bloccate con «Bloccata: la run è iniziata» (vedi P2-02) |
| **Run finita** (`FineRun`) | Motivo (wipe o dichiarata), riepilogo: durata, medaglie, aree, morti | «Apri il cimitero»; «Crea una nuova run con gli stessi giocatori» (apre il flusso A con i posti precompilati); riapertura (proprietario) | `run.status_changed` | Sola lettura |
| **Run vista da spettatore** (`Spettatore`) | Come le schermate normali | Nessuna | Idem | Banner; nessun pulsante di modifica |
| **Conflitto di modifica** (`Conflitto`) | `conflict.overwritten`: chi, cosa, valore nuovo | «Vedi» apre il dato aggiornato | `conflict.overwritten` | Compare come avviso sopra la schermata corrente, non la sostituisce |
| **Errore di regola e connessione persa** (`Errore`) | Codice di errore del server o stato della connessione | Riprova, annulla | Perdita di `ping` per 40 secondi | Avviso discreto che sparisce al riallineamento |

### Differenze tra mockup e decisioni (da chiudere nei mockup)

| Schermata | Differenza | Cosa cambia |
| --- | --- | --- |
| `RegistraIncontro` | Gli esiti sono «Catturato, Fuggito, Sconfitto, Regalo»; il modello ha `caught`, `failed`, `fled`, `dupe`, `untracked` e il regalo è una provenienza | Esiti: Catturato · Fuggito · Non catturato («Sconfitto» diventa «Non catturato»); campo «Tipo di incontro» (Selvatico, Regalo, Incontro fisso, Scambio) per i casi con `special_key`. «Dupe» è un esito proposto dal sistema, non scelto a mano |
| `ImpostazioniRun` | Mostra il gioco bloccato e dupes clause, regali e tipo bloccati: coerente con P2-02 aggiornato. Mancano stanze interne e difficoltà (entrambe bloccate) | Aggiungere le due righe |
| `Medaglie` | Il testo «[capopalestra dai dati di gioco]» è un segnaposto; la tappa successiva può non essere una palestra | Mostrare il nome della tappa dai dati di gioco; icona di medaglia solo se la tappa ne ha una |
| `FineRun` | «12 sessioni» non esiste nel modello | Sessione = gruppo di eventi senza pause oltre 3 ore, calcolata alla lettura sul diario; proposta |
| `Main` | «2 medaglie · 9 vivi · 3 morti» non dice a chi si riferiscono | Medaglie del proprio giocatore; vivi e morti = gruppi collegati vivi e morti |
| `RunAree` | Il banner «Area saltata per tutti» non mostra i casi `untracked` | Aggiungere lo stato «precedente, non tracciata» |
| Intestazioni | «Level cap 13 · Cheren» è unico | Quello del giocatore che guarda (vedi sopra) |

### Domande aperte

- Definizione di «sessione» (3 ore) nella schermata Run finita.
- Etichetta «più basso» del level cap per chi non gioca.

## P2-13 Bozze schermate: lotte, calcolatore, Pokédex

Data: 20 ottobre 2026. Taglia M. Mockup delle pagine «Lotte» (6), «Override e randomizer» (5) e «Pokédex» (6). Nelle versioni: helper e override sono del rilascio 0.3, calcolatore e Pokédex completo della 0.4 ([MVP e rilasci](03-MVP-e-rilasci.md)); nell'MVP c'è soltanto la lista delle specie della quinta generazione necessaria a registrare gli incontri.

### Principio di neutralità dell'helper

L'helper **informa e non consiglia**: nessuna mossa è indicata come migliore o preferibile, né dall'ordine né dalla grafica ([specifica](01-Specifica-dei-requisiti.md#helper-per-le-lotte)). Come regole di progetto:

1. L'elenco delle mosse del giocatore ha un **ordine fisso** (l'ordine delle mosse dell'esemplare), che non dipende dal risultato.
2. Nessuna etichetta, icona, dimensione, grassetto o posizione speciale per una mossa «migliore»; nessun «consigliata», «ottima», stelle.
3. Il calcolatore mostra **numeri per una mossa alla volta**: non confronta più mosse e non ordina i risultati.
4. L'helper non propone mai squadre avversarie del gioco: l'avversario si sceglie dal Pokédex o dalle squadre salvate dai giocatori.

### Verifica sul mockup (criterio di P2-13)

Verificato leggendo i sorgenti di `Lotta` e `Calcolatore`:

| Controllo | Esito |
| --- | --- |
| Ordine delle mosse nell'elenco «Le tue mosse su Onix» | Azione (×½), Ricciolo (—), Sassata (×½), Magnitudo (×2): l'ordine è quello dell'esemplare, non per efficacia. **Conforme** |
| Evidenziazione di una mossa | Nessuna mossa ha etichette «migliore» o sfondo diverso; l'unica etichetta è **STAB**, che è un'informazione sul tipo, uguale per ogni mossa dello stesso tipo del Pokémon. **Conforme** |
| Calcolatore | Il testo dice «mostra solo numeri: non confronta le mosse e non ne consiglia una»; un solo risultato per volta. **Conforme** |
| Colore del moltiplicatore | Ogni valore ha un colore proprio (×½ blu, ×2 arancione, ×4 arancione scuro, ×0 grigio). Non è un'evidenziazione di una singola mossa, ma il colore rende i ×2 più vistosi dei ×½: **da decidere** se mantenerlo o usare un solo stile neutro (proposta: mantenere il colore, che è un'informazione standard del gioco, e non usarlo mai per ordinare o per selezionare) |
| Elenco «Onix riceve» (difese dell'avversario) | L'elenco dei tipi è **ordinato per moltiplicatore** (×4, ×2, ×½, ×¼, ×0). Non sono mosse del giocatore, ma l'ordine mette in testa i tipi più forti: **da decidere** (proposta: ordine fisso dei tipi del gioco, con il moltiplicatore accanto) |

In sintesi: il criterio è verificato per le mosse e per il calcolatore; due scelte di presentazione restano al product owner.

### Schermate, dati, azioni ed eventi

| Schermata (mockup) | Dati | Azioni | Note |
| --- | --- | --- | --- |
| **Aiuto per la lotta** (`Lotta`) | Esemplare scelto (dal team del giocatore), avversario (specie e livello), tabella dei tipi dell'epoca del gioco, dati **effettivi** con gli override del giocatore; per ogni mossa tipo, categoria, potenza, STAB e moltiplicatore; tipi che l'avversario riceve; mosse viste dell'avversario; moltiplicatori delle mosse viste sul proprio team | Scegliere avversario e livello; aggiungere una mossa vista | I moltiplicatori includono le abilità che cambiano l'efficacia ([P1-09](13-Meccaniche-per-generazione.md)) quando l'avversario ne ha una nota; nelle generazioni 1–3 la categoria viene dal tipo |
| **Scelta dell'avversario** (`SceltaAvversario`) | Ricerca nel Pokédex del gioco della run; «Squadre già incontrate in questa run» | Scegliere una specie e un livello, oppure una squadra salvata | Avviso: le squadre salvate sono dei giocatori, non dati del gioco |
| **Mossa osservata** (`MossaOsservata`) | Ricerca mosse del Pokédex | Salvare la mossa per l'avversario (specie e livello) | Si salva su `seen_pokemon` (rilascio 0.3) |
| **Squadre incontrate** (`SquadreIncontrate`) | Allenatori salvati (nome, area, giocatore, data), specie, livello e mosse viste | Aprire, rimuovere una voce | Solo ciò che i giocatori hanno visto: nessuna squadra proposta |
| **Calcolatore danni** (`Calcolatore`) | Attaccante, mossa, modificatori, difensore; risultato `min–max` PS e percentuale della salute | Cambiare i campi; nessun confronto fra mosse | Meccaniche della generazione del gioco (es. «Gen 4»); i valori individuali sono sconosciuti: si assumono IV 31 ed EV 0, dichiarati sulla schermata. Visibile solo con `damageCalculator` acceso |
| **Lotta Gen 9** (`LottaGen9`) | Come `Lotta`, con Teracristallizzazione (tipo Tera per te e per l'avversario) e abilità | Scegliere il tipo Tera | Solo giochi di nona generazione (1.0). Tipo Astrale: [conflitto di fonti aperto](13-Meccaniche-per-generazione.md#teracristallizzazione-nona-generazione) |
| **Pokédex: lista e ricerca** (`PokedexLista`) | `GET /api/pokedex/species` con filtri di generazione, tipo e gioco | Cercare, aprire una scheda | Nell'MVP: solo la quinta generazione |
| **Scheda del Pokémon** (`Pokedex`, schede Info / Mosse / Incontri / Evoluzioni) | Specie e varietà, tipi, statistiche base, abilità, learnset del gioco, incontri del gioco, catena evolutiva ([schema](15-Schema-del-Pokedex.md)); in una run i **dati effettivi**, marcati «Modificato in questa run» con «Ripristina» | Cambiare gioco (fuori da una run), aprire un override | Per alcuni giochi gli incontri sono incompleti: lo si dice, non si mostra un elenco vuoto ([P1-04](10-Analisi-delle-fonti-dati.md)) |
| **Scheda mossa** e **scheda abilità** (`Mossa`, `Abilita`) | Tipo, categoria, potenza, precisione, PP del gruppo di versioni del gioco; sezione «Cambi tra generazioni»; specie che la imparano | | La descrizione da dati di gioco **non è nel Pokédex SQLite** (flavor text escluso): il segnaposto va tolto o si include il testo (decisione sotto) |
| **Override: lista** (`OverrideLista`) | Specie modificate dal giocatore, con i campi modificati | Aprire, copiare tutto a un altro giocatore (`override.copy`) | Messaggio: valgono solo per quel giocatore in quella run |
| **Override: modifica specie** (`OverrideEditor`) | Tipi, statistiche base, abilità possibili, mosse imparabili: valore del Pokédex e valore modificato | Salvare un campo alla volta (`override.set`), ripristinare un campo o tutto | Un campo = una riga; «Ripristina tutto» elimina le righe della specie |
| **Override: copia** (`OverrideCopia`) | Da e a quale giocatore; avviso se il destinatario ha già modifiche sulla stessa specie | Copiare «Solo questa specie» o «Tutte le specie» (`override.copy`) | Le righe del destinatario sullo stesso campo vengono sostituite, con conferma |
| **Registra incontro con randomizer** (`RegistraRandomizer`) | Specie dall'intero Pokédex; specie già possedute per la dupes clause | Come `RegistraIncontro` | Nessun suggerimento di specie |

### Dove si calcola

Proposta: **sul server**, nel modulo `battle`. Il client invia avversario (specie, varietà, livello, tipo Tera, abilità nota), esemplare e mossa; il server usa la funzione dei dati effettivi ([P2-05](06-Modello-dati-bozza.md#p2-05-override-per-specie-per-giocatore)), la tabella dei tipi dell'epoca e `@smogon/calc` ([P1-11](14-Prove-di-fattibilita.md#p1-11-prova-smogoncalc-con-override)) e risponde. Vantaggi: un solo posto con gli override giusti e nessuno scarico di 117 KB (gzip) nel browser. Costo: una richiesta per ogni calcolo, con rete assente non si calcola (coerente con «senza rete non si modifica»). Endpoint da aggiungere al catalogo prima del rilascio 0.3: `POST /api/runs/{id}/battle/matchup` e `POST /api/runs/{id}/battle/damage`, oltre a `seen_trainer` e `seen_pokemon` (elenco, aggiunta, rimozione).

### Differenze tra mockup e decisioni

| Schermata | Differenza |
| --- | --- |
| `Mossa`, `Abilita` | Descrizione «[descrizione dai dati di gioco]»: il Pokédex SQLite non include testi descrittivi. Proposta: nell'MVP e nella 0.4 non si mostrano; si aggiungono se il product owner li vuole (richiede flavor text nello schema) |
| `Lotta` | Colore dei moltiplicatori e ordine di «Onix riceve» (vedi neutralità) |
| `Calcolatore` | Dichiarare IV/EV assunti e la possibilità di impostarli |
| `Pokedex` | «Tipo modificato in questa run» deve valere anche per statistiche, abilità e mosse |

### Domande aperte

- Colore dei moltiplicatori e ordine dell'elenco «Onix riceve» (neutralità).
- Descrizioni di mosse e abilità: sì o no.
- Dove gira il calcolo: server (proposta) o browser.
