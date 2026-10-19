# Nuzlocke SoulLink Companion – Regole di lavoro

Oct 3, 2026 · @Lorenzo

Il progetto segue un agile DevOps semplificato: PBI piccoli, una sessione di lavoro per PBI, integrazione frequente su `develop` tramite pull request con verifica locale (senza CI), rilasci su `main` secondo git flow e tre livelli di test che aprono un bug quando trovano una regressione.

## Ruoli

Il product owner decide e approva; l'agente AI esegue e documenta.

| Ruolo | Chi | Responsabilità |
| --- | --- | --- |
| Product owner | Utente | Priorità del backlog, approvazione dei gate, verifica dei PBI "In verifica", gravità finale dei bug, modifiche a queste regole |
| Agente AI | Claude Code, che lavora sul repository tramite l'app Claude per GitHub ([decisione 14](../adr/0001-decisioni-di-progetto.md#14-agente-app-claude-per-github)) | Sviluppo dei PBI, test, apertura dei bug, aggiornamento di backlog, registro sessioni e documenti; apre pull request, ma non unisce e non crea tag |

L'agente porta un PBI a "In verifica" e il product owner lo chiude, con due eccezioni per alleggerire il lavoro: i PBI di analisi di taglia XS e S li chiude l'agente, e le verifiche dei PBI di sviluppo si fanno a gruppi alla fine di ogni rilascio.

## Flusso di lavoro

&#91;embedded content: ciclo di vita di un PBI · test e bug\]

Un PBI torna "In corso" quando la verifica locale è rossa o un criterio non è rispettato; un difetto trovato fuori dal PBI apre un bug, che segue lo stesso percorso.

## Protocollo di sessione

Ogni sessione di lavoro dell'agente riguarda un solo PBI o bug, e si apre e si chiude sempre allo stesso modo. Così lo stato del progetto vive nei file del repository e non nella memoria di una sessione.

Apertura:

1. Leggere la [Mappa degli artefatti](09-Mappa-degli-artefatti.md), il [Registro sessioni](../backlog/02-Registro-sessioni.md) e il [Registro bug](../backlog/01-Bug.md), tutti nel repository.
2. Se c'è un bug Bloccante aperto, la sessione lavora su quello.
3. Altrimenti scegliere un PBI avviabile (dipendenze completate), in ordine di fase e ID, salvo diversa priorità del product owner.
4. Portare il PBI a "In corso" nel file della sua fase in `docs/backlog/` e dichiarare ID, taglia e budget.

Chiusura:

1. Spuntare i criteri soddisfatti e portare il PBI a "In verifica", oppure lasciarlo "In corso" spiegando cosa manca.
2. Aprire i bug trovati durante la sessione.
3. Aggiornare i documenti di output del PBI.
4. Aggiungere una riga al [Registro sessioni](../backlog/02-Registro-sessioni.md): data, PBI o bug, esito, token e tempo stimati, token e tempo reali se noti, prossimo passo.

Una sessione che supera il 150% del budget si ferma, registra lo stato e propone di dividere il PBI.

## Repository e verifica locale

