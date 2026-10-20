# ADR 0006 – Varietà dell'esemplare

- **Stato**: Accettata
- **Data**: 19 ottobre 2026
- **Decide**: product owner (risposta alla domanda aperta di P1-02)
- **PBI collegati**: P1-02, P2-04, P2-07, P5-04

## Contesto

Alcune specie hanno più varietà con tipi, statistiche o abilità diversi: Wormadam (mantello pianta, sabbia, scarti), Rotom (elettrodomestici), Darmanitan zen, Kyurem Nero e Bianco, Tornadus, Thundurus e Landorus nelle forme incarnata e totemica, Deoxys, Giratina, Shaymin. In PokéAPI sono varietà (`pokemon`) di una stessa specie, e per 37 specie la varietà predefinita ha un identificativo diverso da quello della specie ([Analisi delle fonti dati, P1-02](../progetto/10-Analisi-delle-fonti-dati.md#p1-02-copertura-pokéapi-specie-forme-statistiche-tipi)). Il modello dati degli esemplari registrava solo la specie.

## Decisione

1. Un esemplare registra la **specie** e anche la **varietà**, che è facoltativa: vuota vuol dire la varietà predefinita della specie.
2. I **dati effettivi** dell'esemplare (tipi, statistiche, abilità possibili) sono quelli della sua varietà, poi gli override del giocatore sulla specie ([ADR 0001, decisione 9](0001-decisioni-di-progetto.md#9-un-gioco-per-run-regole-comuni-override-per-giocatore)).
3. La varietà si indica con l'id numerico della varietà in PokéAPI (`pokemon_id`), mai con il nome.

## Alternative scartate

- Solo la specie: più semplice, ma i tipi e le statistiche di Wormadam, Rotom e simili sarebbero sbagliati, e con loro l'efficacia e il calcolatore danni.
- Una specie "fittizia" per ogni varietà: complicherebbe il collegamento con le linee evolutive e la dupes clause, che si basano sulla specie.

## Conseguenze

- **Modello dati**: la tabella `specimen` riceve una colonna `variety_id` (INTEGER, NULL).
- **Dupes clause e Soul Link**: restano sulla specie e sulla linea evolutiva, non sulla varietà.
- **Forme cosmetiche** (stagione di Deerling, mantello di Burmy, forme di Unown): non sono varietà e **non si tracciano**. Questa è la mia proposta e resta in attesa di una tua conferma esplicita; per ora nessun dato la richiede.
- Il Pokédex SQLite (P2-07) espone le varietà di ogni specie con i dati per generazione e per version group.
- Da recepire in P2-04 (esemplare con varietà) e P5-04 (servizio dei dati effettivi).
