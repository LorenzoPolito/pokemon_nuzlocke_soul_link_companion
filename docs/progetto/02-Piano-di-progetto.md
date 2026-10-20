# Nuzlocke SoulLink Companion – Piano di progetto

Oct 3, 2026 · @Lorenzo

Dopo i requisiti (fase 0, completata) il progetto procede in 7 fasi; ogni fase produce documenti dedicati e si chiude con un gate. La fase 1, raccolta dati e analisi tecnica, è chiusa (gate 1 approvato il 20 ottobre 2026); la prossima è la 2, progettazione. Le durate delle fasi 2–7 sono stimate in [Stime delle fasi 2–7](#stime-delle-fasi-27-gate-1), come ipotesi da ricalibrare.

## Fasi

&#91;embedded content: roadmap · 7 fasi, 3 gate\]

Le fasi raggruppano il lavoro per tipo; non sono rilasci. Le funzioni arrivano a chi gioca un blocco alla volta, a partire dall'MVP 0.1, che usa parte delle fasi 1–4 e 7.

## Fase 1 – Raccolta dati e analisi tecnica

La fase 1 verifica che ogni dato e ogni libreria previsti dai requisiti esistano davvero, e decide come coprire le lacune.

Dati di gioco:

- [ ] Copertura di PokéAPI per generazione: specie, forme, statistiche, tipi, abilità, mosse, learnset, evoluzioni.
- [ ] Copertura degli incontri per area, gioco per gioco, con particolare attenzione a Gen 8 e Gen 9.
- [ ] Nomi localizzati in italiano e inglese per Pokémon, mosse, abilità e aree.
- [ ] Ordine di progressione delle aree per ogni gioco (PokéAPI non lo fornisce): fonte o inserimento manuale.
- [ ] Medaglie e level cap per ogni gioco: fonte e formato.
- [ ] Tabelle dei tipi e differenze di meccaniche per generazione (fisico/speciale, abilità, Teracristallizzazione).
- [ ] Licenze e condizioni d'uso di dati e sprite.

Stack tecnico (piccole prove di fattibilità):

- [ ] @smogon/calc con dati di specie personalizzati (override).
- [ ] Better Auth e Drizzle su libSQL, in locale e su Turso, con admin creato all'avvio.
- [ ] Paraglide con selettore di lingua sempre visibile.
- [ ] Pipeline di build: da PokeAPI/api-data al file SQLite del Pokédex, con dimensione risultante.
- [ ] Sync via SSE tra due browser sulla stessa run.
- [ ] Immagine Docker multi-stage: dimensione e tempo di avvio reali.

Gate di uscita: ogni dato ha una fonte o una decisione di inserimento manuale, ogni prova di fattibilità ha un esito, e le durate delle fasi successive sono stimate.

**Gate 1 approvato dal product owner il 20 ottobre 2026.**

## Stime delle fasi 2–7 (gate 1)

Stime del 20 ottobre 2026, ricavate dai PBI del backlog e dalla [tabella dei budget](04-Regole-di-lavoro.md) (XS: 5–15 min e 10–50k token; S: 15–45 min e 50–150k; M: 45–120 min e 150–400k). Sono **ipotesi non calibrate**: i token reali della fase 1 non sono stati misurati, quindi il confronto previsto dalla ricalibrazione non è ancora possibile. Il tempo è quello di lavoro dell'agente, senza le attese del product owner.

| Fase | PBI (XS / S / M) | Tempo agente | Token |
| --- | --- | --- | --- |
| 2 Progettazione | 14 (1 / 7 / 6) | 6–18 ore | 1,3–3,5 M |
| 3 Fondamenta | 13 (0 / 8 / 5) | 6–16 ore | 1,2–3,2 M |
| 4 Run e tracker | 21 (2 / 7 / 12) | 11–30 ore | 2,2–6,0 M |
| 5 Lotte e override | 14 (1 / 7 / 6) | 6–18 ore | 1,3–3,5 M |
| 6 Pokédex | 8 (1 / 4 / 3) | 3–9 ore | 0,7–1,9 M |
| 7 Test e rilascio | 7 (0 / 5 / 2) | 3–8 ore | 0,6–1,6 M |
| **Totale** | **77** | **35–98 ore** | **7,1–19,6 M** |

La fase 3 comprende P3-12, già iniziato. Le durate in calendario dipendono dal ritmo di lavoro e dalle verifiche del product owner, che non è nota: a titolo di esempio, con una sessione al giorno e 3–5 PBI per sessione la fase 2 richiederebbe 3–5 giorni di lavoro dell'agente, la fase 4 da 5 a 7, e il totale da circa 3 a 4 settimane, più le attese di verifica. Le durate si ricalibrano a ogni gate con i consumi reali; da ora la sessione di lavoro registra i token quando sono noti.

## Rischi emersi dalla fase 1 che toccano le fasi successive

- **Turso non verificato**: si prova in P3-03 ([ADR 0008](../adr/0008-esiti-della-fase-1.md)).
- **Registrazione aperta di base in Better Auth**, avvio dell'admin non atomico, blocco del cambio password da scrivere nell'app: criteri aggiunti a P3-07 e P3-08.
- **Compressione del reverse proxy** trattiene il flusso SSE: criterio in P3-13 e nella guida di installazione.
- **Permessi di `/data`** e apertura del database durante la build: criteri in P3-02 e P3-03.
- **SvelteKit 3** ha rimosso `$lib`: criterio in P3-01.
- **Fonti non verificabili**: aree e medaglie vengono da una sola fonte (nuzlocke.data), livelli facili di Superquattro e Ghetsis mancanti, storico delle categorie delle mosse non disponibile ([analisi](10-Analisi-delle-fonti-dati.md)).

## Documenti collegati

Le attività di ogni fase, con dipendenze, taglie e criteri di accettazione, sono nel [Product Backlog](../backlog/00-Backlog-regole-DoD-riepilogo.md). L'ordine in cui le funzioni arrivano a chi gioca è dato dai rilasci in [MVP e rilasci](03-MVP-e-rilasci.md).

L'elenco completo degli artefatti, con il momento in cui ciascuno si aggiorna, è nella [Mappa degli artefatti](09-Mappa-degli-artefatti.md); il modo di lavorare è nelle [Regole di lavoro](04-Regole-di-lavoro.md).
