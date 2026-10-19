# Fase 2 – Progettazione

14 PBI. Il modello dati si divide per area funzionale, così le parti si progettano in parallelo e si uniscono nella revisione finale.

| ID | PBI | Dipende da | Taglia | Stato |
| --- | --- | --- | --- | --- |
| P2-01 | Modello dati: utenti, sessioni, ruoli globali | P1-13 | S | Da iniziare |
| P2-02 | Modello dati: run, giocatori, regole | P1-01 | S | Da iniziare |
| P2-03 | Modello dati: aree, incontri, link Soul Link | P2-02, P1-06 | M | Da iniziare |
| P2-04 | Modello dati: esemplari, stato, eventi | P2-03 | M | Da iniziare |
| P2-05 | Modello dati: override per specie per giocatore | P2-02 | S | Da iniziare |
| P2-06 | Modello dati: medaglie e level cap | P2-02, P1-07 | XS | Da iniziare |
| P2-07 | Schema del Pokédex SQLite | P1-15 | M | Da iniziare |
| P2-08 | Modello dei permessi | P2-01, P2-02 | S | Da iniziare |
| P2-09 | Catalogo delle API | P2-03, P2-04, P2-05, P2-06, P2-08 | M | Da iniziare |
| P2-10 | Catalogo degli eventi SSE | P2-09 | S | Da iniziare |
| P2-11 | Flussi: creazione run, inviti, run già iniziata | P2-02 | S | Da iniziare |
| P2-12 | Bozze schermate: tracker | P2-11 | M | Da iniziare |
| P2-13 | Bozze schermate: lotte, calcolatore, Pokédex | P1-09 | M | Da iniziare |
| P2-14 | Revisione e approvazione (gate 2) | tutti i P2 | S | Da iniziare |

## P2-01 Modello dati: utenti, sessioni, ruoli globali

Output: Modello dati.

- [ ] Tabelle richieste da Better Auth riportate senza modifiche non necessarie.
- [ ] Ruolo globale (admin, utente) e flag di cambio password obbligatorio definiti.
- [ ] Impostazione della modalità di registrazione (aperta, su invito, chiusa) definita.

## P2-02 Modello dati: run, giocatori, regole

Output: Modello dati.

- [ ] Una run ha un solo gioco, uguale per tutti gli N giocatori; impostazioni e regole valgono per tutti, salvo gli override per specie.
- [ ] Regole opzionali e flag (randomizer, calcolatore) memorizzati per run.
- [ ] Stato della run (in corso, persa, completata) definito.

## P2-03 Modello dati: aree, incontri, link Soul Link

Output: Modello dati.

- [ ] Un incontro per area per giocatore, con esito (catturato, fallito, fuggito, saltato per dupe, regalo, precedente non tracciato).
- [ ] Il link Soul Link unisce gli incontri della stessa area tra tutti i giocatori.
- [ ] Aree personalizzate aggiunte dall'admin supportate.

## P2-04 Modello dati: esemplari, stato, eventi

Output: Modello dati.

- [ ] Esemplare con soprannome, specie, livello, natura, abilità, 4 mosse, posizione (team, box, morto).
- [ ] Causa della morte con avversario, mossa e area.
- [ ] Eventi della timeline con tipo, data e riferimenti, scritti in sola aggiunta.

## P2-05 Modello dati: override per specie per giocatore

Output: Modello dati.

- [ ] Chiave univoca run + giocatore + specie.
- [ ] Ogni campo sovrascrivibile (tipi, statistiche, abilità, mosse imparabili) memorizzato separatamente, così il ripristino è per singolo campo.

## P2-06 Modello dati: medaglie e level cap

Output: Modello dati.

- [ ] Medaglie ottenute per giocatore, con data.
- [ ] Level cap calcolato dai dati di gioco e override manuale per run.

## P2-07 Schema del Pokédex SQLite

Output: Modello dati.

- [ ] Tabelle e indici per specie, forme, tipi, mosse, abilità, learnset, evoluzioni, incontri.
- [ ] Nomi in più lingue con fallback all'inglese.
- [ ] Dati per version group, così ogni run legge i dati del proprio gioco.

## P2-08 Modello dei permessi

Output: Architettura e API.

- [ ] Matrice azioni × ruoli (admin, proprietario, giocatore, spettatore) completa.
- [ ] Definito chi può modificare i dati di un altro giocatore della stessa run.

## P2-09 Catalogo delle API

Output: Architettura e API.

- [ ] Ogni endpoint con metodo, percorso, input, output, errori e permesso richiesto.
- [ ] Le regole Soul Link sono applicate dal server, non solo dall'interfaccia.

## P2-10 Catalogo degli eventi SSE

Output: Architettura e API.

- [ ] Ogni evento con nome, contenuto e destinatari.
- [ ] Strategia di riallineamento dopo una riconnessione definita, insieme agli eventi di presa e rilascio dei lock.

## P2-11 Flussi: creazione run, inviti, run già iniziata

Output: Flussi e schermate.

- [ ] Flusso di creazione per run nuova e per run già iniziata, passo per passo.
- [ ] Flusso di invito e accettazione di un giocatore.

## P2-12 Bozze schermate: tracker

Output: Flussi e schermate.

- [ ] Bozze per lista aree, dettaglio esemplare, team e box, cimitero, timeline.
- [ ] Ogni bozza progettata prima per telefono.

## P2-13 Bozze schermate: lotte, calcolatore, Pokédex

Output: Flussi e schermate.

- [ ] Bozze per helper delle lotte, calcolatore, lista e scheda del Pokédex.
- [ ] Verificato che l'helper non ordini né evidenzi una mossa migliore.

## P2-14 Revisione e approvazione (gate 2)

Output: Piano di progetto.

- [ ] Modello dati, API e schermate rivisti insieme e approvati.
- [ ] Ogni requisito della specifica collegato ad almeno un PBI delle fasi 3–7.
