# ADR 0004 – Fonti dei dati, nomi e giochi per rilascio

- **Stato**: Accettata
- **Data**: 19 ottobre 2026
- **Decide**: product owner (risposte alle domande D-8…D-12 di [Domande aperte](../progetto/12-Domande-aperte.md))
- **PBI collegati**: P1-01, P1-04, P1-05, P1-06, P1-18, P2-12, P6-07

## Contesto

PokéAPI non ha nomi italiani delle località di Unima, non ha incontri per diversi giochi di ottava e nona generazione e non ha gli sciami di Nero e Bianco. Inoltre il rilascio dei giochi oltre la quinta generazione era solo proposto in P1-01.

## Decisione

1. **Nomi di aree e medaglie in inglese nell'MVP.** I nomi italiani restano vuoti nei dati e l'app usa l'inglese come riserva. Non si adotta la regola "Route N" → "Percorso N". I nomi di Pokémon, mosse e abilità restano localizzati da PokéAPI.
2. **Giochi per rilascio.** Rilascio **0.5**: i 17 giochi per cui nuzlocke.data ha già aree e boss (Rossa e Blu, Gialla, Oro e Argento, Cristallo, Rubino e Zaffiro, Smeraldo, Rosso Fuoco e Verde Foglia, Diamante e Perla, Platino, HeartGold e SoulSilver, X e Y, Rubino Omega e Zaffiro Alpha, Sole e Luna, Ultrasole e Ultraluna, Spada e Scudo, Diamante Lucente e Perla Splendente, Scarlatto e Violetto). Rilascio **1.0**: Let's Go, Leggende: Arceus e Leggende: Z-A, compilati a mano e con la regola delle tappe al posto delle palestre. Le espansioni sono aree in coda al gioco base.
3. **Incontri di ottava e nona generazione.** Per Diamante Lucente, Perla Splendente, Scarlatto e Violetto si usa nuzlocke.data; per i Leggende nessun suggerimento, la specie si sceglie dal Pokédex.
4. **Sciami e White Forest (Nero e Bianco)**: si usano le specie di nuzlocke.data, segnate come **non verificate**. Il livello dei 5 scambi di Nero e Bianco resta vuoto.
5. **Colore della run per ogni gioco**: lo sceglie il design, con la progettazione delle schermate (P2-12).

## Alternative scartate

- Regola "Percorso N" con inglese per le altre aree.
- Escludere Let's Go e i due Leggende; trattare le espansioni come giochi separati.
- Inserimento a mano di tutti gli incontri di ottava e nona generazione.
- Nessun suggerimento per sciami e White Forest finché non c'è una fonte verificata.
- Colore di ogni gioco scelto dal product owner subito.

## Conseguenze

- Schema dei file di gioco: campo `additionalSpecies` per le specie che nuzlocke.data elenca e PokéAPI non ha, con la fonte e l'avvertenza "non verificato". Per Nero e Bianco copre gli sciami probabili e White Forest (solo Bianco). Può contenere anche specie incontrabili solo in modo non standard: non si ripulisce finché non c'è una terza fonte.
- Il rischio sulla correttezza dei suggerimenti resta ([Rischi tecnici](../progetto/07-Rischi-tecnici-e-fonti-dei-dati.md)): sono suggerimenti, e si può sempre scegliere una specie diversa dal Pokédex.
- Il raggruppamento dei giochi è ora deciso: P1-18 stima le durate di conseguenza. P1-05 non deve più produrre nomi italiani di aree e medaglie per l'MVP.
- Il documento [MVP e rilasci](../progetto/03-MVP-e-rilasci.md) riporta i rilasci dei giochi.
