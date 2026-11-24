# Nuzlocke SoulLink Companion

Web app self-hosted, in un unico container Docker, che accompagna le run Nuzlocke Soul Link di Pokémon: più run, più giocatori collegati per run, tracker di incontri, team, box, morti, medaglie e level cap, aiuto per le lotte e Pokédex completo.

**Stato**: fase 3 (fondamenta). Esiste lo scheletro SvelteKit (P3-01); le funzioni dell'app arrivano con i PBI successivi. La prima versione (0.1) supporterà Pokémon Bianco, Nero, Bianco 2 e Nero 2.

## Avvio rapido

Disponibile dal primo rilascio. L'app girerà in un solo container Docker, con il database su un volume in `/data`; la Guida di installazione nasce con i PBI P3-02, P3-08, P7-05 e P7-06 (vedi la [mappa degli artefatti](docs/progetto/09-Mappa-degli-artefatti.md)).

L'app parla solo HTTP: chi vuole HTTPS mette davanti un reverse proxy.

## Documentazione

Tutta la documentazione è in [`docs/`](docs/README.md) ed è l'unica fonte valida.

| Documento | Contenuto |
| --- | --- |
| [Specifica dei requisiti](docs/progetto/01-Specifica-dei-requisiti.md) | Cosa fa l'app e con quale stack |
| [MVP e rilasci](docs/progetto/03-MVP-e-rilasci.md) | Cosa entra nella 0.1 e nei rilasci successivi |
| [Regole di lavoro](docs/progetto/04-Regole-di-lavoro.md) | Sessioni, verifica locale, test, bug, stime |
| [Backlog](docs/backlog/00-Backlog-regole-DoD-riepilogo.md) | PBI per fase, registro bug, registro sessioni |
| [ADR](docs/adr/README.md) | Le decisioni prese, una ADR per decisione (le prime 26 nella [0001](docs/adr/0001-decisioni-di-progetto.md)) |
| [Mappa degli artefatti](docs/progetto/09-Mappa-degli-artefatti.md) | L'elenco di tutto ciò che il progetto produce |

Per contribuire: [`CONTRIBUTING.md`](CONTRIBUTING.md). Le istruzioni per l'agente sono in [`CLAUDE.md`](CLAUDE.md).

## Sviluppo

Stack: SvelteKit 3 con adapter Node, TypeScript strict, Drizzle su libSQL (file locale, Turso opzionale), Better Auth, Paraglide, @smogon/calc, Server-Sent Events. Servono Node 22 o successivo e npm.

```sh
npm install        # dipendenze
npm run dev        # server di sviluppo su http://localhost:5173
npm run check      # controllo dei tipi (svelte-check)
npm run lint       # Prettier (solo controllo), ESLint e controllo delle traduzioni
npm run format     # riformatta il codice
npm test           # test di unità (Vitest)
npm run i18n:check # controlla che italiano e inglese abbiano gli stessi messaggi
npm run tokens:build # rigenera src/lib/styles/tokens.css da docs/design-system/tokens.json
npm run build      # build di produzione in build/ (adapter Node)
npm run preview    # prova la build
npm run pokedex:fetch  # scarica i dati di PokeAPI/api-data (commit fissato in data/pokedex-source.json)
npm run pokedex:build  # genera data/pokedex/pokedex.sqlite (serve Node 22.18+)
npm run test:system   # smoke harness P7-02 (requires Chromium; install with npm run test:system:install)
```

Il codice sta in `src/`; i moduli seguono le [Linee guida di sviluppo](docs/progetto/05-Linee-guida-di-sviluppo.md). Gli import interni usano l'alias `#lib` (SvelteKit 3 ha rimosso `$lib`). `npm run verify` riunisce lint, tipi, test, build dell'app e dell'immagine (lo esegue anche l'hook pre-push). Lo stesso comando è eseguito dalla CI ospitata su ogni pull request verso `develop` o `main`; il workflow pubblica un riepilogo della verifica nella pull request.

### Browser QA prerequisite smoke

The repository-supported browser prerequisite is Playwright + Chromium. On a fresh checkout, run
`npm run pokedex:fetch && npm run pokedex:build`, then `npm run build`, install the browser with
`npm run test:system:install`, and run `npm run test:system`. The P7-02 prerequisite smoke launches
the production app, checks `/api/health`, loads a deterministic three-player fixture, and verifies
the browser offline/reconnect control. It does not claim product QA cases passed.

Dopo il clone, attiva l'hook pre-push versionato:

```sh
git config core.hooksPath .githooks
```

## Attribuzioni

Pokémon e i nomi di personaggi, mosse e luoghi sono marchi di Nintendo, Creatures e Game Freak. I dati dei Pokémon vengono da [PokéAPI](https://pokeapi.co/) (licenza BSD a 3 clausole). Progetto privato e non commerciale.
