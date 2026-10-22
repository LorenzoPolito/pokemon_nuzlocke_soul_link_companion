# Nuzlocke SoulLink Companion – Guida di installazione

Guida per chi installa l'app su un proprio server. Si completa con i PBI P3-08 (admin), P3-13 (HTTP e reverse proxy), P7-05 e P7-06 (installazione completa, backup e ripristino). Questa versione copre l'immagine e il volume dei dati (P3-02).

## Requisiti

- Docker (o un runtime compatibile) su un server Linux.
- Una porta libera (di base la 3000) e uno spazio per il volume dei dati.

## Costruire e avviare

L'immagine si costruisce dal repository; non è ancora pubblicata su un registro. **La build ha bisogno di internet**: scarica da GitHub i dati di PokéAPI (circa 400 MB di JSON, a un commit fissato nel repository) e le immagini di base da Docker Hub; ci vuole un paio di minuti la prima volta.

```sh
docker build -t nuzlocke-soullink-companion .
docker volume create nuzlocke-data
docker run -d --name nuzlocke \
  -p 3000:3000 \
  -v nuzlocke-data:/data \
  nuzlocke-soullink-companion
```

L'app risponde in HTTP su `http://<server>:3000`. Le migrazioni del database si applicano da sole a ogni avvio.

## Variabili d'ambiente

L'app controlla le variabili all'avvio: se una è sbagliata si ferma e dice quale. Il file `.env.example` del repository le elenca.

| Variabile | Obbligatoria | Valore | Uso |
| --- | --- | --- | --- |
| `DATA_DIR` | no | `/data` nell'immagine, `./data` in sviluppo | Cartella del database locale |
| `TURSO_URL`, `TURSO_TOKEN` | no, ma insieme | `libsql://…` e il token | Usa un database Turso online al posto del file locale |
| `AUTH_SECRET` | no | almeno 32 caratteri | Segreto che firma le sessioni. Se manca l'app ne genera uno e lo conserva in `DATA_DIR/auth-secret` (leggibile solo dal proprietario): non cancellare quel file, o tutti dovranno accedere di nuovo |
| `ORIGIN` | no | per esempio `https://nuzlocke.example.org` | Indirizzo pubblico; se è `https`, l'app sa di stare dietro un proxy con HTTPS |
| `TRUST_PROXY` | no | `true` dietro un reverse proxy | Usa `X-Forwarded-Proto` e `X-Forwarded-For` del proxy. Senza, l'app ignora quelle intestazioni |
| `POKEDEX_PATH` | no | `/app/pokedex/pokedex.sqlite` nell'immagine | File del Pokédex, in sola lettura; in produzione deve esistere |
| `MIGRATIONS_DIR` | no | `/app/drizzle` nell'immagine | Cartella delle migrazioni |

Le variabili dell'amministratore e dell'indirizzo pubblico si aggiungono con P3-08 e P3-13.

## Usare Turso al posto del file locale

1. Crea un database su [Turso](https://turso.tech) (il piano gratuito basta) e prendi l'URL (`libsql://…`) e un token di accesso.
2. Avvia l'app con `TURSO_URL` e `TURSO_TOKEN`: il codice è lo stesso, cambiano solo le variabili. Le migrazioni si applicano al primo avvio.
3. Per provare un database prima di usarlo: `TURSO_URL=… TURSO_TOKEN=… npm run turso:check` (usa un database di prova: ci crea le tabelle dell'app).

Il token è un segreto: tienilo nelle variabili dell'ambiente, mai nel repository né in una chat.

## Account e registrazione

- Gli utenti accedono con email e password; le password si salvano solo come hash e le sessioni durano 7 giorni.
- I tentativi di accesso sono limitati a 5 al minuto per indirizzo.
- Di base la registrazione è **su invito**: chi non ha un invito non può creare un account. L'amministratore (creato all'avvio, vedi P3-08) può aprirla a tutti o chiuderla.
- Il container usa `serve.mjs` come punto di avvio: serve a far funzionare i moduli (login, registrazione) anche in semplice HTTP. Dietro un proxy con HTTPS imposta `TRUST_PROXY=true`.

## Il Pokédex

L'immagine contiene il Pokédex (specie, mosse, abilità, evoluzioni, incontri) in un file SQLite di circa 42 MB, generato durante la build dai dati di [PokeAPI/api-data](https://github.com/PokeAPI/api-data) e aperto dall'app solo in lettura. Nessuna ricerca tocca internet. All'avvio il log dice da quale commit di api-data viene (`Pokédex ready (api-data 447bd5c, …)`). Per aggiornare i dati si cambia il commit in `data/pokedex-source.json` e si ricostruisce l'immagine. Se il file manca o ha una versione dello schema diversa, in produzione l'app non parte.

## Database e migrazioni

- Senza variabili di Turso il database è il file `app.db` in `DATA_DIR`, con modalità WAL (compaiono anche `app.db-wal` e `app.db-shm`: fanno parte del database).
- Le migrazioni vanno solo avanti. Prima di applicarne di nuove su un database che ha già dati, l'app copia il file in `app.db.before-migration`: per tornare indietro si ferma l'app, si rimette la copia e si installa la versione precedente.
- Se una migrazione fallisce l'app non parte e il log dice perché; il database resta com'era prima del passo che ha fallito.

## Il volume dei dati

I dati degli utenti (il database) stanno in `/data` dentro il container. **Senza un volume, ricreando il container i dati si perdono.**

- **Volume nominato** (consigliato, come nell'esempio): al primo uso eredita il proprietario della cartella `/data` dell'immagine, che è l'utente non root del container. Non serve fare altro.
- **Cartella del server montata a mano** (`-v /srv/nuzlocke:/data`): la cartella deve essere scrivibile dall'utente `node` del container, che ha l'identificativo 1000. Prima di avviare: `sudo chown 1000:1000 /srv/nuzlocke`. Se la cartella appartiene a un altro utente, il database non si apre e l'app lo dice nel log all'avvio.

Il backup e il ripristino del volume sono descritti nella guida completa (P7-06).

## Controllo dello stato

L'immagine ha un controllo di salute: ogni 30 secondi chiede `/api/health` all'app e il container risulta `healthy` quando risponde. Per vederlo:

```sh
docker inspect --format '{{.State.Health.Status}}' nuzlocke
```

Il controllo risponde `ok` solo se anche il database risponde. Parte 10 secondi dopo l'avvio e dopo tre fallimenti consecutivi il container risulta `unhealthy`.

## Cosa contiene l'immagine

- Basata su `node:22-alpine`, costruita in più stadi: uno stadio su Debian (con git) genera il Pokédex, uno su Alpine compila l'app; lo stadio finale ha solo il risultato della build, le dipendenze di produzione e il file del Pokédex, senza strumenti di build.
- Gira con l'utente `node` (non root).
- Dimensione misurata il 22 ottobre 2026: 356 MB con il Pokédex (304 MB senza, 241 MB con il solo scheletro); crescerà con il Pokédex e le dipendenze ([prove](14-Prove-di-fattibilita.md#p1-17-prova-immagine-docker-multi-stage)).
