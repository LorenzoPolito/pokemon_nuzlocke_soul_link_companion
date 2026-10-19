# Nuzlocke SoulLink Companion – MVP e rilasci

Oct 3, 2026 · @Lorenzo

L'MVP (versione 0.1) serve a giocare una vera run Soul Link su Pokémon Bianco, Nero, Bianco 2 o Nero 2 il prima possibile. Ogni rilascio successivo aggiunge un blocco utilizzabile, fino alla 1.0 con tutte le generazioni.

## Ambito dell'MVP

L'MVP copre il ciclo base di una run Soul Link sui quattro giochi della quinta generazione; tutto il resto arriva nei rilasci successivi.

| Area | Nell'MVP (0.1) | Dopo |
| --- | --- | --- |
| Giochi | Bianco, Nero, Bianco 2, Nero 2; un solo gioco per run, uguale per tutti | Altre generazioni (0.5 e 1.0) |
| Account | Registrazione, login, admin creato all'avvio, pannello admin essenziale | — |
| Run | Creazione, inviti, N giocatori, regole base e Soul Link sempre attive | Run già iniziata, regole opzionali (0.2) |
| Tracker | Aree in ordine, incontri, link automatico, area saltata, team e box condivisi, morte condivisa, cimitero, fine della run | Timeline con filtri (0.2) |
| Progressione | Medaglie e level cap dei quattro giochi | — |
| Collaborazione | Sync in tempo reale, lock sul dato in modifica, vince l'ultima modifica | — |
| Dati Pokémon | Specie, tipi e nomi in italiano e inglese della quinta generazione, quanto basta per registrare gli incontri | Pokédex completo (0.4) |
| Lotte | — | Helper, motore dei tipi, override (0.3); calcolatore danni (0.4) |
| Randomizer | — | 0.3, insieme agli override |
| Installazione | Docker su qualsiasi server, solo HTTP (HTTPS eventuale con un reverse proxy esterno), database locale, backup documentato | Turso online (1.0) |
| Lingue | Italiano e inglese; nomi di aree e medaglie solo in inglese ([ADR 0004](../adr/0004-fonti-dei-dati-nomi-e-giochi-per-rilascio.md)) | — |

## PBI dell'MVP e criteri di uscita

L'MVP comprende 59 dei 96 PBI del backlog: quasi tutta l'analisi e le fondamenta, più il nucleo del tracker. È tanto per una 0.1, ma è lavoro che ogni rilascio successivo riusa.

| Fase | PBI nell'MVP | Rimandati |
| --- | --- | --- |
| 1 – Analisi | Prima P1-01, P1-04, P1-06, P1-07 sui quattro giochi; poi P1-19 e tutti gli altri | P1-08, P1-09, P1-11 (0.3) |
| 2 – Progettazione | Tutti | P2-05 (0.3), P2-13 (0.3) |
| 3 – Fondamenta | Tutti, P3-01–P3-13 | — |
| 4 – Run e tracker | P4-01–P4-07, P4-10, P4-11, P4-13–P4-15, P4-17, P4-18, P4-21 | P4-08, P4-09, P4-12, P4-16, P4-19 (0.2); P4-20 (0.3) |
| 5 – Lotte e override | — | Tutti (0.3 e 0.4) |
| 6 – Pokédex | — | Tutti (0.4) |
| 7 – Test e rilascio | P7-01, P7-05, P7-06 | P7-02–P7-04 (1.0), P7-07 (1.0) |

L'MVP è pronto quando:

- [ ] Una run reale con almeno 2 giocatori, su uno dei quattro giochi, è stata giocata fino alla terza medaglia senza perdite di dati e senza interventi a mano sul database.
- [ ] Le regole Soul Link base sono applicate dal server e coperte da test di unità e di sistema.
- [ ] Una persona diversa dall'autore ha installato l'app da zero seguendo la guida.
- [ ] Backup e ripristino sono stati provati su un container nuovo.
- [ ] Non ci sono bug Bloccanti o Alti aperti.

## Rilasci dopo l'MVP

Giochi per rilascio ([ADR 0004](../adr/0004-fonti-dei-dati-nomi-e-giochi-per-rilascio.md), deciso il 19 ottobre 2026): la **0.1** ha Bianco, Nero, Bianco 2 e Nero 2; la **0.5** i 17 giochi per cui nuzlocke.data ha già aree e boss (generazioni 1–4, X e Y, Rubino Omega e Zaffiro Alpha, Sole e Luna, Ultrasole e Ultraluna, Spada e Scudo, Diamante Lucente e Perla Splendente, Scarlatto e Violetto); la **1.0** Let's Go, Leggende: Arceus e Leggende: Z-A, compilati a mano. Le espansioni sono aree in coda al gioco base.

&#91;embedded content: rilasci · dalla 0.1 alla 1.0\]

Ogni rilascio si chiude con una partita vera che usa le nuove funzioni; i PBI rimandati si pianificano in quell'ordine, e le fasi del piano restano il raggruppamento tecnico del lavoro.
