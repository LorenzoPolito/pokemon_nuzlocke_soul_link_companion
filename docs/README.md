# Nuzlocke SoulLink Companion – Pacchetto di progetto

Web app self-hosted (un container Docker) che accompagna le run Nuzlocke Soul Link di Pokémon, con Pokédex completo, più run e più giocatori per run. Stato al 3 ottobre 2026: requisiti, processo, design e modello dati definiti; sviluppo non ancora iniziato.

## Da dove partire

1. `01-documenti/markdown/01-Specifica-dei-requisiti.md` – cosa deve fare l'app e con quale stack.
2. `01-documenti/markdown/03-MVP-e-rilasci.md` – cosa entra nella prima versione (Pokémon Bianco, Nero, Bianco 2, Nero 2).
3. `01-documenti/markdown/04-Regole-di-lavoro.md` – come si lavora: sessioni, verifica locale, test, bug, stime.
4. `02-backlog/` – 96 PBI con dipendenze, taglia e criteri di accettazione; `02-Registro-sessioni.md` dice cosa è stato fatto.
5. `01-documenti/markdown/09-Mappa-degli-artefatti.md` – l'elenco di tutto ciò che il progetto produce e quando si aggiorna.

Primi PBI da avviare: P1-01, P1-04, P1-06, P1-07 sui quattro giochi di quinta generazione, con P1-19 in parallelo.

## Contenuto

| Cartella | Contenuto |
| --- | --- |
| `01-documenti/markdown` | I 9 documenti di progetto, modificabili. I diagrammi compaiono come segnaposto. |
| `01-documenti/pdf` | I 6 documenti che contengono diagrammi, con i diagrammi visibili. |
| `02-backlog` | Regole del backlog e Definition of Done, registro bug, registro sessioni, un file per ogni fase. |
| `03-design-system` | Token (colori chiari e scuri, tipografia, spazi, forme) in `tokens.json` e manuale di stile in `README.md`. |
| `04-mockup` | 49 schermate in 8 aree (`canvas.json` le organizza). Sono file del canvas di design di claude.ai: si leggono come HTML sorgente, ma si visualizzano correttamente solo nel canvas. |
| `05-fonti` | Regole Nuzlocke e Soul Link di riferimento. |

## Decisioni chiave

- Stack: SvelteKit (adapter Node), Drizzle con libSQL su file locale (Turso opzionale), Better Auth, Paraglide, @smogon/calc, SSE, Docker. Solo HTTP; HTTPS eventuale con reverse proxy esterno.
- Un solo gioco per run, uguale per tutti; regole comuni a tutti i giocatori, override per specie per giocatore.
- Lock consultivi con scadenza; se due giocatori salvano lo stesso dato vince l'ultimo, con avviso.
- Dupes clause per singolo giocatore, sull'intera linea evolutiva, morti compresi. Starter come incontro normale; regali, incontri fissi e scambi in gioco separati se la regola è attiva.
- Repository GitHub privato, senza CI: verifica locale con hook pre-push.
- Dati di progressione da nuzlocke.data (uso privato, rischio accettato); dati Pokémon da PokéAPI.

## Da sapere

- Il modello dati è una bozza anticipata: va confermato dopo P1-06, P1-07 e P1-19.
- Stime di token e tempi sono ipotesi iniziali, da ricalibrare dopo i primi 5 PBI.
- I documenti originali sono Claude Docs su claude.ai: questo pacchetto è una copia del 3 ottobre 2026. Chi continua il lavoro deve scegliere una sola fonte aggiornata (per esempio questi file nel repository) e mantenere solo quella.
