# Fase 3 – Fondamenta

13 PBI. P3-12 (configurazione di GitHub) non ha dipendenze e può partire subito, anche durante la fase 1. Dopo P3-01, quattro filoni procedono in parallelo: container (P3-02, P3-04, P3-11), database e account (P3-03, P3-07, P3-08), lingue e layout (P3-05, P3-06), sync (P3-10).

| ID | PBI | Dipende da | Taglia | Stato |
| --- | --- | --- | --- | --- |
| P3-12 | Configurazione di GitHub | — | S | In corso |
| P3-01 | Scheletro del progetto SvelteKit | P2-14, P3-12 | S | In verifica |
| P3-02 | Dockerfile multi-stage e volume dati | P3-01 | S | In verifica |
| P3-03 | Configurazione database e migrazioni | P3-01 | S | In verifica |
| P3-04 | Pokédex SQLite generato nella build | P3-02, P2-07 | M | In verifica |
| P3-05 | Lingue e selettore di lingua | P3-01 | S | In verifica |
| P3-06 | Layout base e navigazione | P3-05 | M | In verifica |
| P3-07 | Registrazione, login, logout | P3-03 | M | In verifica |
| P3-08 | Admin creato all'avvio e cambio password | P3-07 | S | In verifica |
| P3-09 | Pannello admin: utenti e registrazioni | P3-08, P3-06 | M | In verifica |
| P3-10 | Hub degli eventi SSE | P3-01 | M | In verifica |
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

