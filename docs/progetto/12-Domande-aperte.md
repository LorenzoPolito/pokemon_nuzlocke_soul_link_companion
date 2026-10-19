# Nuzlocke SoulLink Companion – Domande aperte

Documento di output di P1-19 (sessione di chiarimento dei requisiti). Raccoglie le domande ancora aperte al 19 ottobre 2026: il comportamento con rete instabile durante la partita e quanto è emerso dai PBI di fase 1 (P1-01, P1-04, P1-06, P1-07). **Nessuna domanda è decisa**: ogni voce ha una proposta, e decide il product owner.

## Come si usa

- Per ogni domanda rispondi "ok" (accetti la proposta), "alternativa" (con quale) o "decido dopo". Si può rispondere anche in blocco, per esempio "ok a tutte tranne R-1 e D-3".
- Priorità: **A** blocca la progettazione della fase 2 (modello dati, API, schermate); **B** serve prima del rilascio indicato; **C** è un dettaglio che non blocca nulla.
- Una risposta diventa una voce nuova di [`decisioni.md`](../decisioni.md); dove serve, aggiorno la [Specifica dei requisiti](01-Specifica-dei-requisiti.md) e i dati di gioco. Non cambio nulla prima della tua risposta.

## Riepilogo

| ID | Domanda | Priorità | Proposta in una riga | Chiude |
| --- | --- | --- | --- | --- |
| R-1 | Si può modificare senza rete? | A | Modifiche semplici in coda per 10 minuti; azioni Soul Link mai in coda | P2-09, P4-18 |
| R-2 | Quando la connessione è "persa" e cosa succede al ritorno | A | Segnale ogni 15 s, persa dopo 40 s; al ritorno si recuperano gli eventi mancanti | P2-10, P4-18 |
| R-3 | Lock con rete persa o server riavviato | A | Il lock scade da solo; al ritorno il client lo riprende; salvare resta possibile | P2-10, P4-21 |
| R-4 | Doppio invio e risposta persa | A | Chiave di idempotenza per ogni scrittura, valida 24 ore | P2-09 |
| R-5 | La schermata cambia subito o aspetta il server? | A | Subito per le modifiche semplici; mai per le azioni Soul Link | P2-12 |
| R-6 | Bozze di ciò che si sta scrivendo | B | Nel browser, per modulo, cancellate al salvataggio o dopo 24 ore | P4-10 |
| R-7 | Funzionamento completamente offline | C | Fuori ambito fino alla 1.0 | P1-18 |
| D-1 | Un "gioco" è una versione o una coppia | A | Una versione (Nero, Bianco, Nero 2, Bianco 2) | P2-02 |
| D-2 | L'ordine delle aree è obbligatorio? | A | Solo di visualizzazione: ogni area si registra quando si vuole | P2-03, P4-04 |
| D-3 | Stanze interne: area separata o unita? | A | Unite all'area principale | P1-06 (dati), P2-03 |
| D-4 | Grotte nascoste di Nero 2 e Bianco 2 | B | Come gli incontri fissi (decisione 17) | P2-03, P4-09 |
| D-5 | Difficoltà di Nero 2 e Bianco 2 | A | Impostazione della run, normale di default | P2-02 |
| D-6 | Il level cap è per run o per giocatore? | A | Per giocatore, con un override unico per run | P2-06 |
| D-7 | Come si registrano le tappe senza medaglia | A | `run_milestone` al posto di `run_badge` | P2-06 |
| D-8 | Nomi italiani delle aree e delle medaglie | B | Regola "Route N" → "Percorso N", inglese per il resto, elenco da una fonte | P1-05 |
| D-9 | Giochi in 0.5 e in 1.0; Let's Go e Leggende; espansioni | B | Come proposto in P1-01 | P1-18 |
| D-10 | Fonti degli incontri per Gen 8 e Gen 9 | B | nuzlocke.data per i giochi che lo hanno; a mano per Leggende | P1-18 |
| D-11 | Sciami di Nero e Bianco; White Forest; livelli degli scambi | C | Nessun suggerimento finché non c'è una fonte verificata | P1-06 (dati) |
| D-12 | Colore della run per gioco | C | Lo sceglie il design | P2-12 |
| S-1 | Registro delle decisioni al posto di `docs/adr/` | C | Aggiornare le Linee guida | P3-01 |
| S-2 | Dipendenze "In verifica" per i PBI di sviluppo | B | Contano se la PR è unita su `develop` | prima di P3-01 |
| S-3 | `npm audit` nella verifica locale | C | Avviso, non blocco | P3-11 |
| S-4 | Diagramma di architettura con Neon | C | Ridisegnarlo con la progettazione | P2-08 |