Il progetto segue git flow ([decisione 22](../adr/0001-decisioni-di-progetto.md#22-git-flow-main-e-develop)). `main` contiene solo i rilasci ed è sempre rilasciabile; `develop` è il ramo di integrazione. A entrambi si arriva solo con una pull request verde: verso `develop` da un branch di lavoro, verso `main` solo da `develop`.

- **Branch**: uno per PBI o bug, creato da `develop` aggiornato, con l'ID nel nome: `pbi/P4-06-link-soullink`, `bug/BUG-007-morte-partner`; `chore/…` per la manutenzione del repository. Non si usano branch `release/…` né `hotfix/…`.
- **Commit**: in formato Conventional Commits con l'ID, per esempio `feat(P4-06): collega gli incontri della stessa area`.
- **Pull request**: verso `develop`, con titolo con l'ID e descrizione con i criteri di accettazione spuntati e i test aggiunti. Il controllo `branch-policy` di GitHub Actions verifica il branch di partenza ([decisione 23](../adr/0001-decisioni-di-progetto.md#23-github-actions-solo-per-il-controllo-dei-branch-gratis)): una pull request con il controllo rosso non si unisce.
- **Verifica locale: npm run verify esegue lint, controllo dei tipi, test di unità, test di sistema e build dell'immagine. Un hook pre-push blocca il push se la verifica fallisce o se il ramo di destinazione è `main` o `develop`; l'esito va riportato nella pull request. Non c'è CI**.
- **Hook** ([decisione 25](../adr/0001-decisioni-di-progetto.md#25-protezioni-con-gli-hook-di-claude-code-e-di-git)): GitHub non può proteggere i rami di questo repository, quindi le regole le applicano gli hook di git (`pre-commit`, `commit-msg`, `pre-push`) e, per l'agente, gli hook di Claude Code. L'agente non li salta mai; il product owner può farlo con `--no-verify` quando serve.
- **Verifica su `develop`**: dopo ogni unione l'agente esegue in locale la verifica più i test end-to-end.
- **Approvazione**: l'agente può approvare le proprie pull request con una revisione di tipo commento che comincia con "Approvata dall'agente", con la checklist di revisione e l'esito della verifica ([decisione 24](../adr/0001-decisioni-di-progetto.md#24-lagente-può-approvare-le-proprie-pull-request)): GitHub non permette l'approvazione formale perché l'agente usa l'account del product owner.
- **PR impilate** ([ADR 0007](../adr/0007-pr-impilate-e-merge-commit.md)): l'agente può far partire una PR dal branch di un'altra non ancora unita; la serie si unisce in ordine con merge commit, non con squash (lo squash rigenera conflitti a ogni PR).
- **Unione**: squash merge verso `develop`, un commit per PBI; merge commit (non squash) per la pull request di rilascio da `develop` a `main`, così i due rami non divergono. Unisce solo il product owner; l'agente apre le pull request, anche quella di rilascio, e non fa mai push su `main` o `develop`.

## Test

Tre livelli automatici, più la verifica del product owner; ognuno ha un compito e un momento preciso.

| Livello | Cosa verifica | Strumento | Quando gira | Soglia |
| --- | --- | --- | --- | --- |
| Unità | Logica pura: regole Soul Link, motore dei tipi, dati effettivi e override, level cap | Vitest | A ogni commit in locale e prima di ogni push | Copertura ≥ 90% sui moduli delle regole |
| Sistema | App e database reale insieme: API, permessi, migrazioni, eventi SSE, su un database libSQL temporaneo | Vitest con server avviato | Prima di ogni push, con npm run verify | Ogni endpoint del catalogo API ha almeno un test |
| End-to-end | Percorsi completi nel browser con più giocatori, anche su schermo da telefono | Playwright | Su `develop` dopo ogni unione, prima di ogni gate e prima di ogni rilascio, in locale | Ogni caso del Piano di test ha uno scenario |
| Verifica | I criteri di accettazione del PBI, provati a mano | Product owner | Quando il PBI è "In verifica" | Tutti i criteri spuntati |

Quando un test fallisce:

- **Nella pull request del PBI in corso**: si corregge dentro lo stesso PBI. Non è un bug.
- **Su `develop` o `main`, oppure su una funzione di un PBI già completato**: è una regressione. Si apre un bug con il test fallito come passi per riprodurlo.
- **In verifica del product owner**: se il criterio non è rispettato, il PBI torna "In corso". Se emerge un difetto fuori dai criteri, si apre un bug.
- **Test instabile** (passa e fallisce senza modifiche): si apre un bug di gravità Media. Il test non si disattiva senza approvazione del product owner.

Ogni correzione di bug aggiunge un test che fallisce prima della correzione e passa dopo.

## Bug

Ogni difetto trovato fuori dal PBI in corso diventa un bug nel file [`docs/backlog/01-Bug.md`](../backlog/01-Bug.md), con ID `BUG-001`, `BUG-002` e così via.

Campi di ogni bug: titolo, data, trovato da (unità, sistema, end-to-end, verifica, uso), PBI collegato, gravità, passi per riprodurre, risultato atteso, risultato ottenuto, taglia, stato.

| Gravità | Significato | Regola |
| --- | --- | --- |
| Bloccante | Perdita di dati o regola Soul Link applicata in modo sbagliato | Si ferma il lavoro sui PBI finché non è risolto |
| Alta | Funzione principale inutilizzabile, senza alternativa | Prima del prossimo PBI della stessa fase |
| Media | Funzione utilizzabile con un'alternativa | Pianificato dal product owner |
| Bassa | Difetto estetico o di testo | Pianificato dal product owner |

Stati: Aperto → In corso → In verifica → Chiuso, oppure Rifiutato con motivo.

- L'agente propone la gravità; il product owner la conferma.
- Un bug è "In verifica" quando la correzione è su `develop` con il test di regressione verde.
- Bug Bloccanti e Alti si chiudono solo dopo la verifica del product owner; Medi e Bassi anche dall'agente.
- Un bug si stima con le stesse taglie dei PBI.

## Stime e budget

Ogni PBI e bug ha una taglia; budget di token e tempo dell'agente derivano dalla taglia, così una ricalibrazione cambia solo questa tabella.

| Taglia | Budget token | Tempo agente | Esempio |
| --- | --- | --- | --- |
| XS | fino a 50k | fino a 15 min | Un'impostazione, una verifica di licenze |
| S | 50k–150k | 15–45 min | Una regola isolata con i suoi test |
| M | 150k–400k | 45–120 min | Una schermata con API e test |
| L | oltre 400k | oltre 2 ore | Non ammessa: va divisa in PBI più piccoli |

I valori sono ipotesi iniziali. Il tempo è quello di lavoro dell'agente, senza le attese del product owner.

- **Consumo reale**: si registra nel Registro sessioni quando è disponibile (per esempio dal comando `/cost` di Claude Code o dalla console API); altrimenti si annota "non misurato".
- **Ricalibrazione**: a ogni gate si confrontano stime e consumi reali. Se almeno 3 PBI della stessa taglia superano il budget di oltre il 50%, si correggono i valori della tabella e si annota la modifica in fondo a questo documento. La prima ricalibrazione si fa dopo i primi 5 PBI completati, senza aspettare il gate.
- **Stima di un nuovo PBI o bug**: la propone l'agente all'apertura, la conferma il product owner.

## Documentazione, gate e rilasci

La [Mappa degli artefatti](09-Mappa-degli-artefatti.md) dice quale documento si aggiorna e quando; nessun artefatto nasce senza essere aggiunto alla mappa.

- **Gate**: alla fine di ogni fase il product owner verifica la checklist del gate nel Piano di progetto. Fino all'approvazione non partono PBI della fase successiva che dipendono dal gate.
- **Decisioni**: ogni scelta difficile da cambiare è una ADR in [`docs/adr/`](../adr/README.md), nella stessa pull request che la applica. L'agente la scrive in stato "Proposta" e la accetta solo con la risposta del product owner ([ADR 0005](../adr/0005-adr-e-scelte-di-processo.md)).
- **Versioni**: Semantic Versioning (`1.0.0`, `1.1.0`, `1.1.1`). Ogni rilascio ha un tag Git, un'immagine Docker con lo stesso tag e una voce nel `CHANGELOG.md`.
- **Rilascio**: nessun bug Bloccante o Alto aperto, test end-to-end verdi su `develop`, Guida di installazione aggiornata. L'agente apre la pull request da `develop` a `main`; il product owner la unisce con un merge commit e crea il tag su `main`.

## Modifiche alle regole

Le regole cambiano solo con l'approvazione del product owner; ogni modifica si annota qui con data e motivo.

| Data | Modifica | Motivo |
| --- | --- | --- |
| 3 ottobre 2026 | Prima versione | Avvio del progetto |
| 3 ottobre 2026 | Niente CI: verifica locale e hook pre-push. L'agente chiude i PBI di analisi XS e S; verifiche dei PBI di sviluppo a gruppi per rilascio; prima ricalibrazione dopo 5 PBI. | Assessment del progetto: repository privato senza CI e product owner troppo coinvolto |
| 19 ottobre 2026 | Backlog, bug e registro sessioni sono file in `docs/backlog/`, aggiornati con le pull request; l'agente lavora tramite l'app Claude per GitHub e non unisce. | Decisioni 13, 14 e 21 del [registro delle decisioni](../adr/0001-decisioni-di-progetto.md), applicate con la preparazione del repository (P3-12) |
| 19 ottobre 2026 | Git flow con `main` e `develop`; GitHub Actions solo per il controllo dei branch delle pull request; l'agente può approvare le proprie pull request (non unirle). | Richiesta del product owner; decisioni 22, 23 e 24 |
| 19 ottobre 2026 | Le decisioni sono ADR in `docs/adr/`; una dipendenza "In verifica" con la PR unita su `develop` conta come completata per i PBI di sviluppo. | Risposte del product owner a P1-19; [ADR 0005](../adr/0005-adr-e-scelte-di-processo.md) |
| 19 ottobre 2026 | Protezioni di `main` e `develop` affidate agli hook di Claude Code e di git; messaggi di commit controllati dall'hook `commit-msg`. | GitHub non applica le protezioni sui repository privati senza un account Team o Enterprise; decisione 25 |
