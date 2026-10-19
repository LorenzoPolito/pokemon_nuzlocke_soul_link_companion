# Nuzlocke SoulLink Companion – Configurazione di GitHub

Oct 3, 2026 · @Lorenzo

GitHub ospita il codice in un repository privato, senza CI: i controlli girano in locale prima di ogni push. Backlog, bug e registro sessioni restano nei documenti di progetto.

## Decisioni

Un solo repository contiene app, test, dati di gioco e configurazione di CI e rilascio.

| Voce | Scelta | Stato |
| --- | --- | --- |
| Nome | `nuzlocke-soullink-companion` | Proposta |
| Proprietario | Account personale del product owner | Proposta |
| Visibilità | Privato | Deciso |
| Licenza | Necessaria solo se un giorno il repository diventa pubblico | Da decidere dopo P1-10 |
| Ramo principale | `main` | Deciso |
| CI | Nessuna: verifica locale con `npm run verify` e hook pre-push | Deciso |
| Immagini Docker | Costruite sul server con `docker build`; GitHub Container Registry privato facoltativo | Deciso |
| Agente | Account bot dedicato, collaboratore del repository | Deciso |

Sul piano Free, regole di protezione e ruleset esistono solo per i repository pubblici; per quelli privati servono GitHub Pro, Team o Enterprise ([fonte](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)). Le protezioni di `main` sono quindi affidate all'hook locale e alle regole di lavoro. Se un giorno si passa a GitHub Pro, si attivano i ruleset descritti in fondo alla sezione successiva.

Con il repository privato il codice può includere tutto ciò che serve all'app, sprite compresi.

## Impostazioni e protezione di main

Il ramo `main` riceve modifiche solo tramite pull request con verifica locale verde, e solo il product owner unisce.

Impostazioni generali del repository:

- [ ] Unione consentita solo con **squash merge**; merge commit e rebase merge disattivati.
- [ ] Titolo del commit di squash = titolo della pull request (che contiene l'ID del PBI).
- [ ] Cancellazione automatica dei branch dopo l'unione.
- [ ] Issues, Wiki e Projects disattivati finché il backlog vive nei documenti.
- [ ] GitHub Actions disattivato: non c'è CI.

Protezione di `main` senza ruleset:

- [ ] Hook pre-push versionato nel repository (attivato con `git config core.hooksPath .githooks`): rifiuta i push su `main` ed esegue `npm run verify`.
- [ ] Il modello di pull request chiede l'esito della verifica e i criteri spuntati.
- [ ] Unisce solo il product owner. Il bot ha tecnicamente il permesso di farlo: è una regola, controllata nel registro delle pull request.
- [ ] Niente push forzati su `main`, per regola.
- [ ] Con un eventuale GitHub Pro: ruleset su `main` con pull request obbligatoria, cronologia lineare, push forzati e cancellazione bloccati.

Tag di versione `v*`: li crea solo il product owner.

## File di progetto

Questi file nascono con P3-01 e rendono le regole di lavoro visibili anche dentro il repository.

| File | Contenuto |
| --- | --- |
| `README.md` | Cos'è l'app, avvio rapido con Docker, link a Guida di installazione e documenti di progetto |
| `CONTRIBUTING.md` | Sintesi delle Regole di lavoro: branch, commit, pull request, verifica, con link al documento completo |
| `CHANGELOG.md` | Una voce per ogni rilascio, nel formato Keep a Changelog |
| `.env.example` | Tutte le variabili d'ambiente con valori di esempio, mai valori reali |
| `.githooks/pre-push` | Blocca i push su `main` ed esegue la verifica locale |
| `.github/pull_request_template.md` | ID del PBI o bug, criteri di accettazione da spuntare, esito della verifica, note per la verifica del product owner |
| `.github/CODEOWNERS` | Il product owner come proprietario di tutto il repository |
| `.github/dependabot.yml` | Aggiornamenti settimanali per npm e immagine base Docker |
| `docs/adr/` | Le decisioni di architettura |

## Verifica e immagini

Senza CI, la verifica gira sulla macchina dell'agente in tre momenti, gli stessi delle Regole di lavoro.

| Momento | Cosa gira | Chi |
| --- | --- | --- |
| Prima di ogni push | `npm run verify`: lint, controllo dei tipi, test di unità e di sistema, build dell'immagine | Hook pre-push, in automatico |
| Dopo ogni unione su `main` | Verifica più test end-to-end con Playwright | Agente, all'inizio della sessione successiva |
| Rilascio | Build dell'immagine con tag di versione sul server, poi avvio e controllo di salute | Product owner |

I test usano sempre un database libSQL locale e temporaneo: non servono token di Turso né altri segreti.

Immagini:

- Si costruiscono sul server con `docker build -t nuzlocke-soullink-companion:1.2.0 .` dal tag di versione.
- Facoltativo: pubblicazione su GitHub Container Registry privato; il piano Free include 500 MB, quindi 2–3 versioni al massimo.

## Accesso dell'agente e sicurezza

L'agente lavora con un account bot dedicato e non tocca mai `main` direttamente.

Accesso dell'agente (Claude Code):

- Un account GitHub separato per l'agente, invitato come collaboratore del solo repository del progetto.
- Token fine-grained del bot, valido solo per questo repository, con scadenza di 90 giorni.
- L'agente crea branch, fa push e apre pull request; non unisce, non crea tag, non cambia impostazioni.
- Le azioni del bot si distinguono da quelle del product owner nella cronologia del repository.
- Il token si revoca subito se finisce in un log, in una chat o in un file.

Sicurezza del repository:

- [ ] Avvisi e aggiornamenti di sicurezza di Dependabot attivi.
- [ ] Controllo dei segreti nel pre-push (per esempio gitleaks), al posto del secret scanning di GitHub.
- [ ] Nessun segreto nel repository: solo `.env.example`; il file `.env` è in `.gitignore`.

## Uso quotidiano

Ogni PBI segue gli stessi passi, dall'apertura della sessione al rilascio.

1. L'agente apre la sessione secondo le Regole di lavoro e porta il PBI a "In corso".
2. Crea il branch da `main` aggiornato: `git switch main && git pull && git switch -c pbi/P3-01-scheletro`.
3. Sviluppa con commit nel formato `feat(P3-01): …`, `fix(BUG-004): …`, `test(P4-06): …`.
4. Fa push: l'hook esegue la verifica e blocca il push se è rossa.
5. Apre la pull request: `gh pr create --title "P3-01 Scheletro del progetto SvelteKit" --fill`, con criteri spuntati ed esito della verifica.
6. Il product owner rivede e unisce con squash; il PBI passa a "In verifica".
7. Alla sessione successiva l'agente esegue i test end-to-end su `main`; un fallimento apre un bug.
8. Per un rilascio il product owner aggiorna `CHANGELOG.md`, crea il tag (`git tag v0.1.0 && git push origin v0.1.0`) e costruisce l'immagine sul server.
