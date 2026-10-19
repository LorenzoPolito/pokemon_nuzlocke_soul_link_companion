# Nuzlocke SoulLink Companion

Web app self-hosted, in un unico container Docker, che accompagna le run Nuzlocke Soul Link di Pokémon: più run, più giocatori collegati per run, tracker di incontri, team, box, morti, medaglie e level cap, aiuto per le lotte e Pokédex completo.

**Stato**: fase 1 (raccolta dati e analisi tecnica). Il codice dell'app non esiste ancora: arriva con P3-01. La prima versione (0.1) supporterà Pokémon Bianco, Nero, Bianco 2 e Nero 2.

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

Stack: SvelteKit con adapter Node, TypeScript strict, Drizzle su libSQL (file locale, Turso opzionale), Better Auth, Paraglide, @smogon/calc, Server-Sent Events. Comandi di sviluppo e test: da completare in P3-01.

Dopo il clone, attiva l'hook pre-push versionato:

```sh
git config core.hooksPath .githooks
```

## Attribuzioni

Pokémon e i nomi di personaggi, mosse e luoghi sono marchi di Nintendo, Creatures e Game Freak. I dati dei Pokémon vengono da [PokéAPI](https://pokeapi.co/) (licenza BSD a 3 clausole). Progetto privato e non commerciale.
