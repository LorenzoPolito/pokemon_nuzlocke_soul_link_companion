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
