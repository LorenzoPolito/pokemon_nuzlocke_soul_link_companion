# Fase 6 – Pokédex

8 PBI. Il Pokédex dipende solo dalla fase 3, quindi può essere sviluppato in parallelo con le fasi 4 e 5.

| ID | PBI | Dipende da | Taglia | Stato |
| --- | --- | --- | --- | --- |
| P6-01 | Lista e ricerca delle specie | P3-04, P3-06 | M | Da iniziare |
| P6-02 | Scheda della specie | P6-01 | M | Da iniziare |
| P6-03 | Learnset per gioco | P6-02 | S | Da iniziare |
| P6-04 | Incontri per area e per gioco | P6-02 | S | Da iniziare |
| P6-05 | Pagine di mosse e abilità | P6-01 | M | Da iniziare |
| P6-06 | Sprite con cache e immagine di riserva | P6-01 | XS | Da iniziare |
| P6-07 | Nomi localizzati nel Pokédex | P6-01, P3-05 | S | Da iniziare |
| P6-08 | Collegamenti dal tracker e dall'helper | P6-02, P4-10 | S | Da iniziare |

## P6-01 Lista e ricerca delle specie

- [ ] Ricerca per nome in italiano e inglese, tollerante a maiuscole e accenti.
- [ ] Filtri per generazione e tipo.
- [ ] Risultati della ricerca entro 100 ms sul server.

## P6-02 Scheda della specie

- [ ] Tipi, statistiche base, abilità e catena evolutiva.
- [ ] Selezione della generazione o del gioco, con i dati di quella versione.

## P6-03 Learnset per gioco

- [ ] Mosse imparate per livello, MT, uova e tutor, per il gioco selezionato.
- [ ] Ogni mossa con tipo, categoria, potenza e precisione.

## P6-04 Incontri per area e per gioco

- [ ] Aree in cui la specie compare nel gioco selezionato, con metodo e livelli.
- [ ] Messaggio chiaro quando i dati di incontro mancano per quel gioco.

## P6-05 Pagine di mosse e abilità

- [ ] Scheda della mossa con dati per generazione ed elenco delle specie che la imparano.
- [ ] Scheda dell'abilità con descrizione ed elenco delle specie.

## P6-06 Sprite con cache e immagine di riserva

- [ ] Sprite caricati dal repository di PokéAPI e conservati nella cache del browser.
- [ ] Immagine di riserva quando uno sprite non è disponibile.

## P6-07 Nomi localizzati nel Pokédex

- [ ] Nomi di specie, mosse, abilità e aree nella lingua scelta, con riserva in inglese.

Modifica dei criteri, 19 ottobre 2026 ([ADR 0004](../adr/0004-fonti-dei-dati-nomi-e-giochi-per-rilascio.md)): i nomi delle aree restano in inglese nell'MVP, quindi il criterio riguarda specie, mosse e abilità.
- [ ] Cambiare lingua aggiorna i nomi dopo la ricarica della pagina, restando sulla stessa scheda.

## P6-08 Collegamenti dal tracker e dall'helper

- [ ] Ogni specie, mossa e abilità mostrata nel tracker o nell'helper apre la scheda del Pokédex.
- [ ] Dentro una run la scheda mostra i dati effettivi del giocatore, con gli override segnalati.