## Rete instabile durante la partita

**Contesto.** Chi gioca è spesso su telefono, con rete mobile o Wi-Fi di casa, e una partita dura ore. Il comportamento già deciso: sincronizzazione con SSE, lock consultivi con lease di 60 secondi rinnovato ogni 20, "vince l'ultimo" con avviso a chi è sovrascritto, valore precedente nel diario ([Specifica, Concorrenza e lock](01-Specifica-dei-requisiti.md#concorrenza-e-lock)). Le Linee guida chiedono richieste idempotenti con identificativo generato dal client, riconnessione automatica con riallineamento e "senza perdere ciò che l'utente stava scrivendo" ([Linee guida, Codice atomico e antifragile](05-Linee-guida-di-sviluppo.md#codice-atomico)). Il Modello dati prevede già `request_key` (risposta salvata per 24 ore) e un diario `run_event` con identificativi ordinabili nel tempo. Mancano le regole di comportamento: sono le domande che seguono, tutte con la stessa fonte (P1-19) e da chiudere prima di P2-09 (API) e P2-10 (eventi SSE).

### R-1 Modifiche senza rete (priorità A)

- **Domanda**: se la rete cade mentre uno modifica, il salvataggio si accoda e parte al ritorno, o si blocca finché non c'è rete?
- **Perché conta**: determina le API (idempotenza) e la sicurezza delle regole Soul Link: una morte registrata offline potrebbe applicarsi a uno stato ormai vecchio.
- **Proposta**:
  - le **modifiche semplici** (soprannome, livello, natura, abilità, mosse, note) restano in coda sul dispositivo per al massimo **10 minuti** e partono da sole al ritorno della rete; oltre, la bozza si conserva ma si salva a mano, dopo aver riletto i dati aggiornati;
  - le **azioni Soul Link** (catturare con collegamento, spostare in team o box, segnare morto, saltare un'area) **non si accodano mai**: servono la rete e lo stato aggiornato, e al ritorno vanno confermate a mano;
  - tutte le scritture portano la stessa chiave di idempotenza a ogni tentativo (R-4).
- **Alternativa**: niente coda (più semplice): senza rete il pulsante Salva è disattivato e la bozza resta compilata. Si perde la comodità per i cali brevi, ma non c'è nessun rischio di applicare qualcosa a uno stato vecchio.
- **Risposta**: _da compilare_.

### R-2 Quando la connessione è persa e cosa succede al ritorno (priorità A)

- **Domanda**: dopo quanto tempo l'app dice che la connessione è persa, e come si riallinea?
- **Proposta**:
  - il server manda un segnale SSE ogni **15 secondi**; se non arriva nulla per **40 secondi**, compare un avviso discreto "Connessione persa, i dati potrebbero non essere aggiornati" e le azioni Soul Link si disattivano (R-1);
  - il client riprova a riconnettersi da solo, con attese crescenti (1, 2, 4, 8 secondi, al massimo 30);
  - al ritorno invia l'identificativo dell'ultimo evento ricevuto: il server rimanda gli eventi mancanti dal diario della run. Se sono troppi o il server è stato riavviato, il client ricarica l'intero stato della run;
  - l'avviso scompare da solo al riallineamento, senza richiedere nessun gesto.
- **Alternativa**: ricaricare sempre l'intero stato al ritorno (più semplice, ma più traffico su rete mobile e perdita dello scorrimento della schermata).
- **Risposta**: _da compilare_.

### R-3 Lock con rete persa o server riavviato (priorità A)

- **Domanda**: cosa succede ai lock quando la rete cade o il server si riavvia? Confermi anche il disegno dei lock della specifica (criterio di P1-19)?
- **Proposta**:
  - se il rinnovo ogni 20 secondi non va a buon fine, il modulo resta aperto e utilizzabile; il lock scade da solo dopo 60 secondi, come da specifica;
  - al ritorno il client prova a riprendere il lock. Se nel frattempo lo ha preso un altro, il modulo mostra "ora in modifica da …" e il salvataggio chiede conferma, come per ogni lock consultivo;
  - un riavvio del server azzera i lock senza errori; i client con un modulo aperto li richiedono di nuovo appena si riconnettono;
  - chi salva e ha perso il lock sovrascrive comunque ("vince l'ultimo"); chi viene sovrascritto riceve l'avviso con il valore nuovo, e il valore precedente resta nel diario.
- **Alternativa**: nessuna prevista; è l'applicazione diretta di ciò che è già deciso.
- **Risposta**: _da compilare_ (una conferma chiude anche il criterio "verificato con il product owner il disegno dei lock").

### R-4 Doppio invio e risposta persa (priorità A)

- **Domanda**: se la richiesta arriva ma la risposta si perde, e il client riprova, come si evita un doppio effetto?
- **Proposta**: ogni scrittura porta una chiave di idempotenza generata dal client; il server salva la risposta e, se riceve di nuovo la stessa chiave, la restituisce senza rifare nulla. La chiave vale **24 ore** (già nel Modello dati). Poiché la coda di R-1 dura al massimo 10 minuti, la finestra è ampiamente sufficiente.
- **Alternativa**: nessuna ragionevole; senza idempotenza una morte ripetuta o una cattura doppia sarebbe un bug Bloccante.
- **Risposta**: _da compilare_.

### R-5 La schermata cambia subito o aspetta il server? (priorità A)

- **Domanda**: dopo un tocco, l'interfaccia aggiorna subito o attende la conferma del server?
- **Proposta**: **subito** per le modifiche semplici, con un indicatore discreto "in invio", annullato con un messaggio se il server rifiuta; **mai** per le azioni Soul Link, che attendono la risposta: sono una transazione unica su più giocatori e possono essere rifiutate dal server (team pieno, area già usata), e mostrare uno stato sbagliato dei partner collegati è peggio di una piccola attesa.
- **Alternativa**: sempre ottimistica (più fluida, ma con correzioni visibili agli altri giocatori) oppure sempre in attesa (più semplice, ma lenta su rete mobile).
- **Risposta**: _da compilare_.

### R-6 Bozze di ciò che si sta scrivendo (priorità B)

- **Domanda**: dove si conserva ciò che l'utente sta scrivendo se la pagina si chiude o la rete cade?
- **Proposta**: nel browser (archivio locale), per modulo e per dato, cancellato al salvataggio riuscito e comunque dopo 24 ore. Se l'archivio non è disponibile (navigazione privata), l'app funziona lo stesso, senza bozze.
- **Alternativa**: bozze sul server (sopravvivono al cambio di dispositivo, ma aggiungono tabelle, traffico e un altro caso di conflitto).
- **Risposta**: _da compilare_.

### R-7 Funzionamento completamente offline (priorità C)

- **Domanda**: l'app deve funzionare senza rete per ore (app installabile, dati in cache)?
- **Proposta**: **fuori ambito fino alla 1.0**: richiede una sincronizzazione con risoluzione dei conflitti molto più complessa dei lock consultivi, e il Pokédex è sul server. Per l'MVP basta R-1. Da rivalutare dopo la prima partita vera con la 0.1.
- **Alternativa**: partire subito con un'app installabile con sincronizzazione differita.
- **Risposta**: _da compilare_.

### Come si verifica

- **P1-16** (prova della sincronizzazione SSE tra due browser) misura la riconnessione e il recupero degli eventi mancanti, e controlla che un reverse proxy davanti all'app non memorizzi in blocco le risposte SSE (da documentare nella Guida di installazione, P3-13).
- **P7-02** (test end-to-end) simula il calo di rete con Playwright (browser senza rete) su R-1, R-2 e R-3.

## Emerse dai PBI di fase 1

### D-1 Un "gioco" è una versione o una coppia (priorità A)

- **Contesto** (P1-01): PokéAPI raggruppa le versioni gemelle in un *version group* (Nero e Bianco insieme). Ma tra le due versioni cambiano gli incontri, le aree (White Forest solo in Bianco) e gli scambi.
- **Proposta**: il gioco della run è una **versione** (`black`, `white`, `black-2`, `white-2`), come già nei file di `data/games/`; il version group serve per le meccaniche e i learnset.
- **Alternativa**: il gioco è la coppia e la versione è un'opzione della run (meno file, ma la run deve comunque distinguere gli incontri).
- **Nota**: oggi è una scelta fatta da me in P1-01 e P1-06; chiedo la conferma.
- **Risposta**: _da compilare_.

### D-2 L'ordine delle aree è obbligatorio? (priorità A)

- **Contesto** (P1-06): l'ordine dei file è quello consigliato della storia. Il postgame e molte aree opzionali si visitano in ordine libero, e due giocatori possono arrivare in un'area in momenti diversi.
- **Proposta**: l'ordine serve solo a **mostrare** l'elenco (e a collocare le tappe di medaglie e level cap, "dopo l'area"); ogni area si può registrare in qualunque momento, senza blocchi.
- **Alternativa**: sbloccare le aree solo dopo le precedenti (impedisce errori, ma non funziona nelle aree facoltative).
- **Risposta**: _da compilare_.

### D-3 Stanze interne: area separata o unita? (priorità A)

- **Contesto** (P1-06): PokéAPI separa le stanze interne di alcune aree: Guidance Chamber (Mistralton Cave), Trial Chamber (Victory Road di Nero e Bianco), Rocky Mountain Room, Iron Room e Glacier Room (Underground Ruins di Nero 2 e Bianco 2). nuzlocke.data le ignora e considera l'area principale. Separate, danno un incontro in più per ogni stanza.
- **Proposta**: **unite** all'area principale, come nelle regole della community e in nuzlocke.data, la fonte scelta per l'ordine; le stanze restano nei dati come informazione.
- **Alternativa**: separate (più incontri, in linea con PokéAPI).
- **Nota**: nei file attuali sono separate, per una scelta mia in P1-06. Con la tua risposta le unisco o le lascio.
- **Risposta**: _da compilare_.

### D-4 Grotte nascoste di Nero 2 e Bianco 2 (priorità B)

- **Contesto** (P1-06): PokéAPI le registra con il metodo `hidden-grotto`; oggi sono escluse dai file di gioco.
- **Proposta**: trattarle come gli **incontri fissi**: con la regola "regali separati" attiva sono un incontro a parte, altrimenti contano come incontro dell'area in cui si trovano ([decisione 17](../decisioni.md#17-regali-incontri-fissi-e-scambi-in-gioco)). La specie si sceglie liberamente, senza suggerimenti.
- **Alternativa**: vietarle (non contano mai) o contarle sempre come incontro separato.
- **Risposta**: _da compilare_.

### D-5 Difficoltà di Nero 2 e Bianco 2 (priorità A)

- **Contesto** (P1-07): in Nero 2 e Bianco 2 le squadre dei boss cambiano con la difficoltà (facile, normale, sfida), e quindi i level cap (Cheren: 12, 13, 14). I dati hanno normale e sfida per palestre, Superquattro e campione, e facile solo per Cheren.
- **Proposta**: la difficoltà è un'**impostazione della run**, uguale per tutti i giocatori, con **normale** di default; il level cap segue quella scelta.
- **Alternativa**: sempre normale (più semplice, ma sbagliato per chi gioca in sfida).
- **Nota**: se la proposta va bene, servono i livelli della modalità facile per tutti i boss: oggi sono solo quelli di Cheren.
- **Risposta**: _da compilare_.

### D-6 Il level cap è per run o per giocatore? (priorità A)

- **Contesto** (P1-07): i giocatori di una run dovrebbero giocare insieme, ma le medaglie sono per giocatore. Il Modello dati ha un solo `level_cap_override` per la run.
- **Proposta**: il cap si calcola **per giocatore** dal suo avanzamento (di norma coincide con quello degli altri); l'override manuale resta **uno per run**.
- **Alternativa**: un solo cap per la run, dal giocatore più indietro.
- **Risposta**: _da compilare_.

### D-7 Come si registrano le tappe senza medaglia (priorità A)

- **Contesto** (P1-07): dopo l'ottava medaglia il level cap dipende da tappe senza medaglia (Superquattro, Ghetsis, campione), e per i giochi senza palestre (Sole e Luna) non ci sono medaglie. Il Modello dati registra solo medaglie (`run_badge`).
- **Proposta**: sostituire `run_badge` con **`run_milestone`** (giocatore, chiave della tappa, data): le medaglie diventano un attributo delle tappe, e tutto funziona nello stesso modo per ogni gioco.
- **Alternativa**: tenere `run_badge` e aggiungere una seconda tabella per le altre tappe.
- **Nota**: è una scelta di modellazione; se vuoi, la lasci a me in P2-06.
- **Risposta**: _da compilare_.

### D-8 Nomi italiani delle aree e delle medaglie (priorità B)

- **Contesto** (P1-04, P1-06, P1-07): PokéAPI non ha nomi italiani delle località di Unima (0 su 122); le fonti italiane (per esempio Pokémon Central) non sono raggiungibili dall'ambiente dell'agente.
- **Proposta**: in italiano, "Route N" diventa **"Percorso N"** per regola (copre i percorsi, una parte minoritaria delle aree); per le altre aree e per le medaglie si usa l'inglese come riserva finché non c'è un elenco. L'elenco lo puoi dare tu o lo compilo in una sessione con accesso a una fonte italiana.
- **Alternativa**: lasciare tutto in inglese per l'MVP.
- **Risposta**: _da compilare_.

### D-9 Giochi in 0.5 e in 1.0; Let's Go e Leggende; espansioni (priorità B)

- **Contesto** (P1-01): il rilascio dei giochi diversi dalla quinta generazione è solo proposto (17 giochi con dati in nuzlocke.data in 0.5; Let's Go e i due Leggende in 1.0). Let's Go non ha lotte selvatiche, i Leggende non hanno palestre. Le espansioni (isola solitaria dell'armatura, maschera turchese e così via) sono version group separati in PokéAPI.
- **Proposta**: come in P1-01, con le espansioni trattate come **aree in coda al gioco base**, e i giochi senza palestre con la regola delle tappe ([Dati di gioco](11-Dati-di-gioco.md#regola-per-i-giochi-senza-palestre)).
- **Alternativa**: escludere Let's Go e Leggende dalla 1.0, oppure trattare le espansioni come giochi separati.
- **Risposta**: _da compilare_.

### D-10 Fonti degli incontri per Gen 8 e Gen 9 (priorità B)

- **Contesto** (P1-04): PokéAPI non ha nessun incontro per Diamante Lucente e Perla Splendente, Leggende: Arceus, Scarlatto e Violetto e Leggende: Z-A.
- **Proposta**: per Diamante Lucente, Perla Splendente, Scarlatto e Violetto, **nuzlocke.data** (ha le specie per area); per Leggende, **nessun suggerimento**: la specie si sceglie dal Pokédex, come con il flag randomizer.
- **Alternativa**: inserimento a mano di tutti gli incontri (molto lavoro, nessuna fonte raggiungibile).
- **Risposta**: _da compilare_.

### D-11 Sciami, White Forest, livelli degli scambi (priorità C)

- **Contesto** (P1-04, P1-06): in Nero e Bianco PokéAPI non ha gli sciami e gli incontri di White Forest; nuzlocke.data li ha ma senza distinguerli e con errori. I livelli dei 5 scambi di Nero e Bianco non sono riportati dalle fonti consultate.
- **Proposta**: **nessun suggerimento** per sciami e White Forest finché non c'è una fonte verificata (la specie si sceglie dal Pokédex); livello dello scambio vuoto, lo inserisce il giocatore.
- **Alternativa**: usare l'elenco di nuzlocke.data non verificato.
- **Risposta**: _da compilare_.

### D-12 Colore della run per gioco (priorità C)

- **Contesto**: il design system prevede un colore della run per gioco (`run-accent`); nei file è `null`.
- **Proposta**: lo sceglie il design in P2-12, con il controllo del contrasto già previsto.
- **Risposta**: _da compilare_.

## Scelte mie da confermare

### S-1 Registro delle decisioni al posto di `docs/adr/` (priorità C)

Le Linee guida prevedono un file per decisione in `docs/adr/`; tu hai chiesto `docs/decisioni.md`. **Proposta**: tenere solo `decisioni.md` e aggiornare le Linee guida nel PBI di P3-01. **Risposta**: _da compilare_.

### S-2 Dipendenze "In verifica" per i PBI di sviluppo (priorità B)

Le verifiche dei PBI di sviluppo si fanno a gruppi a fine rilascio. **Proposta**: per decidere se un PBI è avviabile, una dipendenza "In verifica" con la PR unita su `develop` conta come completata (oggi scritto in `CLAUDE.md`). **Alternativa**: serve "Completato", e quindi una verifica del product owner dopo ogni PBI. **Risposta**: _da compilare_.

### S-3 `npm audit` nella verifica locale (priorità C)

Con la decisione 26 Dependabot non è attivo, quindi nessun avviso sulle vulnerabilità. **Proposta**: `npm audit --audit-level=high` dentro `npm run verify` (P3-11), come **avviso** che non blocca il push (a rete assente non deve fallire). **Alternativa**: nessun controllo. **Risposta**: _da compilare_.

### S-4 Diagramma di architettura con Neon (priorità C)

Il segnaposto del diagramma nella Specifica cita ancora Neon, scartato. **Proposta**: ridisegnarlo con la progettazione dell'architettura (P2-08); il PDF resta una copia storica. **Risposta**: _da compilare_.

## Criteri di P1-19

- [x] Dupes clause: deciso il 3 ottobre 2026.
- [x] Starter, incontri fissi e scambi: deciso il 3 ottobre 2026.
- [ ] Verificato con il product owner il disegno dei lock: aspetta la risposta a R-3.
- [ ] Definito il comportamento con rete instabile: aspetta le risposte a R-1…R-7.
- [ ] Specifica aggiornata con le decisioni prese: dopo le risposte.

P1-19 resta **In corso** finché non rispondi: le decisioni spettano a te, e non chiudo il PBI al posto tuo.
