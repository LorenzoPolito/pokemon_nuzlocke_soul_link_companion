# Nuzlocke SoulLink Companion – Configurazione di GitHub

Oct 3, 2026 · @Lorenzo

GitHub ospita il codice in un repository privato, senza CI: i controlli girano in locale prima di ogni push, e un solo workflow di GitHub Actions controlla i branch delle pull request. Si segue git flow, con `main` e `develop`. Backlog, bug e registro sessioni sono file del repository in `docs/backlog/` e si aggiornano con le pull request ([decisione 21](../adr/0001-decisioni-di-progetto.md#21-la-documentazione-nel-repository-è-lunica-fonte-valida)).

## Decisioni

Un solo repository contiene app, test, dati di gioco, documentazione e configurazione della verifica locale e del rilascio.

| Voce | Scelta | Stato |
| --- | --- | --- |
| Nome | `pokemon_nuzlocke_soul_link_companion` (la proposta iniziale era `nuzlocke-soullink-companion`) | Creato |
| Proprietario | Account personale del product owner, `LorenzoPolito` | Creato |
| Visibilità | Privato | Deciso |
| Licenza | Necessaria solo se un giorno il repository diventa pubblico | Da decidere dopo P1-10 |
| Rami | Git flow: `main` per i rilasci, `develop` per l'integrazione, `pbi/…`, `bug/…`, `chore/…` per il lavoro ([decisione 22](../adr/0001-decisioni-di-progetto.md#22-git-flow-main-e-develop)) | Deciso |
| CI | Nessuna: verifica locale con `npm run verify` e hook pre-push ([decisione 13](../adr/0001-decisioni-di-progetto.md#13-repository-privato-senza-ci-verifica-locale)) | Deciso |
| GitHub Actions | Solo il workflow `branch-policy`, dentro i minuti gratuiti e con budget di spesa a 0 dollari ([decisione 23](../adr/0001-decisioni-di-progetto.md#23-github-actions-solo-per-il-controllo-dei-branch-gratis)) | Deciso |
| Immagini Docker | Costruite sul server con `docker build`; GitHub Container Registry privato facoltativo | Deciso |
| Agente | App Claude per GitHub installata sul repository, al posto dell'account bot previsto all'inizio ([decisione 14](../adr/0001-decisioni-di-progetto.md#14-agente-app-claude-per-github)). Agisce con l'account del product owner; può approvare le proprie pull request con una revisione di tipo commento, non unirle ([decisione 24](../adr/0001-decisioni-di-progetto.md#24-lagente-può-approvare-le-proprie-pull-request)) | Deciso |

Sul piano Free, regole di protezione e ruleset esistono solo per i repository pubblici; per quelli privati servono GitHub Pro, Team o Enterprise ([fonte](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)). Il 19 ottobre 2026, attivando le regole di protezione, GitHub ha risposto che sui repository privati non vengono applicate senza un account di organizzazione Team o Enterprise. Le protezioni di `main` e `develop` sono quindi affidate agli hook di Claude Code e di git ([decisione 25](../adr/0001-decisioni-di-progetto.md#25-protezioni-con-gli-hook-di-claude-code-e-di-git)), al controllo `branch-policy` e alle regole di lavoro. Il controllo segnala una pull request sbagliata, ma non può bloccare il pulsante di unione.

Con il repository privato il codice può includere tutto ciò che serve all'app, sprite compresi.

## Impostazioni e protezione di main e develop

`develop` riceve modifiche solo tramite pull request da `pbi/…`, `bug/…` o `chore/…`; `main` solo tramite la pull request di rilascio da `develop`. Servono verifica locale verde e controllo `branch-policy` verde, e solo il product owner unisce.

Impostazioni generali del repository (le fa il product owner: l'agente non cambia impostazioni, e dal suo ambiente il proxy rifiuta comunque le scritture sulle impostazioni del repository, verificato il 19 ottobre 2026):

- [ ] Unione consentita con **squash merge** (pull request verso `develop`) e con **merge commit** (pull request di rilascio verso `main`); rebase merge disattivato. Quale usare dipende dal ramo di destinazione, per regola.
- [ ] Titolo del commit di squash = titolo della pull request (che contiene l'ID del PBI).
- [x] Branch predefinito: resta `main`, perché GitHub non ha permesso di cambiarlo. Ogni nuova pull request va aperta indicando `develop` come destinazione: l'hook di Claude Code lo impone all'agente, `branch-policy` lo segnala per tutti.
- [ ] Cancellazione automatica dei branch dopo l'unione.
- [x] Issues attivo, Wiki disattivato (scelta del product owner, 19 ottobre 2026, [decisione 26](../adr/0001-decisioni-di-progetto.md#26-impostazioni-di-github-lasciate-come-sono)); non sostituiscono i file del backlog. Projects resta attivo.
- [ ] GitHub Actions attivo solo per i workflow del repository (Settings → Actions → General: "Allow LorenzoPolito, and select non-LorenzoPolito, actions and reusable workflows", nessuna azione esterna).
- [x] Budget di spesa per Actions: non impostato a 0 dollari, per scelta del product owner (decisione 26). Il workflow dura pochi secondi.

Protezione di `main` e `develop` senza ruleset:

- [x] Hook di git versionati in `.githooks/` (attivati con `git config core.hooksPath .githooks`; per l'agente li attiva l'hook SessionStart di Claude Code):
  - `pre-push` rifiuta i push su `main` e `develop` e i push forzati, e dal P3-11 esegue anche `npm run verify`;
  - `pre-commit` rifiuta i commit su `main` e `develop` e i file `.env` e di database;
  - `commit-msg` impone i Conventional Commits con l'ID.
- [x] Hook di Claude Code (`.claude/settings.json`, `.claude/hooks/guard.cjs`): all'agente vietano push e commit su `main` e `develop`, unione di pull request, tag, `--no-verify` e pull request verso il ramo sbagliato; chiedono la conferma del product owner per push forzati, rebase, cancellazioni e modifiche alle protezioni ([decisione 25](../adr/0001-decisioni-di-progetto.md#25-protezioni-con-gli-hook-di-claude-code-e-di-git)).
- [x] Workflow `.github/workflows/branch-policy.yml`: segna in rosso una pull request verso `main` che non parte da `develop`, o verso `develop` che non parte da `pbi/…`, `bug/…`, `chore/…`. Per regola una pull request rossa non si unisce.
- [x] Il modello di pull request chiede l'esito della verifica e i criteri spuntati.
- [ ] Unisce solo il product owner. L'agente agisce con il suo account e ha tecnicamente il permesso di farlo: è una regola, controllata nel registro delle pull request.
- [ ] Niente push forzati su `main` e `develop`, per regola.
- [ ] Con un eventuale account di organizzazione Team o Enterprise: ruleset su `main` e `develop` con pull request obbligatoria, controllo `branch-policy` obbligatorio, push forzati e cancellazione bloccati.

Tag di versione `v*`: li crea solo il product owner, su `main`.

## File di progetto

Questi file rendono le regole di lavoro visibili anche dentro il repository. Quelli che non dipendono dal codice nascono con la preparazione del repository (P3-12); gli altri con P3-01.

| File | Contenuto | Nasce con |
| --- | --- | --- |
| `README.md` | Cos'è l'app, avvio rapido con Docker, link a Guida di installazione e documenti di progetto | P3-12, completato in P3-01 |
| `CLAUDE.md` | Istruzioni per l'agente: mappa dei documenti, regole sempre valide, protocollo di sessione, comandi | P3-12, comandi in P3-01 |
| `CONTRIBUTING.md` | Sintesi delle Regole di lavoro: branch, commit, pull request, verifica, con link al documento completo | P3-12 |
| `CHANGELOG.md` | Una voce per ogni rilascio, nel formato Keep a Changelog | P3-12 |
| `.gitignore` | Node, SvelteKit, `.env`, file SQLite | P3-12 |
| `.env.example` | Tutte le variabili d'ambiente con valori di esempio, mai valori reali | P3-01 |
| `.githooks/pre-push` | Blocca i push su `main` e `develop` e i push forzati; da P3-11 esegue anche la verifica locale | P3-12, completato in P3-11 |
| `.githooks/pre-commit`, `.githooks/commit-msg` | Niente commit su `main` e `develop`, niente `.env` e database; messaggi in Conventional Commits con l'ID | P3-12 |
| `.claude/settings.json`, `.claude/hooks/guard.cjs` | Hook di Claude Code: regole di git flow e di lavoro applicate all'agente; attivazione degli hook di git a ogni sessione | P3-12 |
| `.github/workflows/branch-policy.yml` | Controllo del branch di partenza delle pull request verso `main` e `develop` | P3-12 |
| `.github/pull_request_template.md` | ID del PBI o bug, criteri di accettazione da spuntare, esito della verifica, note per la verifica del product owner | P3-12 |
| `.github/CODEOWNERS` | Il product owner come proprietario di tutto il repository | P3-12 |
| `docs/adr/` | Le decisioni, una ADR per decisione (ADR 0001: le prime 26) | P3-12 |

## Verifica e immagini

Senza CI, la verifica gira sulla macchina dell'agente in tre momenti, gli stessi delle Regole di lavoro. Il workflow `branch-policy` non fa verifiche sul codice.

| Momento | Cosa gira | Chi |
| --- | --- | --- |
| Prima di ogni push | `npm run verify`: lint, controllo dei tipi, test di unità e di sistema, build dell'immagine | Hook pre-push, in automatico |
| Dopo ogni unione su `develop` | Verifica più test end-to-end con Playwright | Agente, all'inizio della sessione successiva |
| Rilascio | Test end-to-end su `develop` prima della pull request di rilascio; poi build dell'immagine con tag di versione sul server, avvio e controllo di salute | Agente (test), product owner (immagine) |

I test usano sempre un database libSQL locale e temporaneo: non servono token di Turso né altri segreti.

Immagini:

- Si costruiscono sul server con `docker build -t nuzlocke-soullink-companion:1.2.0 .` dal tag di versione.
- Facoltativo: pubblicazione su GitHub Container Registry privato; il piano Free include 500 MB, quindi 2–3 versioni al massimo.

## Accesso dell'agente e sicurezza

L'agente (Claude Code) lavora sul repository tramite l'app Claude per GitHub e non fa mai push su `main` o `develop`.

Accesso dell'agente:

- L'app Claude per GitHub è installata dal product owner sul solo repository del progetto; i permessi si gestiscono dalle impostazioni dell'app su GitHub, senza token personali da creare o ruotare.
- L'agente crea branch, fa push e apre pull request; può approvare le proprie pull request con una revisione di tipo commento "Approvata dall'agente"; non unisce, non crea tag, non cambia impostazioni.
- Su GitHub l'agente agisce con l'account del product owner (`LorenzoPolito`): le pull request risultano aperte da lui, e per questo GitHub non permette l'approvazione formale né all'agente né al product owner. I commit dell'agente hanno come autore Claude e si distinguono così nella cronologia.
- Se l'accesso va sospeso, il product owner disinstalla l'app o la toglie dal repository.

Sicurezza del repository:

- [x] Dependabot non attivo, per scelta del product owner (decisione 26): nessun avviso automatico sulle dipendenze.
- [ ] Controllo dei segreti nel pre-push (per esempio gitleaks), al posto del secret scanning di GitHub (P3-11).
- [x] Nessun segreto nel repository: solo `.env.example`; il file `.env` è in `.gitignore`.

## Uso quotidiano

Ogni PBI segue gli stessi passi, dall'apertura della sessione al rilascio.

1. L'agente apre la sessione secondo le Regole di lavoro e porta il PBI a "In corso".
2. Crea il branch da `develop` aggiornato: `git switch develop && git pull && git switch -c pbi/P3-01-scheletro`.
3. Sviluppa con commit nel formato `feat(P3-01): …`, `fix(BUG-004): …`, `test(P4-06): …`.
4. Fa push: l'hook esegue la verifica e blocca il push se è rossa.
5. Apre la pull request verso `develop` tramite l'app Claude per GitHub, con titolo "P3-01 Scheletro del progetto SvelteKit", criteri spuntati ed esito della verifica; il controllo `branch-policy` deve essere verde. Se vuole, la approva con una revisione "Approvata dall'agente".
6. Il product owner rivede e unisce con squash; il PBI passa a "In verifica".
7. Alla sessione successiva l'agente esegue i test end-to-end su `develop`; un fallimento apre un bug.
8. Per un rilascio l'agente aggiorna `CHANGELOG.md` con un branch `chore/…` verso `develop`, esegue i test end-to-end e apre la pull request da `develop` a `main`. Il product owner la unisce con un merge commit, crea il tag su `main` (`git switch main && git pull && git tag v0.1.0 && git push origin v0.1.0`) e costruisce l'immagine sul server.
