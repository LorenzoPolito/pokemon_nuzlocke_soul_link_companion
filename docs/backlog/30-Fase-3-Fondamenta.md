# Fase 3 – Fondamenta

13 PBI. P3-12 (configurazione di GitHub) non ha dipendenze e può partire subito, anche durante la fase 1. Dopo P3-01, quattro filoni procedono in parallelo: container (P3-02, P3-04, P3-11), database e account (P3-03, P3-07, P3-08), lingue e layout (P3-05, P3-06), sync (P3-10).

| ID | PBI | Dipende da | Taglia | Stato |
| --- | --- | --- | --- | --- |
| P3-12 | Configurazione di GitHub | — | S | In corso |
| P3-01 | Scheletro del progetto SvelteKit | P2-14, P3-12 | S | In verifica |
| P3-02 | Dockerfile multi-stage e volume dati | P3-01 | S | In verifica |
| P3-03 | Configurazione database e migrazioni | P3-01 | S | Da iniziare |
| P3-04 | Pokédex SQLite generato nella build | P3-02, P2-07 | M | Da iniziare |
| P3-05 | Lingue e selettore di lingua | P3-01 | S | Da iniziare |
| P3-06 | Layout base e navigazione | P3-05 | M | Da iniziare |
| P3-07 | Registrazione, login, logout | P3-03 | M | Da iniziare |
| P3-08 | Admin creato all'avvio e cambio password | P3-07 | S | Da iniziare |
| P3-09 | Pannello admin: utenti e registrazioni | P3-08, P3-06 | M | Da iniziare |
| P3-10 | Hub degli eventi SSE | P3-01 | M | Da iniziare |
| P3-11 | Verifica locale e hook pre-push | P3-02, P3-12 | S | Da iniziare |
| P3-13 | Solo HTTP, compatibile con reverse proxy | P3-02 | S | Da iniziare |

## P3-01 Scheletro del progetto SvelteKit

Output: repository dell'app.

