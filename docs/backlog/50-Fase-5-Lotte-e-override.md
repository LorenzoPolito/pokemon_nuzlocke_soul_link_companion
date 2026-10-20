# Fase 5 – Lotte e override

14 PBI. Il motore dei tipi (P5-05, P5-06, P5-14) non dipende dalla fase 4 e può essere sviluppato in parallelo con essa.

| ID | PBI | Dipende da | Taglia | Stato |
| --- | --- | --- | --- | --- |
| P5-01 | Modifica degli override per specie | P4-03 | M | Da iniziare |
| P5-02 | Segnale di dato modificato e ripristino | P5-01 | S | Da iniziare |
| P5-03 | Copia degli override a un altro giocatore | P5-01 | S | Da iniziare |
| P5-04 | Servizio dei dati effettivi | P5-01 | M | Da iniziare |
| P5-05 | Motore di efficacia dei tipi per generazione | P1-08, P3-01 | M | Da iniziare |
| P5-06 | Abilità che cambiano l'efficacia | P5-05 | S | Da iniziare |
| P5-07 | Helper: scelta del proprio Pokémon e dell'avversario | P5-04 | M | Da iniziare |
| P5-08 | Helper: debolezze e resistenze | P5-05, P5-07 | S | Da iniziare |
| P5-09 | Helper: le proprie mosse | P5-08 | M | Da iniziare |
| P5-10 | Helper: mosse osservate dell'avversario | P5-08 | S | Da iniziare |
| P5-11 | Squadre incontrate nel log della run | P5-10, P4-16 | S | Da iniziare |
| P5-12 | Calcolatore danni con dati effettivi | P5-04 | M | Da iniziare |
| P5-13 | Calcolatore attivabile per run | P5-12, P4-01 | XS | Da iniziare |
| P5-14 | Teracristallizzazione in Gen 9 | P5-05 | S | Da iniziare |

## P5-01 Modifica degli override per specie

- [ ] Un giocatore modifica tipi, statistiche base, abilità possibili e mosse imparabili di una specie nella propria run.
- [ ] La modifica vale per tutti gli esemplari della specie nel suo gioco, suoi e avversari.
- [ ] Pokédex globale, altri giocatori e altre run restano invariati.

## P5-02 Segnale di dato modificato e ripristino

- [ ] Ogni dato sovrascritto è segnalato ovunque compaia.
- [ ] Il ripristino al valore del Pokédex è possibile campo per campo.

## P5-03 Copia degli override a un altro giocatore

- [ ] Copia di una specie o di tutti gli override verso un altro giocatore della stessa run.
- [ ] Prima della copia viene mostrato cosa verrà sovrascritto.

## P5-04 Servizio dei dati effettivi

- [ ] Un unico punto del codice restituisce i dati di una specie per run e giocatore: override se presente, altrimenti Pokédex.
- [ ] Tracker, helper e calcolatore usano solo questo servizio.

## P5-05 Motore di efficacia dei tipi per generazione

- [ ] Moltiplicatore corretto per ogni coppia di tipi in Gen 1, Gen 2–5 e Gen 6+.
- [ ] Supporta difensori con uno o due tipi.
- [ ] Test confrontati con le tabelle del documento Meccaniche per generazione, tutte le combinazioni.

## P5-06 Abilità che cambiano l'efficacia

- [ ] Le abilità elencate in P1-09 modificano il risultato del motore.
- [ ] L'interfaccia mostra quando un'abilità ha cambiato un moltiplicatore.

## P5-07 Helper: scelta del proprio Pokémon e dell'avversario

- [ ] Il proprio Pokémon si sceglie dal team del giocatore.
- [ ] L'avversario si sceglie dall'intero Pokédex, senza squadre precaricate.
- [ ] Tipi e abilità dell'avversario modificabili per la lotta in corso.

## P5-08 Helper: debolezze e resistenze

- [ ] Per entrambi i Pokémon: tipi e moltiplicatori ricevuti da ogni tipo.
- [ ] Calcolati con le regole della generazione della run e i dati effettivi del giocatore.

## P5-09 Helper: le proprie mosse

- [ ] Per ogni mossa: efficacia sull'avversario, STAB, categoria, potenza.
- [ ] Le mosse restano nell'ordine dell'esemplare: nessun ordinamento, evidenziazione o suggerimento.

## P5-10 Helper: mosse osservate dell'avversario

- [ ] Le mosse si aggiungono durante la lotta quando vengono viste.
- [ ] Per ogni mossa osservata: efficacia su ogni membro del proprio team.
- [ ] Endpoint `seen_trainer` e `seen_pokemon` (elenco, aggiunta, rimozione) aggiunti al catalogo API prima dell'inizio.


## P5-11 Squadre incontrate nel log della run

- [ ] Una squadra avversaria vista si salva con nome dell'allenatore e mosse osservate.
- [ ] Le squadre salvate sono consultabili da tutti i partecipanti della run e mai proposte in automatico.

## P5-12 Calcolatore danni con dati effettivi

- [ ] Il calcolo usa @smogon/calc con le meccaniche della generazione della run.
- [ ] Tipi e statistiche passati al calcolo sono i dati effettivi del giocatore.
- [ ] Risultati verificati su almeno 10 casi confrontati con il calcolatore di riferimento.
- [ ] Il calcolo gira sul server con `@smogon/calc` e i dati effettivi (`POST /api/runs/{id}/battle/damage`), se il product owner conferma la proposta di P2-13.


## P5-13 Calcolatore attivabile per run

- [ ] Con il calcolatore disattivo nella run, non compare in nessuna schermata di quella run.
- [ ] Solo il proprietario cambia l'impostazione.

## P5-14 Teracristallizzazione in Gen 9

- [ ] Nelle run di Gen 9 si può indicare il teratipo attivo di entrambi i Pokémon.
- [ ] Efficacia ricevuta e STAB aggiornati secondo le regole documentate in P1-09.
