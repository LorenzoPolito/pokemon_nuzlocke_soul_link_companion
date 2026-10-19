# Come contribuire

Sintesi delle [Regole di lavoro](docs/progetto/04-Regole-di-lavoro.md) e della [Configurazione di GitHub](docs/progetto/08-Configurazione-di-GitHub.md). In caso di dubbio valgono i documenti completi.

## Ruoli

- **Product owner**: decide le priorità, approva i gate, verifica i PBI "In verifica" e unisce le pull request. È l'unico che unisce e che crea tag.
- **Agente** (Claude Code, tramite l'app Claude per GitHub): sviluppa i PBI, scrive i test, apre i bug, aggiorna backlog, registro sessioni e documenti; apre pull request, non unisce.

## Prima di iniziare

```sh
git config core.hooksPath .githooks
```

L'hook `pre-push` rifiuta i push su `main`. Dal PBI P3-11 esegue anche `npm run verify`.

## Branch

Uno per PBI o bug, creato da `main` aggiornato, con l'ID nel nome:

- `pbi/P4-06-link-soullink`
- `bug/BUG-007-morte-partner`

Mai push diretti su `main`, mai push forzati su `main`.

## Commit

[Conventional Commits](https://www.conventionalcommits.org/) con l'ID del PBI o del bug come ambito:

- `feat(P4-06): collega gli incontri della stessa area`
- `fix(BUG-004): …`, `test(P4-06): …`, `docs(P1-01): …`, `chore(P3-12): …`

Un commit per passo logico; ogni commit compila e passa i test.

## Pull request

- Titolo con l'ID: `P3-01 Scheletro del progetto SvelteKit`.
- Descrizione secondo il [modello](.github/pull_request_template.md): criteri di accettazione spuntati, test aggiunti, esito di `npm run verify`.
- Unione solo con squash merge, solo da parte del product owner.

## Verifica locale

Non c'è CI. Prima di ogni push `npm run verify` esegue lint, controllo dei tipi, test di unità, test di sistema e build dell'immagine (da P3-11). Dopo ogni unione su `main` l'agente esegue la verifica e i test end-to-end all'inizio della sessione successiva.

## Backlog, bug e sessioni

Sono file nel repository, in [`docs/backlog/`](docs/backlog/):

- un file per fase con i PBI, le dipendenze, la taglia e lo stato;
- [`01-Bug.md`](docs/backlog/01-Bug.md) per i bug (`BUG-001`, `BUG-002`, …);
- [`02-Registro-sessioni.md`](docs/backlog/02-Registro-sessioni.md), con una riga per sessione.

Si aggiornano nella stessa pull request del lavoro che descrivono.
