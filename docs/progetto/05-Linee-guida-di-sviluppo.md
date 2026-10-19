# Nuzlocke SoulLink Companion – Linee guida di sviluppo

Oct 3, 2026 · @Lorenzo

Il codice è diviso in moduli indipendenti per funzione, con la logica di gioco pura al centro e tutto ciò che può fallire ai bordi. Ogni modifica è piccola, ogni errore diventa un test, e una nuova generazione si aggiunge con dati, non con codice.

## Architettura

&#91;embedded content: livelli di ogni modulo · dipendenze verso il dominio\]

Il dominio non conosce né database né interfaccia: si testa da solo, in millisecondi, e una libreria esterna si sostituisce cambiando solo il suo adattatore.

## Regole dei moduli

Ogni funzione dell'app vive in un modulo sotto `src/lib/modules/<modulo>/`, e un modulo parla con gli altri solo attraverso la sua API pubblica.

| Modulo | Responsabilità |
| --- | --- |
| `auth` | Account, sessioni, admin creato all'avvio |
| `runs` | Run, giocatori, inviti, ruoli, impostazioni delle regole |
| `encounters` | Aree, incontri, esiti |
| `soullink` | Regole Soul Link: link, area saltata, posizione condivisa, morte condivisa |
| `roster` | Esemplari, team, box, cimitero |
| `progress` | Medaglie e level cap |
| `overrides` | Override per specie per giocatore e servizio dei dati effettivi |
| `battle` | Motore dei tipi, helper per le lotte, adattatore del calcolatore |
| `pokedex` | Lettura del Pokédex SQLite |
| `timeline` | Eventi della run, in sola aggiunta |
| `realtime` | Hub SSE |
| `i18n` | Lingue e nomi localizzati |
| `admin` | Gestione utenti e registrazioni |

Struttura interna di ogni modulo:

- `domain/`: tipi e funzioni pure. Nessun accesso a database, rete, orologio o variabili d'ambiente.
- `application/`: casi d'uso che orchestrano il dominio e le porte (interfacce verso l'esterno).
- `infrastructure/`: implementazioni delle porte (Drizzle, SSE, file di dati).
- `ui/`: componenti Svelte del modulo.
- `index.ts`: l'unica API pubblica, con i tipi e i casi d'uso esportati.
- `README.md`: scopo del modulo, API pubblica, dipendenze.

Regole verificate dal lint (eslint-plugin-boundaries):

- Si importa da un altro modulo solo il suo `index.ts`, mai i file interni.
- `domain/` non importa nulla fuori da `domain/` e dal kernel condiviso `src/lib/shared/` (tipi base, `Result`, errori).
- Nessuna dipendenza circolare tra moduli.
- Le route SvelteKit (`src/routes/`) chiamano solo i casi d'uso, mai il database.

## Codice atomico

Ogni unità fa una cosa sola, e ogni operazione sui dati riesce tutta o non lascia traccia.

- **Funzioni**: una responsabilità, al massimo circa 40 righe, al massimo 3 parametri (oltre, un oggetto tipizzato). Nessun effetto collaterale nascosto.
- **File**: al massimo circa 300 righe; oltre si divide per responsabilità.
- **Componenti Svelte**: un componente per elemento dell'interfaccia; la logica sta nei casi d'uso, il componente mostra e inoltra eventi.
- **Commit**: uno per passo logico, ognuno compila e passa i test. La pull request intera corrisponde a un PBI.
- **Transazioni**: un'azione Soul Link (cattura con link, spostamento in team, morte con propagazione) è una sola transazione: o cambiano tutti i partner, o nessuno.
- **Idempotenza**: ripetere la stessa richiesta (doppio tocco, ritentativo dopo un errore di rete) produce lo stesso risultato. Le richieste che modificano dati portano un identificativo generato dal client.
- **Eventi**: la timeline è in sola aggiunta; un errore si corregge con un nuovo evento, non riscrivendo quello vecchio.

## Codice antifragile

Il sistema non si limita a resistere agli errori: ogni errore lo rende più solido, perché viene trasformato in un controllo permanente.

Ai confini, nulla entra senza essere verificato:

- Input delle API, variabili d'ambiente, file di dati di gioco e righe lette dal database si validano con schemi Zod. Dentro il dominio i dati sono già tipizzati e corretti.
- L'app si rifiuta di partire con una configurazione invalida, e dice quale variabile manca.

Errori distinti per natura:

- Gli **errori di dominio** previsti (area già usata, team pieno, tipo primario ripetuto) si restituiscono come `Result` tipizzato, con un codice che l'interfaccia traduce in un messaggio chiaro.
- I **bug** (stato impossibile) lanciano un'eccezione, vengono registrati con l'ID della run e non vengono mai nascosti.

Invarianti del Soul Link sempre verificate:

- Partner collegati hanno sempre la stessa posizione (team, box, morto).
- Nessun giocatore ha più di 6 esemplari in team.
- Un'area ha al massimo un incontro valido per giocatore, salvo dupes clause e regali.

Le invarianti sono funzioni del dominio: girano nei test con dati generati (property-based testing con fast-check) e, in sviluppo, dopo ogni transazione.

Degradazione controllata:

- Sprite non disponibile: immagine di riserva, la pagina resta utilizzabile.
- Connessione SSE persa: riconnessione automatica e riallineamento dello stato, con un avviso discreto.
- Database online non raggiungibile: messaggio chiaro e nuovi tentativi, senza perdere ciò che l'utente stava scrivendo.

Ciclo di apprendimento:

- Ogni bug chiuso lascia un test di regressione.
- Ogni incidente che ha richiesto più di una sessione lascia una nota nel README del modulo: causa, correzione, controllo aggiunto.
- Le migrazioni del database vanno solo avanti; una correzione è una nuova migrazione.

## Evoluzione guidata dai dati

Ciò che cambia tra generazioni e giochi è un dato, non un ramo di codice: aggiungere un gioco o una generazione non richiede di toccare la logica.

- **Generazioni**: tabella dei tipi, regola fisico/speciale, presenza di Teracristallizzazione e altre differenze stanno in un file di meccaniche per generazione, letto dal modulo `battle`. Nessun `if (gen === 4)` fuori da quel modulo.
- **Giochi**: aree in ordine, medaglie, level cap, colore della run e version group stanno in file di dati di gioco validati all'avvio. Un gioco nuovo è un file nuovo.
- **Regole della run**: ogni regola opzionale è un'impostazione della run letta dai casi d'uso. Una regola nuova si aggiunge come impostazione, con default spento, senza cambiare le run esistenti.
- **Adattatori sostituibili**: @smogon/calc, PokéAPI e libSQL si usano solo attraverso una porta del modulo che li possiede. Cambiare libreria o provider tocca un solo file di infrastruttura.
- **Versioni dei dati**: il Pokédex SQLite e i file di gioco portano un numero di versione, mostrato all'admin e registrato in ogni rilascio.

## Convenzioni di codice e interfaccia

Il codice è scritto in inglese, l'interfaccia è tradotta, e lo stile visivo viene solo dal design system.

- TypeScript strict, niente `any`; i tipi del dominio hanno nomi del gioco (`Encounter`, `SoulLink`, `Specimen`).
- Nomi: `camelCase` per variabili e funzioni, `PascalCase` per tipi e componenti, `kebab-case` per file e cartelle.
- Testi dell'interfaccia solo tramite chiavi Paraglide, raggruppate per modulo (`runs.create.title`).
- Date in UTC, formato ISO 8601; si mostrano nel fuso e nella lingua dell'utente.
- Colori, spazi, raggi e testi solo dai token del design system SoulLink Companion, come variabili CSS. Nessun valore esadecimale nei componenti.
- Ogni schermata nuova parte dai mockup; uno scostamento si discute prima e si aggiorna il mockup.

## Documentazione nel codice

La documentazione vive accanto al codice che descrive, così invecchia insieme a lui.

- **TSDoc** su ogni elemento esportato da un `index.ts`: cosa fa, parametri, errori di dominio possibili.
- **README di modulo**: scopo, API pubblica, porte e adattatori, invarianti, note sugli incidenti.
- **ADR** (Architecture Decision Record) in `docs/adr/NNNN-titolo.md` per ogni scelta difficile da cambiare: contesto, decisione, alternative, conseguenze. Le scelte già prese (SvelteKit, libSQL e Turso, Better Auth, @smogon/calc e le altre) sono nell'[ADR 0001](../adr/0001-decisioni-di-progetto.md); da ora ogni decisione nuova è una ADR separata, secondo il modello di [`docs/adr/README.md`](../adr/README.md).
- I documenti di progetto (modello dati, API) si aggiornano nella stessa pull request che cambia il codice.

## Checklist di revisione

Il product owner, prima di unire, e l'agente, prima di aprire la pull request, controllano questi punti.

- [ ] La modifica tocca un solo modulo, o più moduli solo tramite le loro API pubbliche.
- [ ] Nessuna logica di gioco fuori da `domain/`; nessun accesso al database fuori da `infrastructure/`.
- [ ] Input esterni validati; errori di dominio come `Result`, con messaggio tradotto.
- [ ] Azioni Soul Link in una sola transazione, con test delle invarianti.
- [ ] Nessun ramo per generazione o gioco fuori dai file di dati e dal modulo `battle`.
- [ ] Token del design system, nessun colore o spazio scritto a mano; schermata fedele al mockup.
- [ ] TSDoc, README del modulo e, se serve, ADR aggiornati.