- [x] SvelteKit con adapter Node e TypeScript in modalità strict.
- [x] Lint, formattazione e test runner configurati, con un test di esempio verde.
- [x] Comandi di sviluppo documentati nel README.
- [x] Alias dei moduli con `#lib` (SvelteKit 3 ha rimosso `$lib`) e adapter passato a `sveltekit({ adapter })` in `vite.config.ts` ([prove](../progetto/14-Prove-di-fattibilita.md#p1-14-prova-paraglide-con-cambio-lingua)).

Nota, 22 ottobre 2026: in SvelteKit 3 `Handle` si importa da `@sveltejs/kit/hooks`, `tsconfig.json` estende `$app/tsconfig` e la configurazione dell'adapter sta in `vite.config.ts`. Verificato: `npm run check`, `lint`, `test` (2 test) e `build` senza errori; la build parte con `node build/index.js` e risponde in HTTP. Testi dell'interfaccia e lingua arrivano con P3-05; eslint-plugin-boundaries con i primi moduli.

## P3-02 Dockerfile multi-stage e volume dati

Output: repository dell'app, [Guida di installazione](../progetto/19-Guida-di-installazione.md).

- [x] Immagine finale su Node Alpine senza strumenti di build.
- [x] Database su `/data`, dichiarato come volume.
- [x] Healthcheck che risponde quando l'app è pronta.
- [x] Il container gira con un utente non root.
- [x] `/data` creata con il proprietario dell'utente non root prima di `VOLUME`; la guida di installazione spiega i permessi di una cartella montata dall'host ([prove](../progetto/14-Prove-di-fattibilita.md#p1-17-prova-immagine-docker-multi-stage)).

Nota, 22 ottobre 2026: provato con Docker 29.8: immagine 241 MB, prima risposta in 0,26 s, utente `node`, `/data` scrivibile, nessun compilatore né git nell'immagine, healthcheck `healthy` (e non sano con l'app ferma). Il controllo di salute è oggi `GET /api/health` → `{ ok: true }`; con P3-03 controllerà anche il database. La build nel sandbox richiede `--network host` e il certificato del proxy; il `Dockerfile` del repository non ne ha bisogno.

## P3-03 Configurazione database e migrazioni

Output: repository dell'app.

- [ ] Senza variabili di Turso l'app usa il file locale su `/data`.
- [ ] Con `TURSO_URL` e `TURSO_TOKEN` l'app usa Turso senza altre modifiche.
- [ ] Migrazioni applicate all'avvio; un errore di migrazione blocca l'avvio con un messaggio chiaro.
- [ ] Il database non si apre durante `npm run build` (usare `building` di `$app/environment`).
- [ ] Verifica su Turso con un database di prova creato dal product owner ([ADR 0008](../adr/0008-esiti-della-fase-1.md)).
- [ ] Tabella `request_key` e middleware di idempotenza (chiave del client, risposta salvata, 24 ore) con job di pulizia ([catalogo API](../progetto/16-Architettura-e-API.md#convenzioni)).


## P3-04 Pokédex SQLite generato nella build

Output: repository dell'app.

- [ ] Lo stage di build genera il file SQLite con lo schema di P2-07.
- [ ] Il file è aperto in sola lettura a runtime.
- [ ] La versione dei dati PokéAPI usata è registrata e visibile all'admin.

## P3-05 Lingue e selettore di lingua

Output: repository dell'app.

- [ ] Italiano e inglese completi; lingua iniziale dal browser, con inglese come riserva.
- [ ] Selettore sempre visibile, scelta salvata per l'utente.
- [ ] Un controllo automatico segnala chiavi di traduzione mancanti.
- [ ] Plugin dei messaggi di Paraglide installato da npm, senza CDN in build ([prove](../progetto/14-Prove-di-fattibilita.md#p1-14-prova-paraglide-con-cambio-lingua)).


## P3-06 Layout base e navigazione

Output: repository dell'app.

- [ ] Navigazione utilizzabile a 360 px di larghezza.
- [ ] Tema chiaro e scuro secondo le preferenze del dispositivo.
- [ ] Contrasto dei testi conforme a WCAG AA.

## P3-07 Registrazione, login, logout

Output: repository dell'app.

- [ ] Registrazione rispetta la modalità impostata (aperta, su invito, chiusa).
- [ ] Password salvate solo come hash; sessioni con scadenza.
- [ ] Tentativi di login ripetuti limitati.
- [ ] La registrazione aperta di Better Auth è disattivata a livello di app quando la modalità non è "aperta".
- [ ] Una sola funzione `authorize` decide ogni permesso; un test percorre tutta la matrice azioni × ruoli (non membro compreso, utente disattivato, cambio password pendente, run non attiva) ([permessi](../progetto/16-Architettura-e-API.md#p2-08-modello-dei-permessi)).
- [ ] Profilo: l'utente cambia nome, lingua, tema e password ([mockup `Profilo`](../mockup/Profilo.dc.html)).


## P3-08 Admin creato all'avvio e cambio password

Output: repository dell'app, Guida di installazione.

- [ ] Admin creato da `ADMIN_EMAIL` e `ADMIN_PASSWORD` solo se non esiste già.
- [ ] Al primo accesso l'admin non può fare altro prima di cambiare la password.
- [ ] Se le variabili mancano e non esiste un admin, l'avvio si ferma con un messaggio chiaro.
- [ ] L'avvio cerca l'admin per email e completa i passi mancanti (registrazione e ruolo non sono atomici).
- [ ] Il blocco del cambio password è nel server dell'app (hook e endpoint), con test di sistema; il flag si spegne con un hook sul cambio password.


## P3-09 Pannello admin: utenti e registrazioni

Output: repository dell'app.

- [ ] Elenco utenti con disattivazione, reset della password ed eliminazione; un account eliminato diventa anonimo, le sue run restano e la proprietà passa al giocatore successivo.
- [ ] Cambio della modalità di registrazione e generazione di link di invito.
- [ ] Pagina accessibile solo all'admin, verificato lato server.

## P3-10 Hub degli eventi SSE

Output: repository dell'app.

- [ ] Un client si iscrive agli eventi di una run solo se ha accesso a quella run.
- [ ] Riconnessione automatica con riallineamento dello stato.
- [ ] Connessioni chiuse rilasciate senza perdite di memoria.
- [ ] Eventi con `id` crescente, ripresa da `Last-Event-ID`, segnale `ping` (evento con nome) ogni 15 secondi e registro nel database per sopravvivere a un riavvio ([ADR 0002](../adr/0002-rete-instabile.md)).


## P3-11 Verifica locale e hook pre-push

Output: repository dell'app.

- [ ] Il comando npm run verify esegue lint, controllo dei tipi, test di unità e di sistema e build dell'immagine.
- [ ] Un hook pre-push blocca il push se la verifica fallisce o se il ramo è main o develop; la pull request riporta l'esito della verifica.
- [ ] `npm audit --audit-level=high` eseguito come avviso che non blocca il push e non fallisce a rete assente ([ADR 0005](../adr/0005-adr-e-scelte-di-processo.md)).

Modifica dei criteri, 19 ottobre 2026: aggiunto `develop` al criterio dell'hook (git flow, [decisione 22](../adr/0001-decisioni-di-progetto.md#22-git-flow-main-e-develop)); il blocco su `main` e `develop` esiste già dalla preparazione del repository (P3-12).

## P3-12 Configurazione di GitHub

Output: repository su GitHub, Configurazione di GitHub.

- [ ] Repository privato creato con nome e impostazioni del documento Configurazione di GitHub.
- [ ] App Claude per GitHub installata sul repository, provata aprendo la pull request di preparazione del repository.

Modifica dei criteri, 19 ottobre 2026: il criterio sull'account bot è sostituito da quello sull'app Claude per GitHub ([decisione 14](../adr/0001-decisioni-di-progetto.md#14-agente-app-claude-per-github)); il nome effettivo del repository è `pokemon_nuzlocke_soul_link_companion`, diverso dalla proposta del documento Configurazione di GitHub, che è stato aggiornato. Aggiunto il criterio su git flow (decisioni 22 e 23), su richiesta del product owner.
- [x] ~~Dependabot attivo.~~ Non attivato, per scelta del product owner (19 ottobre 2026, [decisione 26](../adr/0001-decisioni-di-progetto.md#26-impostazioni-di-github-lasciate-come-sono)).
- [ ] Git flow configurato: ramo `develop` creato, hook che blocca `main` e `develop`, controllo `branch-policy` su GitHub Actions entro i minuti gratuiti, hook di Claude Code e di git al posto delle protezioni di GitHub (decisione 25).
- [ ] Licenza aggiunta appena decisa dopo P1-10.

## P3-13 Solo HTTP, compatibile con reverse proxy

Output: repository dell'app, Guida di installazione.

- [ ] Senza configurazione l'app risponde in HTTP sulla porta indicata.
- [ ] Dietro un reverse proxy con HTTPS l'app riconosce protocollo e indirizzo originali dalle intestazioni inoltrate (ORIGIN e intestazioni configurabili); nessun certificato gestito dall'app.
- [ ] Quando il proxy indica HTTPS, i cookie di sessione sono marcati Secure.
- [ ] In HTTP il pannello admin mostra un avviso: password e sessioni viaggiano in chiaro.
- [ ] La guida di installazione dice di non comprimere `/api/stream` nel proxy: con `gzip` su `text/event-stream` nginx trattiene il flusso ([prove](../progetto/14-Prove-di-fattibilita.md#p1-16-prova-sync-sse-tra-due-browser)).