- [x] Senza variabili di Turso l'app usa il file locale su `/data`.
- [x] Con `TURSO_URL` e `TURSO_TOKEN` l'app usa Turso senza altre modifiche. (nel codice e nella configurazione, provato con i test; vedi il criterio sulla verifica)
- [x] Migrazioni applicate all'avvio; un errore di migrazione blocca l'avvio con un messaggio chiaro.
- [x] Il database non si apre durante `npm run build` (`building` di `$app/env`, il nome in SvelteKit 3).
- [ ] Verifica su Turso con un database di prova creato dal product owner ([ADR 0008](../adr/0008-esiti-della-fase-1.md)).
- [x] Tabella `request_key` e middleware di idempotenza (chiave del client, risposta salvata, 24 ore) con job di pulizia ([catalogo API](../progetto/16-Architettura-e-API.md#convenzioni)).

Nota, 22 ottobre 2026: aggiunto `npm run turso:check` (4 test contro il database indicato dalle variabili; saltati se mancano). Il product owner lo esegue con un database di prova, oppure lo esegue l'agente quando il token è nell'ambiente. **Resta aperto il criterio «Verifica su Turso»**, che richiede un database di prova creato dal product owner, il token come segreto dell'ambiente e la rete verso `*.turso.io` ([ADR 0008](../adr/0008-esiti-della-fase-1.md)). Il codice è lo stesso per i due casi, ma su Turso non l'ho visto funzionare. Provato: 19 test (configurazione, WAL, migrazioni nuove e ripetute, copia prima delle migrazioni, errore di migrazione che blocca l'avvio, chiavi di idempotenza: replay, conflitto, scadenza a 24 ore, corsa tra due richieste, errori 5xx non memorizzati); immagine Docker: avvio, riavvio con dati nel volume, configurazione errata che ferma il container con il messaggio. Il middleware di idempotenza è una funzione (`runIdempotent`) che gli endpoint di scrittura useranno con l'utente della sessione (P3-07).

## P3-04 Pokédex SQLite generato nella build

Output: repository dell'app.

- [x] Lo stage di build genera il file SQLite con lo schema di P2-07.
- [x] Il file è aperto in sola lettura a runtime.
- [x] La versione dei dati PokéAPI usata è registrata (commit di api-data e data nel file, riga di log all'avvio) e visibile all'admin. (registrata e letta da `openPokedex`; visibile nel pannello admin da P3-09)

Nota, 22 ottobre 2026: generatore in TypeScript (`scripts/build-pokedex.ts`, `node:sqlite`) che sostituisce lo script di prova Python con gli stessi numeri (1 025 specie, 1 351 varietà, 937 mosse, 638 321 righe di learnset, 117 127 incontri, 677 condizioni di evoluzione; 41,8 MB, 15 s). Il commit di api-data è fissato in `data/pokedex-source.json`; `scripts/fetch-api-data.sh` lo scarica con un clone parziale (9 s). Lo stadio Docker del Pokédex usa `node:22-bookworm` perché l'immagine Alpine non raggiunge il suo registro dal mio ambiente (e ha bisogno di git); non incide sul risultato. Il file è `chmod 444` nell'immagine e la connessione usa `query_only`. 27 test (fixture di api-data: nomi it/en, storico di tipi e mosse con le convenzioni documentate, rifiuto delle scritture, file mancante, versione dello schema diversa). Immagine provata: 356 MB, avvio con la riga di log del Pokédex, errore chiaro se il file manca.

## P3-05 Lingue e selettore di lingua

Output: repository dell'app.

- [x] Italiano e inglese completi; lingua iniziale dal browser, con inglese come riserva. (i messaggi sono quelli dello scheletro; ogni PBI aggiunge i suoi in entrambe le lingue)
- [x] Selettore sempre visibile, scelta salvata per l'utente. (per ora salvata in un cookie del browser; sull'account dell'utente con P3-07)
- [x] Un controllo automatico segnala chiavi di traduzione mancanti.
- [x] Plugin dei messaggi di Paraglide installato da npm, senza CDN in build ([prove](../progetto/14-Prove-di-fattibilita.md#p1-14-prova-paraglide-con-cambio-lingua)).

Nota, 22 ottobre 2026: Paraglide 2 con lingua base inglese e strategia cookie → lingua del browser → inglese; provato su build di produzione (`Accept-Language: it` → italiano, `fr` → inglese, cookie `it` con browser inglese → italiano; `<html lang>` coerente). `npm run i18n:check` (anche in `npm run lint`) fallisce per chiavi mancanti, in più, vuote o con parametri diversi. Il codice generato (`src/lib/paraglide/`) non è nel repository ed è creato da `npm install`/`prepare` e dalla build. Modulo `src/lib/modules/i18n` con README.

## P3-06 Layout base e navigazione

Output: repository dell'app.

- [x] Navigazione utilizzabile a 360 px di larghezza.
- [x] Tema chiaro e scuro secondo le preferenze del dispositivo.
- [x] Contrasto dei testi conforme a WCAG AA.

Nota, 22 ottobre 2026: token del design system trasformati in variabili CSS da `scripts/build-tokens.ts` (`src/lib/styles/tokens.css`, un test controlla che sia aggiornato). Layout `AppShell`: barra in basso a tre voci sotto i 600 px, rail a sinistra sopra; selettore di lingua nell'intestazione; pagine segnaposto Run, Pokédex, Profilo. Provato con Chromium sulla build: a 360 px nessuno scorrimento orizzontale, tema chiaro e scuro dalle preferenze del dispositivo, bersagli tattili di almeno 48 px, schermata scura controllata a vista. Contrasto: un test calcola il rapporto WCAG per 16 coppie di testo e per i 18 chip di tipo (testo bianco) in entrambi i temi: tutti ≥ 4,5:1. **Trovato**: il token `outline` ha 1,7:1 (chiaro) e 2,0:1 (scuro) su `surface`, sotto il 3:1 che il design system dichiara per i bordi dei controlli; i controlli usano `ink-muted` per il bordo; il token resta per i separatori. Da decidere se scurirlo.

## P3-07 Registrazione, login, logout

Output: repository dell'app.

- [x] Registrazione rispetta la modalità impostata (aperta, su invito, chiusa).
- [x] Password salvate solo come hash; sessioni con scadenza.
- [x] Tentativi di login ripetuti limitati.
- [x] La registrazione aperta di Better Auth è disattivata a livello di app quando la modalità non è "aperta".
- [x] Una sola funzione `authorize` decide ogni permesso; un test percorre tutta la matrice azioni × ruoli (non membro compreso, utente disattivato, cambio password pendente, run non attiva) ([permessi](../progetto/16-Architettura-e-API.md#p2-08-modello-dei-permessi)).
- [x] Profilo: l'utente cambia nome, lingua, tema e password ([mockup `Profilo`](../mockup/Profilo.dc.html)).

Nota, 22 ottobre 2026: modulo `auth` con Better Auth (scrypt, sessioni di 7 giorni, plugin `admin`), tabelle `user`, `session`, `account`, `verification`, `app_setting` e `invite` (migrazione 0001). Registrazione solo da `registerUser`: modalità aperta, su invito (predefinita, vale anche un invito a una run) o chiusa; l'invito si consuma una volta in modo atomico e si restituisce se la creazione fallisce; `/api/auth/sign-up/email` è disattivato (404). Limite di 5 tentativi al minuto per indirizzo sul modulo di accesso. `authorize` con 31 test che percorrono la matrice scritta a mano da P2-08, non membro, utente disattivato, cambio password pendente e run non attiva compresi. Profilo (nome, lingua, tema, password) e `GET`/`PATCH /api/me`; la lingua scelta è salvata sull'account (chiude il rinvio di P3-05). 155 test; flusso provato con Chromium sulla build (accesso richiesto, registrazione, profilo, uscita, limite dei tentativi). **Scoperto**: l'adapter Node di SvelteKit 3 assume `https` senza un'intestazione di protocollo e rifiuta tutti i moduli in HTTP (403 «Cross-site POST»), e `ORIGIN` non è letta a runtime; per questo il container parte da `serve.mjs`, che compensa (parte di P3-13). L'amministratore creato all'avvio e il cambio password obbligatorio sono P3-08; l'interfaccia per creare inviti, P3-09.

## P3-08 Admin creato all'avvio e cambio password

Output: repository dell'app, [Guida di installazione](../progetto/19-Guida-di-installazione.md).

- [x] Admin creato da `ADMIN_EMAIL` e `ADMIN_PASSWORD` solo se non esiste già.
- [x] Al primo accesso l'admin non può fare altro prima di cambiare la password.
- [x] Se le variabili mancano e non esiste un admin, l'avvio si ferma con un messaggio chiaro.
- [x] L'avvio cerca l'admin per email e completa i passi mancanti (registrazione e ruolo non sono atomici).
- [x] Il blocco del cambio password è nel server dell'app (hook e endpoint), con test di sistema; il flag si spegne con un hook sul cambio password.

Nota, 22 ottobre 2026: `ensureAdmin` (8 test) cerca l'admin per ruolo e l'account per email: crea, non ripete e completa un avvio interrotto. Il blocco è in `passwordGate` (pagine verso `/change-password`, API e scritture rifiutate con `password_change_required`, `authorize` coerente) e il flag si spegne con un hook di Better Auth **solo se il cambio riesce**: un test ha trovato che l'hook scattava anche dopo un cambio fallito e l'ho corretto. Provato con Chromium sulla build: primo accesso → modulo di cambio, profilo e API bloccati, stessa password rifiutata, dopo il cambio si entra, al riavvio nessun secondo admin; senza variabili il processo esce con codice 1 e un messaggio chiaro. 167 test. I test di sistema committati con Playwright arrivano con P7-02; la prova con Chromium qui sopra è manuale. L'admin si crea con un'istanza di Better Auth senza il plugin dei cookie (serve una richiesta).

## P3-09 Pannello admin: utenti e registrazioni

Output: repository dell'app.

- [x] Elenco utenti con disattivazione, reset della password ed eliminazione; un account eliminato diventa anonimo, le sue run restano e la proprietà passa al giocatore successivo. (anonimizzazione fatta; il passaggio di proprietà richiede le run e passa a P4-02)
- [x] Cambio della modalità di registrazione e generazione di link di invito.
- [x] Pagina accessibile solo all'admin, verificato lato server.

Nota, 22 ottobre 2026: pagina `/admin` solo per l'amministratore (ogni caricamento e ogni azione chiamano `authorize`; un utente normale riceve 403 e non vede la voce di menu). Utenti: reimposta password (temporanea, mostrata una volta, da cambiare; ferma le sessioni), disattiva e riattiva, rendi o togli amministratore, elimina con conferma (anonimizza: nome, email, credenziali e sessioni vanno, la riga resta). Regole: mai l'ultimo amministratore attivo, mai sul proprio account. Registrazioni: aperta, su invito o chiusa; link di invito all'app con numero di usi, elenco degli ultimi con revoca, link mostrato una volta. Mostra anche l'avviso HTTP (criterio di P3-13) e la versione dei dati di PokéAPI del Pokédex (chiude il criterio rinviato di P3-04). 14 test (casi d'uso, ultimo admin) e prova con Chromium: modalità, invito, registrazione di un secondo utente con il link, 403 su `/admin`, reset, disattivazione, rifiuto sul proprio account.

## P3-10 Hub degli eventi SSE

Output: repository dell'app.

- [x] Un client si iscrive agli eventi di una run solo se ha accesso a quella run.
- [x] Riconnessione automatica con riallineamento dello stato.
- [x] Connessioni chiuse rilasciate senza perdite di memoria.
- [x] Eventi con `id` crescente, ripresa da `Last-Event-ID`, segnale `ping` (evento con nome) ogni 15 secondi e registro nel database per sopravvivere a un riavvio ([ADR 0002](../adr/0002-rete-instabile.md)).

Nota, 22 ottobre 2026: modulo `realtime`. Server: `createHub` (diario nel database in `run_event`, ids UUIDv7 crescenti anche nello stesso millisecondo, recupero da `Last-Event-ID` o `?lastEventId=` con soglia di 500 e `reset` per id sconosciuto o troppi eventi, nessuna perdita né doppione se un evento arriva durante il recupero, `ping` con nome ogni 15 s, `bootId`, al massimo 5 connessioni per utente e run, coda limitata che chiude i client che non leggono, timer fermato quando non resta nessuno) e `GET /api/runs/{id}/stream`. Client: `connectStream` (attese 1, 2, 4, 8… fino a 30 s, avviso dopo 40 s di silenzio, riconoscimento del riavvio del server, ripresa dopo un reset). 37 test nuovi, compresi: una nuova istanza dell'hub sullo stesso database rigioca gli eventi dell'altra (riavvio), 300 connessioni aperte e chiuse senza lasciare né connessioni né timer. **Limite dichiarato**: finché non esistono le run (fase 4) la politica di accesso nega tutto, quindi la rotta risponde 404 a chiunque; il collegamento a `run_member`, i trigger di sola aggiunta su `run_event` e i lock arrivano con P4-02, P4-18 e P4-21. Le impostazioni di coda: il margine per il recupero (500) si somma ai 200 messaggi in coda.

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
- [x] In HTTP il pannello admin mostra un avviso: password e sessioni viaggiano in chiaro. (fatto in P3-09)
- [ ] La guida di installazione dice di non comprimere `/api/stream` nel proxy: con `gzip` su `text/event-stream` nginx trattiene il flusso ([prove](../progetto/14-Prove-di-fattibilita.md#p1-16-prova-sync-sse-tra-due-browser)).

