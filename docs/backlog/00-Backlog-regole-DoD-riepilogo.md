# Nuzlocke SoulLink Companion – Product Backlog

Oct 3, 2026 · @Lorenzo

Il backlog divide il lavoro in PBI piccoli, ognuno con dipendenze esplicite e criteri di accettazione verificabili. Ogni fase del piano ha il suo file in `docs/backlog/`.

## Regole del backlog

Ogni PBI è un'attività piccola e verificabile, chiusa solo quando tutti i suoi criteri sono spuntati.

- **ID**: `P<fase>-<numero>`, per esempio P4-06. Non si riusa mai, nemmeno per un PBI cancellato.
- **Dipende da**: i PBI che devono essere completati prima. Un PBI senza dipendenze aperte è avviabile.
- **Parallelismo**: due PBI avviabili senza dipendenze tra loro si possono sviluppare in parallelo, anche tra fasi diverse (per esempio il motore dei tipi P5-05 può partire durante la fase 4).
- **Output**: il documento o la parte di app in cui il risultato viene registrato.
- **Criteri di accettazione**: il contratto di sviluppo del PBI. Ogni criterio è verificabile con un sì o un no.
- **Stato**: Da iniziare, In corso, In verifica, Completato. Lo si aggiorna nella tabella del file della fase, insieme alla taglia (XS, S, M) che fissa budget di token e tempo.
- **Modifiche**: un criterio cambiato dopo l'avvio del PBI si annota con data e motivo nel PBI stesso.

## Definition of Done

Oltre ai criteri propri, ogni PBI rispetta il contratto comune del suo tipo.

PBI di analisi e progettazione (fasi 1 e 2):

- [ ] Risultato scritto nel documento di output indicato, con le fonti consultate.
- [ ] Decisioni prese elencate con il loro motivo.
- [ ] Domande rimaste aperte elencate, ognuna con un PBI che la chiuderà.
- [ ] Mappa degli artefatti aggiornata se è nato o cambiato un artefatto.

PBI di sviluppo (fasi 3–7):

- [ ] Codice unito al ramo principale tramite pull request.
- [ ] Lint e controllo dei tipi senza errori.
- [ ] Test automatici per la logica introdotta, tutti verdi nella verifica locale (npm run verify).
- [ ] Nessun testo dell'interfaccia scritto nel codice: tutti i testi tradotti in italiano e inglese.
- [ ] Funziona nel container Docker con database locale e su schermo da telefono (larghezza 360 px).
- [ ] Documenti di riferimento e Registro sessioni aggiornati.

## Riepilogo

Il backlog conta 96 PBI, stimati tra 8,5 e 24 milioni di token e tra 42 e 119 ore di lavoro dell'agente. Sono ipotesi iniziali, ricavate dalle taglie delle [Regole di lavoro](../progetto/04-Regole-di-lavoro.md) e da ricalibrare a ogni gate. Dopo la fase 3, i filoni Run e tracker (fase 4), motore dei tipi (fase 5) e Pokédex (fase 6) possono procedere in parallelo.

| Fase | PBI | Avviabili subito | XS / S / M | Token (milioni) | Tempo agente (ore) | Dettaglio |
| --- | --- | --- | --- | --- | --- | --- |
| 1 – Raccolta dati e analisi | 19 | 9 | 2 / 11 / 6 | 1,5–4,2 | 7–21 | Fase 1 – Analisi |
| 2 – Progettazione | 14 | 0 | 1 / 7 / 6 | 1,3–3,5 | 6–18 | Fase 2 – Progettazione |
| 3 – Fondamenta | 13 | 1 | 0 / 8 / 5 | 1,2–3,2 | 6–16 | Fase 3 – Fondamenta |
| 4 – Run e tracker | 21 | 0 | 2 / 7 / 12 | 2,2–6,0 | 11–30 | Fase 4 – Run e tracker |
| 5 – Lotte e override | 14 | 0 | 1 / 7 / 6 | 1,3–3,5 | 6–18 | Fase 5 – Lotte e override |
| 6 – Pokédex | 8 | 0 | 1 / 4 / 3 | 0,7–1,9 | 3–9 | Fase 6 – Pokédex |
| 7 – Test e rilascio | 7 | 0 | 0 / 5 / 2 | 0,6–1,6 | 3–8 | Fase 7 – Test e rilascio |
| **Totale** | **96** | **10** | **7 / 49 / 40** | **8,5–23,7** | **42–119** |  |

Quali PBI entrano in ogni rilascio, a partire dall'MVP, è deciso in [MVP e rilasci](../progetto/03-MVP-e-rilasci.md).

Fasi e gate sono descritti nel [Piano di progetto](../progetto/02-Piano-di-progetto.md).
