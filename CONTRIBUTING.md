# Come contribuire

Sintesi delle [Regole di lavoro](docs/progetto/04-Regole-di-lavoro.md) e della [Configurazione di GitHub](docs/progetto/08-Configurazione-di-GitHub.md). In caso di dubbio valgono i documenti completi.

## Ruoli

- **Product owner**: decide le priorità, approva i gate, verifica i PBI "In verifica" e unisce le pull request. È l'unico che unisce e che crea tag.
- **Agente** (Claude Code, tramite l'app Claude per GitHub): sviluppa i PBI, scrive i test, apre i bug, aggiorna backlog, registro sessioni e documenti; apre pull request e può approvarle, non unisce.

## Prima di iniziare

Solo se lavori in un clone locale (le sessioni di Claude Code lo fanno da sé):

```sh
git config core.hooksPath .githooks
```

Gli hook di `.githooks/` applicano le regole che GitHub non può imporre su questo repository ([decisione 25](docs/adr/0001-decisioni-di-progetto.md#25-protezioni-con-gli-hook-di-claude-code-e-di-git)):

- `pre-commit`: niente commit su `main` e `develop`, niente `.env` o file di database;
- `commit-msg`: messaggi in Conventional Commits con l'ID (sotto);
- `pre-push`: niente push su `main` e `develop`, niente push forzati; dal PBI P3-11 esegue anche `npm run verify`.

L'agente ha in più gli hook di Claude Code (`.claude/`), che gli vietano anche di unire pull request e creare tag.

## Branch (git flow)

- `main`: solo rilasci. Ci si arriva con la pull request di rilascio da `develop`.
- `develop`: integrazione. Ci si arriva con una pull request da un branch di lavoro.
- Branch di lavoro, creati da `develop` aggiornato, con l'ID nel nome:
  - `pbi/P4-06-link-soullink`
  - `bug/BUG-007-morte-partner`
  - `chore/…` per la manutenzione del repository

Niente `release/…` né `hotfix/…`. Mai push diretti o forzati su `main` e `develop`. Il controllo `branch-policy` di GitHub Actions segna in rosso le pull request che non rispettano queste regole, e una pull request rossa non si unisce.

## Commit

[Conventional Commits](https://www.conventionalcommits.org/) con l'ID del PBI o del bug come ambito:

- `feat(P4-06): collega gli incontri della stessa area`
- `fix(BUG-004): …`, `test(P4-06): …`, `docs(P1-01): …`, `chore(P3-12): …`

Un commit per passo logico; ogni commit compila e passa i test.

## Pull request

- Verso `develop`, titolo con l'ID: `P3-01 Scheletro del progetto SvelteKit`. Il branch predefinito di GitHub è `main`: scegli `develop` come destinazione a mano.
- Descrizione secondo il [modello](.github/pull_request_template.md): criteri di accettazione spuntati, test aggiunti, esito di `npm run verify`.
- L'agente può approvare le proprie pull request con una revisione di tipo commento che comincia con "Approvata dall'agente". GitHub non permette l'approvazione formale, perché l'agente usa l'account del product owner.
- Unisce solo il product owner: squash merge verso `develop`, merge commit per la pull request di rilascio verso `main`.

## Verifica locale

Non c'è CI. Prima di ogni push `npm run verify` esegue lint, controllo dei tipi, test di unità, test di sistema e build dell'immagine (da P3-11). Dopo ogni unione su `develop` l'agente esegue la verifica e i test end-to-end all'inizio della sessione successiva. GitHub Actions esegue solo il controllo dei branch, nei minuti gratuiti.

## Backlog, bug e sessioni

Sono file nel repository, in [`docs/backlog/`](docs/backlog/):

- un file per fase con i PBI, le dipendenze, la taglia e lo stato;
- [`01-Bug.md`](docs/backlog/01-Bug.md) per i bug (`BUG-001`, `BUG-002`, …);
- [`02-Registro-sessioni.md`](docs/backlog/02-Registro-sessioni.md), con una riga per sessione.

Si aggiornano nella stessa pull request del lavoro che descrivono.
