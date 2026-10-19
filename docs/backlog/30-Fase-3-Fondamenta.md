# Fase 3 – Fondamenta

13 PBI. P3-12 (configurazione di GitHub) non ha dipendenze e può partire subito, anche durante la fase 1. Dopo P3-01, quattro filoni procedono in parallelo: container (P3-02, P3-04, P3-11), database e account (P3-03, P3-07, P3-08), lingue e layout (P3-05, P3-06), sync (P3-10).

| ID | PBI | Dipende da | Taglia | Stato |
| --- | --- | --- | --- | --- |
| P3-12 | Configurazione di GitHub | — | S | In corso |
| P3-01 | Scheletro del progetto SvelteKit | P2-14, P3-12 | S | Da iniziare |
| P3-02 | Dockerfile multi-stage e volume dati | P3-01 | S | Da iniziare |
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

- [ ] SvelteKit con adapter Node e TypeScript in modalità strict.
- [ ] Lint, formattazione e test runner configurati, con un test di esempio verde.
- [ ] Comandi di sviluppo documentati nel README.

## P3-02 Dockerfile multi-stage e volume dati

Output: repository dell'app, Guida di installazione.

- [ ] Immagine finale su Node Alpine senza strumenti di build.
- [ ] Database su `/data`, dichiarato come volume.
- [ ] Healthcheck che risponde quando l'app è pronta.
- [ ] Il container gira con un utente non root.

## P3-03 Configurazione database e migrazioni

Output: repository dell'app.

- [ ] Senza variabili di Turso l'app usa il file locale su `/data`.
- [ ] Con `TURSO_URL` e `TURSO_TOKEN` l'app usa Turso senza altre modifiche.
- [ ] Migrazioni applicate all'avvio; un errore di migrazione blocca l'avvio con un messaggio chiaro.

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

## P3-08 Admin creato all'avvio e cambio password

Output: repository dell'app, Guida di installazione.

- [ ] Admin creato da `ADMIN_EMAIL` e `ADMIN_PASSWORD` solo se non esiste già.
- [ ] Al primo accesso l'admin non può fare altro prima di cambiare la password.
- [ ] Se le variabili mancano e non esiste un admin, l'avvio si ferma con un messaggio chiaro.

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

## P3-11 Verifica locale e hook pre-push

Output: repository dell'app.

- [ ] Il comando npm run verify esegue lint, controllo dei tipi, test di unità e di sistema e build dell'immagine.
- [ ] Un hook pre-push blocca il push se la verifica fallisce o se il ramo è main o develop; la pull request riporta l'esito della verifica.

Modifica dei criteri, 19 ottobre 2026: aggiunto `develop` al criterio dell'hook (git flow, [decisione 22](../decisioni.md#22-git-flow-main-e-develop)); il blocco su `main` e `develop` esiste già dalla preparazione del repository (P3-12).

## P3-12 Configurazione di GitHub

Output: repository su GitHub, Configurazione di GitHub.

- [ ] Repository privato creato con nome e impostazioni del documento Configurazione di GitHub.
- [ ] App Claude per GitHub installata sul repository, provata aprendo la pull request di preparazione del repository.

Modifica dei criteri, 19 ottobre 2026: il criterio sull'account bot è sostituito da quello sull'app Claude per GitHub ([decisione 14](../decisioni.md#14-agente-app-claude-per-github)); il nome effettivo del repository è `pokemon_nuzlocke_soul_link_companion`, diverso dalla proposta del documento Configurazione di GitHub, che è stato aggiornato. Aggiunto il criterio su git flow (decisioni 22 e 23), su richiesta del product owner.
- [ ] Dependabot attivo.
- [ ] Git flow configurato: ramo `develop` creato, hook che blocca `main` e `develop`, controllo `branch-policy` su GitHub Actions entro i minuti gratuiti.
- [ ] Licenza aggiunta appena decisa dopo P1-10.

## P3-13 Solo HTTP, compatibile con reverse proxy

Output: repository dell'app, Guida di installazione.

- [ ] Senza configurazione l'app risponde in HTTP sulla porta indicata.
- [ ] Dietro un reverse proxy con HTTPS l'app riconosce protocollo e indirizzo originali dalle intestazioni inoltrate (ORIGIN e intestazioni configurabili); nessun certificato gestito dall'app.
- [ ] Quando il proxy indica HTTPS, i cookie di sessione sono marcati Secure.
- [ ] In HTTP il pannello admin mostra un avviso: password e sessioni viaggiano in chiaro.
