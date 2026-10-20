# Nuzlocke SoulLink Companion – Prove di fattibilità dello stack

Documento di output di P1-11…P1-17. Ogni prova ha una sezione, aggiunta quando il PBI si chiude. Le prove girano fuori dal repository (cartella di lavoro dell'agente) e qui restano il metodo, le misure e l'esito; il codice di produzione nasce in fase 3.

## P1-11 Prova: @smogon/calc con override

Data: 20 ottobre 2026. Taglia S. Esito: **fattibile**.

### Metodo

`@smogon/calc` 0.12.0 (MIT) installato con `npm i --ignore-scripts` in una cartella vuota, con Node 22. La prova costruisce Pokémon e mosse con le opzioni `overrides` e confronta il danno con e senza override, nelle generazioni 3, 5 e 8.

- Pokémon: `new Pokemon(gen, 'Snorlax', { level: 50, overrides: { types: [...], baseStats: { hp, atk, def, spa, spd, spe } } })`. Le chiavi delle statistiche sono `hp, atk, def, spa, spd, spe`: con le chiavi sbagliate (`at`, `df`, …) l'override viene ignorato senza errore.
- Mosse: `new Move(gen, 'Surf', { overrides: { type: 'Ice' } })`.

### Esiti

| Prova | Generazione | Senza override | Con override |
| --- | --- | --- | --- |
| Surf di Vaporeon su Snorlax; Snorlax diventa tipo Fuoco | 3 | 54–64 | 108–128 |
| come sopra | 5 | 54–64 | 108–128 |
| come sopra | 8 | 51–61 | 102–122 |
| Snorlax con PS base 200 e Dif. Sp. base 250 (PS reali 275, Dif. Sp. 270) | 3 | 54–64 | 28–33 |
| come sopra | 5 | 54–64 | 27–33 |
| come sopra | 8 | 51–61 | 25–31 |
| Surf con tipo cambiato in Ghiaccio su Dragonite | 5 | 29–35 | 156–188 |

I danni cambiano nella direzione attesa (Acqua contro Fuoco è superefficace; più difese, meno danno; Ghiaccio contro Drago/Volante è ×4).

### Verifica delle abilità (P1-09)

Danno di Surf o Tuono su un Pokémon con l'abilità, attaccante con Pressione (altrimenti l'abilità dell'attaccante, per esempio Teravolt di Zekrom, ignora quella del bersaglio):

| Abilità | Gen. 3 | Gen. 4 | Gen. 5 | Gen. 8 |
| --- | --- | --- | --- | --- |
| Parafulmine contro Tuono | 119–140 | 116–140 | 0 | 0 |
| Acquascolo contro Surf | 22–26 | 21–26 | 0 | 0 |

Confermato: **Parafulmine e Acquascolo danno immunità dalla quinta generazione**, prima attirano soltanto. Raccolto e Levitazione danno 0 già in gen. 5. Una trappola da ricordare nei test: se l'attaccante ha Rompiforma, Teravolt o Turbofiamma, le abilità difensive non agiscono.

### Dimensione

Pacchetto npm: 4,4 MB su disco (comprende sorgenti, dist e bundle). Bundle `esbuild --bundle --minify` dell'API completa (`calculate`, `Generations`, `Pokemon`, `Move`): 504 KB, **117 KB compressi con gzip**. Se il calcolo gira sul server, la dimensione non pesa sul client; se gira nel browser è accettabile ma non trascurabile: con tree-shaking limitato alle generazioni usate dall'MVP (solo la 5) sarebbe più piccolo, da misurare in fase 5 se serve.

### Decisioni prese

- Gli override di tipo e statistiche di `@smogon/calc` bastano per rappresentare le regole della run (tipi e statistiche modificati): nessuna alternativa da valutare.
- Il modulo `battle` converte i dati di PokéAPI nelle `overrides` con le chiavi `hp, atk, def, spa, spd, spe`; un test di unità verifica che un override cambi davvero il risultato, perché le chiavi sbagliate non danno errore.
- Nei test sulle abilità difensive l'attaccante ha un'abilità neutra.

### Domande aperte

Nessuna. Dove gira il calcolo (server o browser) si decide in fase 2 con l'architettura.

## P1-12 Prova: Drizzle e libSQL, locale e Turso

Data: 20 ottobre 2026. Taglia S. Esito: **fattibile in locale; la parte Turso non è verificata** (rete bloccata) e, per decisione del product owner ([ADR 0008](../adr/0008-esiti-della-fase-1.md)), si verifica in P3-03.

### Metodo

`drizzle-orm` 0.45.4, `drizzle-kit` 0.31.11, `@libsql/client` 0.18.0, Node 22, in una cartella vuota. Uno schema di una tabella (`run`), migrazioni generate con `drizzle-kit generate`, applicate all'avvio con `migrate()` di `drizzle-orm/libsql/migrator`. L'unico punto che dipende dall'ambiente è l'apertura del database:

```ts
const url = process.env.DATABASE_URL ?? 'file:./data/app.db';
const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
if (url.startsWith('file:')) {
  await client.execute('PRAGMA journal_mode = WAL');
  await client.execute('PRAGMA foreign_keys = ON');
}
const db = drizzle(client, { schema });
await migrate(db, { migrationsFolder: './drizzle' });
```

### Esiti in locale

| Passo | Esito |
| --- | --- |
| Prima migrazione generata e primo avvio | Tabella creata, 1 riga scritta, `journal_mode` = `wal`, 1 migrazione registrata |
| Riavvio senza nuove migrazioni | La migrazione non si riapplica (resta 1); i dati restano (2 righe) |
| Nuova colonna, seconda migrazione, avvio | La migrazione si applica all'avvio (2 registrate); i dati restano |

Le migrazioni sono solo in avanti: `migrate()` applica solo quelle nuove e non ne esiste una di ritorno.

### Turso: non verificato

Da questo ambiente `turso.tech` risponde 403 dal proxy e un URL `libsql://…` fallisce con `fetch failed`. Il codice è lo stesso, cambia solo `DATABASE_URL` (e `DATABASE_AUTH_TOKEN`), ma **non l'ho visto funzionare**: il criterio resta aperto. Per chiuderlo serve un database Turso di prova, il suo token come segreto dell'ambiente (mai in chat o nel repository) e il permesso di rete verso `*.turso.io` (vedi la documentazione dell'ambiente, pagina "environment.network").

### Decisioni prese

- Un solo punto di apertura del database, scelto da `DATABASE_URL`; WAL e chiavi esterne si impostano solo per i file locali.
- Migrazioni generate con `drizzle-kit generate` e committate; applicate all'avvio con il migratore di Drizzle.

### Domande aperte

Nessuna per la fase 1. In P3-03: un database Turso di prova e l'accesso di rete. Le variabili d'ambiente del progetto sono `TURSO_URL` e `TURSO_TOKEN` (P3-03); la prova usava `DATABASE_URL` e `DATABASE_AUTH_TOKEN`.

## P1-14 Prova: Paraglide con cambio lingua

Data: 20 ottobre 2026. Taglia XS. Esito: **cambio lingua e memoria fattibili; nel browser arrivano entrambe le lingue, accettato** ([ADR 0008](../adr/0008-esiti-della-fase-1.md)).

### Metodo

Progetto SvelteKit 3 minimo con adapter Node, `@inlang/paraglide-js` 2.29.1, Vite 8, Svelte 5, Node 22. Messaggi in `messages/it.json` e `messages/en.json` (italiano come lingua di base). Strategia di lingua `['cookie', 'baseLocale']`: nessuna lingua nell'URL, quindi la schermata corrente non cambia. Il middleware `paraglideMiddleware` è in `hooks.server.ts`; l'attributo `lang` dell'HTML è impostato dal server. Prova automatica con Chromium (Playwright) contro la build di produzione.

### Esiti

| Criterio | Esito |
| --- | --- |
| Cambio tra italiano e inglese con una ricarica che mantiene la schermata | **Sì**: da `/run` il pulsante EN ricarica e resta su `/run`, testi e `<html lang>` passano a inglese |
| Lingua ricordata tra le sessioni | **Sì** con un cookie: una nuova scheda dello stesso browser parte in inglese; un browser nuovo parte in italiano (lingua di base) |
| Nel browser arriva solo la lingua in uso | **No**: la build mette italiano e inglese nello stesso file JavaScript del client (3,2 KB per due messaggi con due lingue) |

### Cosa è emerso

- Paraglide include tutte le lingue di ogni messaggio usato da una pagina; elimina i messaggi non usati, non le lingue non usate. Con N messaggi e due lingue il peso dei testi raddoppia, ma resta testo: per un'app con alcune centinaia di messaggi sono decine di KB.
- Il file di progetto di Paraglide carica per impostazione predefinita il plugin dei messaggi da una CDN (`cdn.jsdelivr.net`), non raggiungibile da questo ambiente e fragile per una build in Docker. Si risolve installando `@inlang/plugin-message-format` da npm e puntando a `./node_modules/...` nelle impostazioni.
- SvelteKit 3 ha rimosso l'alias `$lib`: si usa `#lib` (campo `imports` di `package.json`) o si ripristina l'alias. In SvelteKit 3 l'adapter si passa a `sveltekit({ adapter })` in `vite.config.ts`. Va ricordato in P3-01.
- Il cookie di lingua permette anche un cambio di lingua per giocatore senza toccare il database; se si vuole la lingua sul profilo, si imposta il cookie al login.

### Decisioni prese

- Strategia `cookie` poi lingua di base, senza lingua nell'URL.
- Plugin dei messaggi installato da npm, nessuna dipendenza da CDN in build.
- `#lib` al posto di `$lib` nel progetto reale.

### Domande aperte

Nessuna: il product owner ha accettato che il client riceva entrambe le lingue ([ADR 0008](../adr/0008-esiti-della-fase-1.md)).

## P1-16 Prova: sync SSE tra due browser

Data: 20 ottobre 2026. Taglia S. Esito: **fattibile; un solo punto di attenzione sul reverse proxy (compressione)**.

### Metodo

Progetto SvelteKit 3 con adapter Node (stesso della P1-14), Node 22.

- `GET /api/stream`: risposta `text/event-stream` da un `ReadableStream`. Ogni evento ha `id` crescente; all'apertura il server legge l'intestazione `Last-Event-ID` e rinvia gli eventi con id maggiore; `retry: 1000`; un commento `: ping` ogni 15 secondi ([ADR 0002](../adr/0002-rete-instabile.md)); intestazioni `cache-control: no-cache, no-transform` e `x-accel-buffering: no`.
- `POST /api/events`: aggiunge un evento a un registro in memoria e lo invia agli abbonati.
- Pagina: `EventSource` che mostra stato (aperto o riconnessione) e l'elenco degli eventi.
- Prova automatica con due contesti Chromium (due browser distinti, Playwright) contro la build di produzione. Per simulare la perdita di rete: il server chiude i flussi (`/api/drop`) e le richieste a `/api/stream` del browser A vengono bloccate mentre B invia due eventi.
- Reverse proxy: nginx 1.24 davanti all'app.

### Esiti

| Criterio | Esito |
| --- | --- |
| Una modifica in un browser compare nell'altro senza ricaricare | **Sì**: circa 100 ms dal clic di B alla comparsa in A |
| Riconnessione automatica dopo la perdita di connessione | **Sì**: A passa a "riconnessione" e, tornata la rete, riapre il flusso da solo (`retry` di 1 s) |
| Al ritorno si recuperano gli eventi mancanti | **Sì**: A riceve gli id 2 e 3, persi durante l'interruzione, grazie a `Last-Event-ID`; nessun duplicato |
| Il reverse proxy non memorizza in blocco le risposte | **Sì con una condizione**, sotto |

### Reverse proxy

Prove con nginx davanti all'app:

| Configurazione | Esito |
| --- | --- |
| nginx predefinito, `proxy_http_version 1.1` e `Connection ""` | Gli eventi arrivano subito |
| come sopra, ignorando `X-Accel-Buffering` e con `proxy_buffering on` | Gli eventi arrivano comunque subito (messaggi piccoli) |
| `gzip on` con `gzip_types text/event-stream` e client che accetta gzip | **Nessun byte in 4 secondi**: la compressione trattiene il flusso |
| come sopra, ma `gzip off` sulla `location /api/stream` | Gli eventi arrivano subito |

Il punto da ricordare nella guida di installazione: **la compressione del proxy deve essere spenta per il flusso degli eventi**. L'app manda già `x-accel-buffering: no` e `no-transform`, che sono sufficienti per nginx senza compressione; il registro del proxy non basta se qualcuno accende `gzip` per tutti i tipi.

### Limiti della prova

- Il registro degli eventi era in memoria: nell'app vera, per ripristinare dopo un riavvio del server, serve il registro nel database ([ADR 0002](../adr/0002-rete-instabile.md): recupero degli eventi).
- Il segnale ogni 15 s e la dichiarazione di "persa dopo 40 s" sono scritti nel server ma non misurati qui: il test usa la chiusura del flusso, non un silenzio di 40 s.
- Provato solo nginx; Caddy e Traefik non sono stati provati.
- Con N giocatori (non solo 2) e con la scadenza dei lock non è stata fatta nessuna prova di carico.

### Decisioni prese

- Flusso SSE nativo di SvelteKit (`ReadableStream` in un endpoint), senza libreria.
- `id` e `Last-Event-ID` per il recupero, `retry` di 1 s, commento di segnale ogni 15 s.
- Intestazioni `cache-control: no-cache, no-transform` e `x-accel-buffering: no` sempre presenti.
- La guida di installazione (P3-02) dirà di non comprimere `/api/stream` nel proxy.

### Domande aperte

Nessuna.

## P1-13 Prova: Better Auth con admin da variabili d'ambiente

Data: 20 ottobre 2026. Taglia S. Esito: **fattibile**, con tre punti da progettare in fase 3.

### Metodo

`better-auth` 1.7.12 con il plugin `admin`, adapter Drizzle su libSQL (file locale, stessa apertura della P1-12), Node 22. Una colonna aggiuntiva `mustChangePassword` sull'utente (`additionalFields`, `input: false`, così un cliente non può impostarla). Lo script di prova chiama l'API del server (`auth.api.*`) senza passare da HTTP. All'avvio: migrazioni, poi creazione dell'admin se non esiste già un utente con ruolo `admin`.

### Esiti

| Criterio | Esito |
| --- | --- |
| Registrazione e login su libSQL | **Sì**: registrazione di un giocatore, login, sessione con ruolo `user`; password errata rifiutata |
| Admin creato al primo avvio da `ADMIN_EMAIL` e `ADMIN_PASSWORD`, non ricreato ai riavvii | **Sì**: primo avvio `created: true`; riavvio e avvio dopo il cambio password `created: false`; un solo admin nel database |
| Cambio password obbligatorio al primo accesso | **Sì**: l'admin ha `mustChangePassword = true`; finché è vero una verifica lato server rifiuta ogni richiesta; dopo il cambio il flag è spento, la vecchia password non funziona più e la nuova sì |

### Cosa è emerso

1. **Il cancello del cambio password è codice dell'app, non una funzione di Better Auth.** Nella prova è una funzione che guarda il flag della sessione; nell'app vera va in `hooks.server.ts` e in ogni endpoint, con un'eccezione per la pagina e l'endpoint di cambio password. Va coperto da un test di sistema (P3).
2. **L'avvio non è atomico.** Registrazione e promozione ad admin sono due passi: se il processo cade in mezzo, resta un utente senza ruolo e il riavvio tenterebbe di registrare di nuovo la stessa email. Nell'app vera: cercare l'utente per email, non per ruolo, e completare il passo mancante.
3. **Il flag si spegne con un aggiornamento diretto del database** dopo il cambio password. Meglio un hook di Better Auth sul cambio password, così non si può dimenticare.
4. **La registrazione è aperta per impostazione predefinita**: chiunque raggiunga l'app può creare un utente. La modalità (aperta, su invito, chiusa) è già richiesta da P3-07: il blocco va messo nell'app, sopra Better Auth.
5. **Il generatore di schema (`@better-auth/cli`) non si installa** insieme a `better-auth` 1.7.12 (versione 1.4.21 del CLI, conflitto di dipendenze di npm). Lo schema delle quattro tabelle (`user`, `session`, `account`, `verification`, più i campi del plugin admin) l'ho scritto a mano per Drizzle; l'adapter ha funzionato. Va ricontrollato a ogni aggiornamento di Better Auth.
6. Better Auth registra un avviso sul log a ogni password errata (`Invalid password`): utile, da non spegnere.

### Decisioni prese

- Better Auth con adapter Drizzle e plugin `admin`; ruolo e flag `mustChangePassword` nelle colonne dell'utente.
- Admin creato all'avvio solo se manca, cercandolo per email.
- Cancello del cambio password nel server dell'app, con test di sistema.

### Domande aperte

Nessuna: la modalità di registrazione è già nei criteri di P3-07.

## P1-17 Prova: immagine Docker multi-stage

Data: 20 ottobre 2026. Taglia S. Esito: **fattibile**; due trappole da ricordare nel Dockerfile vero.

### Metodo

Applicazione SvelteKit 3 con adapter Node, Drizzle e libSQL su `file:/data/app.db`, migrazioni all'avvio e un endpoint `/api/health` che registra un avvio e li conta. Dockerfile a due stadi su `node:22-alpine` (Docker 29.8): lo stadio di build fa `npm ci`, `npm run build` e `npm prune --omit=dev`; lo stadio finale copia solo `build/`, `node_modules/` di produzione e le migrazioni, gira come utente `node` e dichiara `VOLUME /data`. Le misure sono del 20 ottobre 2026 su questa macchina di lavoro. Per costruire dentro questo ambiente servono `--network host` e il certificato del proxy, che stanno nello stadio di build e non nell'immagine finale; sul server del PO non servono.

### Esiti

| Criterio | Misura |
| --- | --- |
| Dimensione dell'immagine | **300 MB**, di cui 237,5 MB la base `node:22-alpine`; l'app aggiunge circa 63 MB (`node_modules` di produzione 47 MB, `build` 1,9 MB; il grosso è `@libsql` 20 MB e `drizzle-orm` 17 MB) |
| Avvio a freddo | **0,8–0,9 s** dal `docker run` alla prima risposta HTTP, con la migrazione applicata |
| Database su volume sopravvive alla ricreazione del contenitore | **Sì**: dopo aver cancellato e ricreato il contenitore con lo stesso volume, il contatore degli avvii passa da 1 a 2 |

Il Pokédex SQLite (P1-15) e i dati di gioco si aggiungeranno all'immagine: la dimensione finale va rimisurata in P3-11.

### Due trappole

1. **Permessi del volume.** Con `USER node` e un volume nominato nuovo il database non si apre (`Unable to open connection to local database /data/app.db: 14`, cioè `SQLITE_CANTOPEN`): `/data` è di root. Si risolve creando la cartella con il proprietario giusto *prima* di `VOLUME` (`RUN mkdir /data && chown node:node /data`); un volume nominato eredita il proprietario alla prima creazione. Chi monta una cartella dell'host (bind mount) deve invece dare i permessi a mano: va scritto nella guida di installazione.
2. **La build di SvelteKit importa i moduli del server.** Se il database si apre appena il modulo viene caricato, `npm run build` fallisce nello stadio di build (non c'è `/data`). L'apertura va rinviata quando `building` (da `$app/environment`) è vero.

### Decisioni prese

- Immagine a due stadi su `node:22-alpine`, utente `node`, `VOLUME /data` creato con il proprietario giusto.
- Il database si apre e migra solo a runtime, mai durante la build.
- Alpine (musl) funziona con `@libsql/client`: non serve passare a Debian. Non ho misurato la variante `-slim`.

### Domande aperte

Nessuna.

## P1-15 Prova: build del Pokédex SQLite

Data: 20 ottobre 2026. Taglia M. Esito: **fattibile**.

### Metodo

Lo script di prova [`tools/prove/build_pokedex.py`](../../tools/prove/build_pokedex.py) (Python 3, solo libreria standard) legge i file JSON di [PokeAPI/api-data](https://github.com/PokeAPI/api-data) (commit `447bd5c`, 20 ottobre 2026) e scrive un file SQLite. Il repository si prende con un clone parziale: `git clone --depth 1 --filter=blob:none --sparse` e `git sparse-checkout set` sulle cartelle `pokemon`, `pokemon-species`, `move`, `ability`, `type` di `data/api/v2` (399 MB di JSON, 5 secondi). Lo script è solo di prova: lo script vero nasce in fase 3, in TypeScript come il resto del progetto.

Contenuto del file: tipi, abilità, mosse, specie e varietà con i nomi in italiano e in inglese; tipi e statistiche di ogni varietà con lo storico (colonna `until_generation`, 99 per i valori attuali, con la convenzione "ultima generazione con i valori vecchi" di P1-02); abilità per slot; learnset per version group (638 321 righe). Nomi con indice senza distinzione tra maiuscole e minuscole.

### Esiti

| Criterio | Misura |
| --- | --- |
| Script che genera il file SQLite da PokeAPI/api-data | Fatto: 4,7 s di generazione, 5 s di clone parziale |
| Dimensione del file | **40,8 MB** (9,3 MB compresso con gzip); 638 321 righe di learnset ne sono il grosso |
| Tempo di build | **circa 10 s** in tutto (clone più generazione), senza contare l'installazione delle dipendenze |
| Ricerca per nome | Nome esatto 0,008 ms in media (p99 0,04 ms); prefisso di 3 lettere 0,019 ms (p99 0,06 ms); "contiene" 0,17 ms (p99 0,37 ms). Learnset di un Pokémon per un gioco: 0,06 ms (p99 0,14 ms). Misure con la libreria SQLite di Python su 2 000 interrogazioni, file in sola lettura |

### Controlli di coerenza

- Conteggi uguali a quelli di P1-02 e P1-03: 1 025 specie, 1 351 varietà, 937 mosse, 374 abilità; le righe di learnset (638 321) coincidono con quelle del CSV di PokéAPI usato in P1-03 (638 322 righe meno l'intestazione).
- Storico dei tipi: Clefairy ha Normale fino alla quinta generazione e Folletto dopo (riga con `until_generation` 5 e riga a 99), come previsto dalla convenzione.
- Nomi: Megapugno / Mega Punch per la mossa 5.

### Limiti

- Le ricerche sono state misurate con Python, non con `@libsql/client` di Node: l'ordine di grandezza dovrebbe essere lo stesso, ma non l'ho misurato.
- Non ci sono: evoluzioni, incontri, macchine, tabelle dei tipi, forme, flavor text, nomi di aree. Aggiungerli aumenta le dimensioni, ma di poco rispetto al learnset.
- Le ricerche "contiene" con `LIKE '%x%'` non usano l'indice: sono veloci solo perché le tabelle dei nomi sono piccole (2 050 righe).
- Le specie senza nome italiano in PokéAPI hanno solo la riga inglese (regola di riserva di P1-05, applicata in lettura).

### Decisioni prese

- Il file si genera in build da `PokeAPI/api-data` con clone parziale; la versione (commit) dei dati sta in un file nel repository e si aggiorna a mano.
- Lo storico di tipi e statistiche è salvato come righe con `until_generation`, non come JSON.
- Il learnset si conserva per version group, con le chiavi di PokéAPI.

### Domande aperte

Nessuna.
