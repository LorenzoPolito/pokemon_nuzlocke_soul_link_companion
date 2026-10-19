# Nuzlocke SoulLink Companion – Documentazione di progetto

Web app self-hosted (un container Docker) che accompagna le run Nuzlocke Soul Link di Pokémon, con Pokédex completo, più run e più giocatori per run. Stato al 3 ottobre 2026: requisiti, processo, design e modello dati definiti; sviluppo non ancora iniziato.

Dal 3 ottobre 2026 questa cartella è l'unica fonte valida della documentazione: le copie su claude.ai non si aggiornano più (decisione 21 nell'[ADR 0001](adr/0001-decisioni-di-progetto.md)).

## Da dove partire

1. [`progetto/01-Specifica-dei-requisiti.md`](progetto/01-Specifica-dei-requisiti.md) – cosa deve fare l'app e con quale stack.
2. [`progetto/03-MVP-e-rilasci.md`](progetto/03-MVP-e-rilasci.md) – cosa entra nella prima versione (Pokémon Bianco, Nero, Bianco 2, Nero 2).
3. [`progetto/04-Regole-di-lavoro.md`](progetto/04-Regole-di-lavoro.md) – come si lavora: sessioni, verifica locale, test, bug, stime.
4. [`backlog/`](backlog/) – 96 PBI con dipendenze, taglia e criteri di accettazione; [`backlog/02-Registro-sessioni.md`](backlog/02-Registro-sessioni.md) dice cosa è stato fatto.
5. [`progetto/09-Mappa-degli-artefatti.md`](progetto/09-Mappa-degli-artefatti.md) – l'elenco di tutto ciò che il progetto produce e quando si aggiorna.
6. [`adr/`](adr/README.md) – le decisioni prese, una ADR per decisione.

Primi PBI da avviare: P1-01, P1-04, P1-06, P1-07 sui quattro giochi di quinta generazione, con P1-19 in parallelo.

## Contenuto

| Cartella | Contenuto |
| --- | --- |
| [`progetto/`](progetto/) | I documenti di progetto, modificabili. I diagrammi compaiono come segnaposto. |
| [`progetto/pdf/`](progetto/pdf/) | I 6 documenti che contengono diagrammi, con i diagrammi visibili (copia del 3 ottobre 2026, non aggiornata). |
| [`backlog/`](backlog/) | Regole del backlog e Definition of Done, registro bug, registro sessioni, un file per ogni fase. |
| [`design-system/`](design-system/) | Token (colori chiari e scuri, tipografia, spazi, forme) in `tokens.json` e manuale di stile in `README.md`. |
| [`mockup/`](mockup/) | 49 schermate in 8 aree (`canvas.json` le organizza). Sono file del canvas di design di claude.ai: si leggono come HTML sorgente, ma si visualizzano correttamente solo nel canvas. |
| [`fonti/`](fonti/) | Regole Nuzlocke e Soul Link di riferimento. |
| [`adr/`](adr/README.md) | Le decisioni, una ADR per decisione; l'ADR 0001 raccoglie le prime 26. |

I dati di gioco (aree in ordine, medaglie, level cap) non stanno qui ma in `data/games/` alla radice del repository, con lo schema documentato in `progetto/` (nascono con P1-06 e P1-07).

## Decisioni chiave

Il dettaglio, con contesto e alternative, è nelle [ADR](adr/README.md).

- Stack: SvelteKit (adapter Node), Drizzle con libSQL su file locale (Turso opzionale), Better Auth, Paraglide, @smogon/calc, SSE, Docker. Solo HTTP; HTTPS eventuale con reverse proxy esterno.
- Un solo gioco per run, uguale per tutti; regole comuni a tutti i giocatori, override per specie per giocatore.
- Lock consultivi con scadenza; se due giocatori salvano lo stesso dato vince l'ultimo, con avviso.
- Dupes clause per singolo giocatore, sull'intera linea evolutiva, morti compresi. Starter come incontro normale; regali, incontri fissi e scambi in gioco separati se la regola è attiva.
- Repository GitHub privato, senza CI: verifica locale con hook pre-push. L'agente lavora tramite l'app Claude per GitHub.
- Dati di progressione da nuzlocke.data (uso privato, rischio accettato); dati Pokémon da PokéAPI.

## Da sapere

- Il modello dati è una bozza anticipata: va confermato dopo P1-06, P1-07 e P1-19.
- Stime di token e tempi sono ipotesi iniziali, da ricalibrare dopo i primi 5 PBI.
- I documenti originali erano Claude Docs su claude.ai; il pacchetto importato qui è la copia del 3 ottobre 2026. Da allora si aggiornano solo questi file. Fa eccezione il canvas dei mockup, che si visualizza ancora su claude.ai (link nella mappa degli artefatti).
