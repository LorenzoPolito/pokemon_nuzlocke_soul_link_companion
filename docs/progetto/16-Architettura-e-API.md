# Nuzlocke SoulLink Companion – Architettura e API

Documento di output di P2-08, P2-09 e P2-10: permessi, catalogo delle API ed eventi SSE. Si aggiorna a ogni modifica di un endpoint o di un evento. Il modello dati è in [06-Modello-dati-bozza.md](06-Modello-dati-bozza.md); le regole sul codice in [Linee guida di sviluppo](05-Linee-guida-di-sviluppo.md).

## P2-08 Modello dei permessi

Data: 20 ottobre 2026. Taglia S.

### Principi

- **Si decide sempre sul server.** L'interfaccia nasconde ciò che non si può fare, ma ogni endpoint e ogni abbonamento SSE controllano il permesso da sé. Una sola funzione, `authorize(utente, azione, risorsa)`, è chiamata da tutti i casi d'uso; nessun endpoint controlla i ruoli per conto suo.
- **Due livelli.** Il ruolo **globale** (`admin`, `user`, [P2-01](06-Modello-dati-bozza.md#p2-01-utenti-sessioni-e-ruoli-globali)) governa l'app; il ruolo **nella run** (`owner`, `player`, `spectator`, [P2-02](06-Modello-dati-bozza.md#p2-02-run-giocatori-e-regole)) governa i dati di una run. Il ruolo globale non dà alcun diritto sui dati di gioco di una run.
- **Nessuna fuga di esistenza.** Per chi non è membro di una run, la run «non esiste» (risposta 404, non 403). Lo stesso vale per i dati figli.
- **Utente disattivato** (ban del plugin `admin`) o con cambio password obbligatorio: nessuna azione, tranne il cambio di password e il logout.
- **Run non attiva** (`lost` o `completed`) o cancellata: sola lettura per tutti, tranne la riapertura o il ripristino.
- **Chi agisce lo sa il diario.** Ogni scrittura registra l'utente nel diario ([P2-04](06-Modello-dati-bozza.md#p2-04-esemplari-morte-ed-eventi)), anche quando il proprietario scrive i dati di un altro giocatore.

### Matrice

Legenda: ✔ consentito; **propri** = solo i dati del proprio giocatore; — vietato. Colonne: `admin` è il ruolo globale (valutato dove la riga lo dice); le altre sono i ruoli nella run. Un utente che non è membro non ha nessun diritto sui dati della run.

**Account e app**

| Azione | Admin | Utente |
| --- | --- | --- |
| Registrarsi | Secondo la modalità di registrazione ([P2-01](06-Modello-dati-bozza.md#modalità-di-registrazione)) | Idem |
| Accedere, uscire, cambiare la propria password, lingua e tema | ✔ | ✔ |
| Elenco utenti, disattivare, reimpostare la password, eliminare (anonimizzare) | ✔ | — |
| Cambiare la modalità di registrazione, creare inviti all'app | ✔ | — |
| Creare, archiviare aree personalizzate | ✔ | — |
| Elenco di tutte le run (nome, proprietario, stato) e ripristino di una run cancellata | ✔ | — |
| Aprire i dati di gioco di una run di cui non si è membri | — | — |
| Consultare Pokédex e dati di gioco | ✔ | ✔ |
| Creare una run | ✔ | ✔ |

L'ultimo admin non si può degradare, disattivare né eliminare.

**Dentro una run**

| Azione | Proprietario | Giocatore | Spettatore |
| --- | --- | --- | --- |
| Leggere la run: aree, incontri, team, box, cimitero, timeline, tappe, override, level cap | ✔ | ✔ | ✔ |
| Seguire la run in tempo reale (SSE) | ✔ | ✔ | ✔ |
| Prendere un lock di modifica | ✔ | ✔ | — |
| Cambiare nome e impostazioni della run (dove consentito) | ✔ | — | — |
| Dichiarare la run persa o completata, riaprirla | ✔ | — | — |
| Cancellare la run, ripristinarla entro 30 giorni | ✔ | — | — |
| Cedere la proprietà | ✔ | — | — |
| Creare inviti alla run (giocatore o spettatore), revocarli | ✔ | — | — |
| Cambiare il ruolo di un membro, rimuoverlo | ✔ | — | — |
| Lasciare la run | ✔ solo dopo aver ceduto la proprietà | ✔ | ✔ |
| Registrare un incontro | ✔ | **propri** | — |
| Correggere o eliminare un incontro | ✔ | **propri** (correggere), — (eliminare) | — |
| Creare e modificare un esemplare (soprannome, livello, natura, abilità, mosse, specie) | ✔ | **propri** | — |
| Spostare un gruppo tra team e box, dichiarare la morte di un gruppo, correggerne la causa | ✔ | ✔ (anche se i partner sono di altri giocatori) | — |
| Registrare e togliere tappe | ✔ | **propri** | — |
| Impostare, ripristinare e copiare override | ✔ | **propri** (copia da un altro giocatore verso se stessi) | — |
| Impostare l'override del level cap della run | ✔ | — | — |
| Usare il calcolatore e l'helper delle lotte | ✔ | ✔ | ✔ |

### Dati di un altro giocatore

Proposta: **un giocatore modifica solo i propri incontri, esemplari, tappe e override; il proprietario modifica quelli di tutti.** Fanno eccezione le **azioni di gruppo** (spostare un gruppo in team o in box, dichiarare la morte), che qualunque giocatore può compiere perché toccano per natura gli esemplari di tutti i partner: la regola «stesso destino» non ha senso se solo il proprietario di ogni esemplare potesse muoverlo. Il diario dice chi ha fatto cosa.

Alternativa scartata: ogni giocatore modifica tutto. È più comodo tra amici, ma un errore o uno scherzo sul dato di un altro è più facile; il proprietario può comunque correggere per chiunque. Se il gruppo vuole la modalità più aperta, si aggiunge in seguito una impostazione della run.

### Inviti e ingresso

- Un invito alla run porta il ruolo (`player` o `spectator`, mai `owner`) e scade; chi lo accetta, già autenticato, diventa membro con quel ruolo ([P2-01](06-Modello-dati-bozza.md#app_setting-e-invite)). Un utente è membro una volta sola per run.
- Con registrazione su invito, un invito all'app crea l'account; un invito alla run richiede un account esistente o ne crea uno se anche la registrazione lo consente.
- Un invito è usabile `max_uses` volte; revocato o scaduto non funziona. Il token in chiaro si mostra una volta sola.

### Come si applica

- `authorize` riceve l'utente della sessione, l'azione (un nome del catalogo di [P2-09](#p2-09-catalogo-delle-api)), la risorsa (run, membro, dato) e restituisce permesso o motivo del rifiuto. Il ruolo nella run si legge da `run_member` a ogni richiesta; non si fida mai di un ruolo inviato dal client.
- La matrice è una tabella di dati nel codice e **un test la percorre tutta**: per ogni azione e ogni ruolo (compresi non membro, disattivato, cambio password pendente, run non attiva) il risultato atteso è scritto una volta e provato.
- Gli abbonamenti SSE controllano l'appartenenza all'apertura e ogni volta che si riapre il flusso; un membro rimosso viene scollegato.
- Le scritture accettano solo richieste dello stesso sito con corpo JSON (il controllo di origine di SvelteKit rifiuta le altre, come visto nelle prove di P1-16) e portano la chiave di idempotenza ([ADR 0002](../adr/0002-rete-instabile.md)).
- I tentativi di login ripetuti sono limitati (P3-07).

### Domande aperte

- Modifica dei dati di un altro giocatore: la proposta sopra (propri, più azioni di gruppo; il proprietario può tutto) va confermata.
- L'admin non entra nei dati di gioco di una run senza esserne membro: proposta, per tenere separati il gestore del server e le partite.
