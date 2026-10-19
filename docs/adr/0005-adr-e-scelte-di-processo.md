# ADR 0005 – ADR e scelte di processo

- **Stato**: Accettata
- **Data**: 19 ottobre 2026
- **Decide**: product owner (risposte alle domande S-1…S-4 di [Domande aperte](../progetto/12-Domande-aperte.md))
- **PBI collegati**: P1-19, P3-01, P3-11, P2-08

## Contesto

Il registro delle decisioni era un unico file, `docs/decisioni.md`, mentre le Linee guida prevedevano una ADR per ogni scelta difficile da cambiare in `docs/adr/`. Sono emersi anche tre punti di processo: quando una dipendenza conta come completata per i PBI di sviluppo, come compensare l'assenza di Dependabot e cosa fare del diagramma di architettura che cita ancora Neon.

## Decisione

1. **ADR da ora in poi.** Si tiene un registro in `docs/adr/`: `decisioni.md` diventa l'[ADR 0001](0001-decisioni-di-progetto.md), un unico file con le prime 26 decisioni, e ogni decisione nuova è una ADR separata, secondo il modello e le regole di [`README.md`](README.md). Questa cartella è l'unico registro delle decisioni.
2. **Dipendenze dei PBI di sviluppo**: una dipendenza "In verifica" con la pull request unita su `develop` conta come completata per decidere se un PBI è avviabile.
3. **`npm audit`**: la verifica locale (`npm run verify`, P3-11) lo esegue con `--audit-level=high` come **avviso** che non blocca il push, e non fallisce se la rete manca.
4. **Diagramma di architettura**: corretto subito nella specifica, senza Neon ([decisione 2](0001-decisioni-di-progetto.md#2-database-libsql-su-file-locale-turso-opzionale)). I PDF restano copie storiche.

## Alternative scartate

- Tornare a un file per decisione anche per le prime 26.
- Richiedere "Completato" per le dipendenze, con una verifica del product owner dopo ogni PBI.
- Nessun controllo delle vulnerabilità dopo la rinuncia a Dependabot; `npm audit` che blocca il push.
- Rimandare il diagramma alla progettazione dell'architettura (P2-08).

## Conseguenze

- Tutti i riferimenti a `docs/decisioni.md` puntano ora all'ADR 0001; `CLAUDE.md`, le Regole di lavoro, le Linee guida, la mappa degli artefatti e CONTRIBUTING sono aggiornati.
- Le Linee guida non rimandano più le prime ADR a P3-01: sono già scritte.
- P3-11 riceve il criterio su `npm audit`.
- L'agente scrive una ADR in stato "Proposta" per ogni decisione che spetta al product owner, e la accetta solo con la sua risposta.
