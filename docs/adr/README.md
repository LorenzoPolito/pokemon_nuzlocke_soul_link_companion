# ADR – Architecture Decision Records

Le decisioni di progetto sono registrate qui, una ADR per ogni scelta difficile da cambiare ([Linee guida di sviluppo](../progetto/05-Linee-guida-di-sviluppo.md#documentazione-nel-codice), [ADR 0005](0005-adr-e-scelte-di-processo.md)). Una pull request che prende o cambia una decisione include la sua ADR.

## Indice

| ADR | Titolo | Stato | Data |
| --- | --- | --- | --- |
| [0001](0001-decisioni-di-progetto.md) | Decisioni di progetto 1–26 (registro iniziale, un unico file) | Accettata | 3 e 19 ottobre 2026 |
| [0002](0002-rete-instabile.md) | Comportamento con rete instabile durante la partita | Accettata | 19 ottobre 2026 |
| [0003](0003-giochi-aree-e-impostazioni-della-run.md) | Giochi, aree, tappe e impostazioni della run | Accettata | 19 ottobre 2026 |
| [0004](0004-fonti-dei-dati-nomi-e-giochi-per-rilascio.md) | Fonti dei dati, nomi e giochi per rilascio | Accettata | 19 ottobre 2026 |
| [0005](0005-adr-e-scelte-di-processo.md) | ADR e scelte di processo | Accettata | 19 ottobre 2026 |

## Regole

- **File**: `NNNN-titolo-in-kebab-case.md`, numero progressivo a quattro cifre che non si riusa.
- **Chi decide**: il product owner. L'agente prepara la ADR con la proposta (stato "Proposta") e la porta ad "Accettata" solo con la sua risposta.
- **Stati**: Proposta, Accettata, Sostituita da ADR NNNN, Rifiutata.
- **Non si riscrive**: una ADR accettata non cambia nella sostanza. Una decisione cambiata è una ADR nuova che sostituisce la vecchia, la cui riga di stato diventa "Sostituita da ADR NNNN"; correzioni di forma e link sono sempre ammesse.
- **Una ADR per tema**: le scelte che si prendono insieme e si cambiano insieme stanno nello stesso file, con una sezione numerata per ognuna.
- **Nei documenti**: si cita come "ADR 0002"; "decisione N" indica la voce N dell'[ADR 0001](0001-decisioni-di-progetto.md).
- **Indice**: questa tabella si aggiorna nella stessa pull request che aggiunge la ADR, insieme alla [mappa degli artefatti](../progetto/09-Mappa-degli-artefatti.md) se serve.

## Modello

```markdown
# ADR NNNN – Titolo

- **Stato**: Proposta | Accettata | Sostituita da ADR NNNN | Rifiutata
- **Data**: giorno mese anno
- **Decide**: product owner
- **PBI collegati**: …

## Contesto

Cosa ha portato alla decisione, con i riferimenti ai documenti e ai PBI.

## Decisione

Cosa si fa. Se i punti sono più d'uno, una sezione numerata per ognuno.

## Alternative scartate

Cosa si è valutato e perché no; "non documentato" se non lo sappiamo.

## Conseguenze

Cosa cambia: documenti, dati, PBI, rischi, punti ancora aperti.
```
