# Fase 7 – Test e rilascio

7 PBI. Il piano di test e la guida di installazione si possono scrivere molto prima del rilascio.

| ID | PBI | Dipende da | Taglia | Stato |
| --- | --- | --- | --- | --- |
| P7-01 | Piano di test | P2-14 | S | Da iniziare |
| P7-02 | Test end-to-end delle regole Soul Link | P7-01, P4-19 | M | Da iniziare |
| P7-03 | Test di calcoli e override | P7-01, P5-14 | M | Da iniziare |
| P7-04 | Test delle prestazioni su telefono | P6-08 | S | Da iniziare |
| P7-05 | Guida di installazione | P3-08 | S | Da iniziare |
| P7-06 | Backup e ripristino provati | P3-03 | S | Da iniziare |
| P7-07 | Rilascio della versione 1.0 | tutti i PBI | S | Da iniziare |

## P7-01 Piano di test

Output: Piano di test.

- [ ] Ogni regola Soul Link e opzionale ha almeno un caso di test.
- [ ] Ogni caso indica dati iniziali, azione e risultato atteso.

## P7-02 Test end-to-end delle regole Soul Link

- [ ] Test automatici nel browser con 3 giocatori: cattura, link, area saltata, team e box, morte, fine della run.
- [ ] Coperti anche la run già iniziata e il flag randomizer.

## P7-03 Test di calcoli e override

- [ ] Efficacia verificata su tutte le combinazioni di tipi per ogni generazione.
- [ ] Override di un giocatore verificati come invisibili agli altri giocatori e alle altre run.

## P7-04 Test delle prestazioni su telefono

- [ ] Lighthouse mobile con punteggio prestazioni di almeno 90 su tracker, helper e Pokédex.
- [ ] JavaScript della prima pagina sotto i 150 KB compressi.

## P7-05 Guida di installazione

Output: Guida di installazione.

- [ ] Comando docker run e file docker-compose di esempio, con volume.
- [ ] Tutte le variabili d'ambiente descritte, comprese quelle di Turso.
- [ ] Seguita da zero da una persona diversa dall'autore, senza aiuto.

## P7-06 Backup e ripristino provati

Output: Guida di installazione.

- [ ] Procedura di backup del database locale documentata.
- [ ] Ripristino provato su un container nuovo, con verifica dei dati.

## P7-07 Rilascio della versione 1.0

- [ ] Tutti i PBI completati o rimandati con decisione registrata.
- [ ] Immagine pubblicata con tag di versione e changelog.
- [ ] Gate finale chiuso nel piano di progetto.
