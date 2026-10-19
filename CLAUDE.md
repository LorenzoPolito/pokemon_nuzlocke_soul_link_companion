# CLAUDE.md – Nuzlocke SoulLink Companion

## Il progetto

Web app self-hosted, in un unico container Docker, che accompagna le run Nuzlocke Soul Link di Pokémon: più run, N giocatori collegati per run, tracker di incontri, team, box, morti, medaglie e level cap, helper per le lotte che informa senza suggerire, Pokédex completo. L'MVP 0.1 copre Pokémon Bianco, Nero, Bianco 2 e Nero 2. Repository privato, app privata e non commerciale.

Ruoli: il product owner (PO) decide, verifica e unisce; l'agente sviluppa, documenta, apre PR e può approvarle, tramite l'app Claude per GitHub (che agisce con l'account del PO, `LorenzoPolito`). Con il PO si parla sempre in italiano.

## Mappa dei documenti

La documentazione in `docs/` è l'unica fonte valida (le copie su claude.ai non si aggiornano più).

| Cosa | Dove |
| --- | --- |
| Indice della documentazione | `docs/README.md` |
| Decisioni (ADR; indice e modello in `README.md`; le prime 26 nella 0001) | `docs/adr/` |
| Requisiti e stack | `docs/progetto/01-Specifica-dei-requisiti.md` |
| Fasi e gate | `docs/progetto/02-Piano-di-progetto.md` |
| MVP e rilasci | `docs/progetto/03-MVP-e-rilasci.md` |
| Regole di lavoro (sessioni, test, bug, stime) | `docs/progetto/04-Regole-di-lavoro.md` |
| Linee guida di sviluppo (moduli, codice, revisione) | `docs/progetto/05-Linee-guida-di-sviluppo.md` |
| Modello dati (bozza) | `docs/progetto/06-Modello-dati-bozza.md` |
| Rischi e fonti dei dati | `docs/progetto/07-Rischi-tecnici-e-fonti-dei-dati.md` |
| Configurazione di GitHub | `docs/progetto/08-Configurazione-di-GitHub.md` |
| Mappa degli artefatti (tutti gli output e quando si aggiornano) | `docs/progetto/09-Mappa-degli-artefatti.md` |
| Backlog: regole, Definition of Done, riepilogo | `docs/backlog/00-Backlog-regole-DoD-riepilogo.md` |
| PBI per fase, con stato | `docs/backlog/10-…70-Fase-*.md` |
| Registro bug | `docs/backlog/01-Bug.md` |
| Registro sessioni | `docs/backlog/02-Registro-sessioni.md` |
| Design system (token in `tokens.json`) | `docs/design-system/` |
| Mockup (sorgenti; si vedono nel canvas su claude.ai) | `docs/mockup/` |
| Regole Soullocke di riferimento | `docs/fonti/Regole-Soullocke.pdf` |
| Dati di gioco (aree, medaglie, level cap) | `data/games/*.json` |

I PDF in `docs/progetto/pdf/` sono copie storiche con i diagrammi: non si aggiornano.

## Regole sempre valide

- Git flow (decisione 22): mai push su `main` o `develop`, mai unire pull request, mai creare tag. Si apre una PR e unisce il PO: squash verso `develop`, merge commit da `develop` a `main`.
- Un branch e una PR per ogni PBI o bug, creato da `develop` e con PR verso `develop`: `pbi/P1-01-inventario-giochi`, `bug/BUG-007-morte-partner`, `chore/…` per il repository. Verso `main` solo la PR di rilascio da `develop`, aperta dall'agente.
- Il controllo `branch-policy` (GitHub Actions) deve essere verde; Actions si usa solo per quello, nei minuti gratuiti (decisione 23). Il branch predefinito di GitHub è `main`: apri sempre le PR con `base: develop`.
- Le protezioni sono hook (decisione 25): `.claude/hooks/guard.cjs` nega o chiede conferma per le azioni vietate o distruttive, `.githooks/` controlla commit, messaggi e push. Non aggirarli mai (niente `--no-verify`, niente cambio di `core.hooksPath`); se un hook ti blocca, chiedi al PO.
- Puoi approvare le tue PR con una revisione di tipo commento che comincia con "Approvata dall'agente", con checklist di revisione ed esito della verifica (decisione 24). L'approvazione formale di GitHub non è possibile.
- Commit in Conventional Commits con l'ID: `docs(P1-01): …`, `feat(P4-06): …`, `fix(BUG-004): …`.
- Rispetta il budget della taglia (tabella in `04-Regole-di-lavoro.md`). Oltre il 150%: fermati, registra lo stato e proponi di dividere il PBI.
- I PBI di analisi di taglia XS e S li chiude l'agente (Completato); tutti gli altri vanno a "In verifica".
- Informazione mancante o fonti in conflitto: non inventare. Annota la fonte, segnala il conflitto e, se blocca, chiedi al PO.
- Risorsa di rete necessaria ma irraggiungibile: dillo al PO invece di aggirare il problema.
- Prima di azioni distruttive (cancellare file, riscrivere la cronologia) chiedi.
- Le decisioni in `docs/adr/` non si rimettono in discussione senza chiedere al PO. Una decisione nuova è una ADR separata, in stato "Proposta" finché il PO non risponde.
- Nessun artefatto nasce senza una riga nella mappa degli artefatti.
- Nessun segreto nel repository: solo `.env.example`.

## Protocollo di sessione (in breve)

Apertura:

1. Leggi la mappa degli artefatti, il registro sessioni e il registro bug.
2. Se c'è un bug Bloccante aperto, la sessione lavora su quello.
3. Altrimenti scegli il prossimo PBI avviabile (sezione sotto), salvo priorità diversa del PO.
4. Porta il PBI a "In corso" nel file della sua fase e dichiara ID, taglia e budget.

Chiusura:

1. Spunta i criteri soddisfatti; porta il PBI a "In verifica" (o "Completato" se analisi XS/S), oppure lascialo "In corso" spiegando cosa manca.
2. Apri i bug trovati in `docs/backlog/01-Bug.md`.
3. Aggiorna i documenti di output del PBI e, se serve, la mappa degli artefatti.
4. Aggiungi una riga in cima al registro sessioni: data, PBI, esito, taglia, token e tempo reali (o "non misurato"), prossimo passo.
5. Resoconto al PO: PR aperte, criteri fatti e non fatti, consumi, bug e rischi, al massimo tre domande, prossimo passo.

## Come trovare il prossimo PBI avviabile

1. Apri i file di fase in `docs/backlog/` in ordine (10, 20, 30, …) e leggi la tabella in testa a ciascuno.
2. Un PBI è avviabile se è "Da iniziare" e tutte le voci di "Dipende da" sono completate. Poiché i PBI di sviluppo si verificano a gruppi a fine rilascio, per loro si considera completata una dipendenza "In verifica" con la PR unita su `develop` (confermato, ADR 0005).
3. Tra gli avviabili scegli per fase, poi per ordine della tabella (che riflette la priorità), salvo indicazione del PO; per l'MVP vale l'ordine di `03-MVP-e-rilasci.md`.
4. Non partono PBI di una fase che dipendono da un gate non ancora approvato (P1-18, P2-14).
5. Quando le dipendenze sono PR non ancora unite, parti dal branch della PR da cui dipendi e dichiaralo nella descrizione della nuova PR.

## Stack e comandi

Stack (decisioni 1–8): SvelteKit con adapter Node, TypeScript strict, un solo container Docker; Drizzle con libSQL su file locale in `/data` (Turso opzionale, stesso codice); migrazioni solo in avanti all'avvio; Better Auth con admin da `ADMIN_EMAIL` e `ADMIN_PASSWORD`; Paraglide (italiano e inglese); Pokédex SQLite in sola lettura generato in build da PokeAPI/api-data; @smogon/calc; SSE; solo HTTP.

Comandi (da completare in P3-01):

| Comando | Cosa fa |
| --- | --- |
| `git config core.hooksPath .githooks` | Attiva gli hook di git (lo fa da sé l'hook SessionStart di Claude Code) |
| `npm run verify` | Lint, tipi, test di unità e di sistema, build dell'immagine (da P3-11) |

Architettura, moduli e convenzioni di codice: `docs/progetto/05-Linee-guida-di-sviluppo.md`.

## Decisioni

Le decisioni prese sono in `docs/adr/` (ADR 0001: le prime 26; 0002–0005: rete instabile, giochi e impostazioni della run, fonti dei dati, processo). Una decisione nuova o cambiata è una ADR nuova, con la risposta del PO; le ADR accettate non si riscrivono, si sostituiscono.
