# Nuzlocke SoulLink Companion – Mappa degli artefatti

Oct 3, 2026 · @Lorenzo

Questa mappa è l'elenco unico di tutto ciò che il progetto produce: ogni sessione parte da qui, e un nuovo artefatto esiste solo dopo essere stato aggiunto a questa tabella.

Dal 3 ottobre 2026 la documentazione nel repository è l'unica fonte valida ([decisione 21](../adr/0001-decisioni-di-progetto.md#21-la-documentazione-nel-repository-è-lunica-fonte-valida)): backlog, bug e registro sessioni sono file in `docs/backlog/` e si aggiornano con le pull request. I percorsi sono relativi alla radice del repository.

## Artefatti

Gli artefatti di governo esistono già; quelli tecnici nascono con il PBI indicato.

| Artefatto | Tipo | Contenuto | Prodotto da | Si aggiorna quando | Stato |
| --- | --- | --- | --- | --- | --- |
| [Specifica dei requisiti](01-Specifica-dei-requisiti.md) | Documento | Requisiti funzionali e scelte di stack | Fase 0 | Il product owner approva una modifica a un requisito | Esiste |
| [Piano di progetto](02-Piano-di-progetto.md) | Documento | Fasi e gate | Fase 0 | Si chiude un gate | Esiste |
| [MVP e rilasci](03-MVP-e-rilasci.md) | Documento | Ambito dell'MVP, PBI per rilascio, criteri di uscita | Fase 0 | Un PBI cambia rilascio o un rilascio si chiude | Esiste |
| [Product Backlog](../backlog/00-Backlog-regole-DoD-riepilogo.md) | File in `docs/backlog/` | Regole, Definition of Done e riepilogo; un file per fase (`10-Fase-1-Analisi.md` … `70-Fase-7-Test-e-rilascio.md`) con PBI, dipendenze, taglie, criteri e stato | Fase 0 | All'apertura e alla chiusura di ogni sessione | Esiste |
| [Registro bug](../backlog/01-Bug.md) | File in `docs/backlog/` | Registro dei bug con gravità e stato | Fase 0 | Si apre un bug o ne cambia lo stato | Esiste |
| [Registro sessioni](../backlog/02-Registro-sessioni.md) | File in `docs/backlog/` | Una riga per sessione: lavoro fatto, stime, consumi reali | Fase 0 | Alla chiusura di ogni sessione | Esiste |
| [Regole di lavoro](04-Regole-di-lavoro.md) | Documento | Ruoli, flusso, protocollo di sessione, verifica, test, bug, stime | Fase 0 | Il product owner approva una modifica alle regole | Esiste |
| [Linee guida di sviluppo](05-Linee-guida-di-sviluppo.md) | Documento | Moduli, livelli, codice atomico e antifragile, convenzioni, checklist di revisione | Fase 0 | Il product owner approva una modifica alle linee guida | Esiste |
| [Configurazione di GitHub](08-Configurazione-di-GitHub.md) | Documento | Repository privato, git flow, protezione di main e develop, verifica locale, immagini, accesso dell'agente | Fase 0, poi P3-12 | Cambia un'impostazione o un permesso | Esiste |
| [ADR](../adr/README.md) | Cartella | Decisioni di progetto: l'ADR 0001 con le prime 26 e una ADR per ogni decisione successiva (contesto, decisione, alternative, conseguenze) | P3-12, P1-19, poi ogni PBI che prende una decisione | Il product owner prende o cambia una decisione | Esiste |
| [Design System](../design-system/README.md) | Design system | Token di colore, tipografia, spazi e forme in `docs/design-system/tokens.json`; manuale di stile | Fase 0 | Cambia un token o una regola visiva | Esiste |
| [Mockup](https://claude.ai/artifact/4W1JWddYcx4VzH1EDXtB6r) | Canvas di design | Schermate per telefono e tablet, con più giocatori, stati vuoti, errori e tema scuro. Sorgenti in `docs/mockup/`; si visualizzano solo nel canvas su claude.ai | Fase 0, poi P2-12 e P2-13 | Nasce o cambia una schermata | Esiste |
| Mappa degli artefatti | Documento | Questo elenco | Fase 0 | Nasce, cambia o si ritira un artefatto | Esiste |
| [Regole Soullocke (PDF)](../fonti/Regole-Soullocke.pdf) | Fonte di progetto | Regole Nuzlocke e Soul Link di riferimento | Esterno | Mai: solo consultazione | Esiste |
| [Modello dati](06-Modello-dati-bozza.md) (bozza) | Documento | Tabelle, relazioni, schema del Pokédex | P2-01–P2-07 | Ogni modifica allo schema | Esiste |
| [Rischi tecnici e fonti dei dati](07-Rischi-tecnici-e-fonti-dei-dati.md) | Documento | Registro dei rischi con esito delle verifiche, fonte di ogni dato | Fase 0, poi fase 1 | Una verifica cambia un rischio o una fonte | Esiste |
| PDF dei documenti | Copia | `docs/progetto/pdf/`: i 6 documenti con i diagrammi visibili, copia del 3 ottobre 2026 | Fase 0 | Mai: copia storica | Esiste |
| [Analisi delle fonti dati](10-Analisi-delle-fonti-dati.md) | Documento | Inventario dei giochi, copertura di PokéAPI, nomi localizzati, licenze | P1-01–P1-05, P1-10 | Durante la fase 1 | Esiste (fase 1 chiusa) |
| [Dati di gioco: aree, medaglie, level cap](11-Dati-di-gioco.md) | Documento | Fonti, formato e processo dei dati di progressione, prima per Bianco, Nero, Bianco 2, Nero 2 | P1-06, P1-07 | Durante la fase 1; poi a ogni modifica dei file di gioco | Esiste (P1-06 e P1-07 fatti) |
| File dei dati di gioco | Dati | `data/games/<game_id>.json` (aree in ordine, incontri speciali, medaglie e level cap) e lo schema `data/games/game.schema.json` | P1-06, P1-07, poi un file per ogni nuovo gioco | Si aggiunge un gioco o si corregge un dato, con `dataVersion` incrementata | Esiste (quinta generazione) |
| [Meccaniche per generazione](13-Meccaniche-per-generazione.md) | Documento | Tabelle dei tipi e regole di calcolo | P1-08, P1-09 | Durante la fase 1 | Esiste (P1-08 e P1-09 fatti) |
| Tabella dei tipi per epoca | Dati | `data/mechanics/type-chart.json`: moltiplicatori di efficacia per le epoche 1, 2–5 e 6+, derivati da PokéAPI e verificati con @smogon/calc | P1-08, poi P5-05 | Cambia una tabella dei tipi | Esiste |
| Script di prova del Pokédex | Script | `tools/prove/build_pokedex.py`: genera il file SQLite del Pokédex da PokeAPI/api-data, schema versione 2 (solo prova; lo script vero nasce in fase 3) | P1-15, poi sostituito in fase 3 | Si sostituisce con lo script di produzione | Esiste (prova) |
| [Schema del Pokédex](15-Schema-del-Pokedex.md) | Documento | Tabelle, regole di lettura (storico, gruppi di versioni, nomi), indici e generazione del file SQLite del Pokédex | P2-07 | Cambia lo schema o la fonte dei dati | Esiste |
| [Domande aperte](12-Domande-aperte.md) | Documento | Le domande di P1-19 con proposta e risposta del product owner: rete instabile e quanto emerso dai PBI di fase 1 | P1-19 | Storico: non si aggiorna più (le nuove domande vanno in ADR "Proposta") | Esiste |
| [Prove di fattibilità dello stack](14-Prove-di-fattibilita.md) | Documento | Esiti e misure delle prove tecniche | P1-11–P1-17 | Durante la fase 1 | Esiste (P1-11…P1-17 fatti) |
| [Architettura e API](16-Architettura-e-API.md) | Documento | Permessi, catalogo API, eventi SSE e lock | P2-08–P2-10 | Ogni modifica a un endpoint o evento | In corso (P2-08 fatto) |
| Flussi e schermate | Documento | Percorsi utente e bozze delle schermate | P2-11–P2-13 | Ogni modifica a un flusso | Da creare |
| Piano di test | Documento | Casi di test di sistema ed end-to-end | P7-01 | Ogni nuova regola o bug corretto | Da creare |
| Guida di installazione | Documento | Docker, HTTP e reverse proxy, variabili d'ambiente, volume, backup, Turso | P3-02, P3-08, P3-13, P7-05, P7-06 | Ogni nuova variabile o rilascio | Da creare |
| Repository GitHub (privato) | Codice | Codice, test, dati di gioco, hook, README, CHANGELOG.md | P3-12, P3-01 | A ogni pull request | Esiste (vuoto fino a P3-01) |
| File di base del repository | File | `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `CLAUDE.md` (istruzioni per l'agente), `.gitignore`, `.github/pull_request_template.md`, `.github/CODEOWNERS` | P3-12 | Cambia una regola di lavoro o un comando | Esiste |
| Hook di protezione | Script | `.claude/settings.json` e `.claude/hooks/guard.cjs` (hook di Claude Code per l'agente), `.githooks/pre-commit`, `commit-msg`, `pre-push` (hook di git) (decisione 25) | P3-12 | Cambiano le regole di git flow o di lavoro, con conferma del product owner | Esiste |
| Controllo dei branch | Workflow GitHub Actions | `.github/workflows/branch-policy.yml`: pull request verso `main` solo da `develop`, verso `develop` solo da `pbi/…`, `bug/…`, `chore/…` (decisioni 22 e 23) | P3-12 | Cambiano i rami o le regole di git flow | Esiste |
| Verifica locale | Script e hook | `npm run verify` e hook pre-push in `.githooks/pre-push`; fino a P3-11 l'hook blocca solo i push su `main` e `develop` | P3-12, P3-11 | Ogni nuovo livello o strumento di test | Parziale |
| Immagine Docker | Rilascio | Immagine con tag di versione, costruita sul server | P7-07 e ogni rilascio | A ogni rilascio | Da creare |

Repository e immagini sono ospitati su GitHub, come descritto nella [Configurazione di GitHub](08-Configurazione-di-GitHub.md). Non c'è CI ([decisione 13](../adr/0001-decisioni-di-progetto.md#13-repository-privato-senza-ci-verifica-locale)); GitHub Actions esegue solo il controllo dei branch ([decisione 23](../adr/0001-decisioni-di-progetto.md#23-github-actions-solo-per-il-controllo-dei-branch-gratis)).
