# Nuzlocke SoulLink Companion – Piano di progetto

Oct 3, 2026 · @Lorenzo

Dopo i requisiti (fase 0, completata) il progetto procede in 7 fasi; ogni fase produce documenti dedicati e si chiude con un gate. La prossima fase è la 1, raccolta dati e analisi tecnica, che parte dai giochi Bianco, Nero, Bianco 2 e Nero 2. Le durate non sono ancora fissate e si stimano alla chiusura della fase 1.

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

## Documenti collegati

Le attività di ogni fase, con dipendenze, taglie e criteri di accettazione, sono nel Nuzlocke SoulLink Companion – Product Backlog. L'ordine in cui le funzioni arrivano a chi gioca è dato dai rilasci in Nuzlocke SoulLink Companion – MVP e rilasci.

L'elenco completo degli artefatti, con il momento in cui ciascuno si aggiorna, è nella Nuzlocke SoulLink Companion – Mappa degli artefatti; il modo di lavorare è nelle Nuzlocke SoulLink Companion – Regole di lavoro.
