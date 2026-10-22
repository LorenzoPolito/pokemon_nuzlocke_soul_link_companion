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
- Con registrazione su invito, vale come invito sia quello all'app sia quello a una run: chi arriva da un link di invito può registrarsi. Con registrazione chiusa nessun invito crea un account; un invito alla run si può accettare solo con un account esistente.
- Un invito a una run può riservare un **posto in attesa** ([P2-11](06-Modello-dati-bozza.md#p2-11-posti-in-attesa)): chi accetta occupa quel posto e vede i dati già inseriti dal proprietario.
- Un invito è usabile `max_uses` volte; revocato o scaduto non funziona. Il token in chiaro si mostra una volta sola.

### Come si applica

- `authorize` riceve l'utente della sessione, l'azione (un nome del catalogo delle API, P2-09), la risorsa (run, membro, dato) e restituisce permesso o motivo del rifiuto. Il ruolo nella run si legge da `run_member` a ogni richiesta; non si fida mai di un ruolo inviato dal client.
- La matrice è una tabella di dati nel codice e **un test la percorre tutta**: per ogni azione e ogni ruolo (compresi non membro, disattivato, cambio password pendente, run non attiva) il risultato atteso è scritto una volta e provato.
- Gli abbonamenti SSE controllano l'appartenenza all'apertura e ogni volta che si riapre il flusso; un membro rimosso viene scollegato.
- Le scritture accettano solo richieste dello stesso sito con corpo JSON (il controllo di origine di SvelteKit rifiuta le altre, come visto nelle prove di P1-16) e portano la chiave di idempotenza ([ADR 0002](../adr/0002-rete-instabile.md)).
- I tentativi di login ripetuti sono limitati (P3-07).

### Domande aperte

- Modifica dei dati di un altro giocatore: la proposta sopra (propri, più azioni di gruppo; il proprietario può tutto) va confermata.
- L'admin non entra nei dati di gioco di una run senza esserne membro: proposta, per tenere separati il gestore del server e le partite.

## P2-09 Catalogo delle API

Data: 20 ottobre 2026. Taglia M. Elenco degli endpoint dell'app. Le azioni nella colonna «Permesso» sono quelle usate da `authorize` ([P2-08](#p2-08-modello-dei-permessi)); la tabella delle azioni è in fondo.

### Convenzioni

- **Formato.** JSON su HTTP, percorsi sotto `/api`. Date in millisecondi UTC (interi), identificativi UUIDv7 come stringhe, chiavi del Pokédex e dei dati di gioco come stringhe (`surf`, `unova-route-4`). Le risposte di scrittura restituiscono il dato aggiornato con la sua `version`.
- **Autenticazione.** Cookie di sessione di Better Auth. Senza sessione: 401. Con cambio password obbligatorio o utente disattivato: 403 con codice `password_change_required` o `account_disabled`, tranne per `change-password`, `sign-out` e `GET /api/me`.
- **Better Auth.** Le sue rotte stanno sotto `/api/auth/*` (registrazione, accesso, uscita, cambio password, sessione) e non si ridefiniscono qui; l'app aggiunge un controllo prima della registrazione (modalità di registrazione e inviti) e sul login (utente disattivato).
- **Idempotenza.** Ogni `POST`, `PUT`, `PATCH` e `DELETE` sotto `/api/runs` e `/api/admin` richiede l'intestazione `Idempotency-Key` (UUID generato dal client). Il server salva (utente, chiave, esito, risposta) in `request_key` per 24 ore: una richiesta ripetuta restituisce la prima risposta con l'intestazione `Idempotent-Replay: true` e non fa nulla. La stessa chiave con un corpo diverso è un errore 409 `idempotency_mismatch`. Senza l'intestazione: 400 `idempotency_key_required` ([ADR 0002](../adr/0002-rete-instabile.md)).
- **Versioni e «vince l'ultimo».** Il client invia nel corpo la `version` letta (`baseVersion`). Il server non rifiuta mai per versione diversa: salva, incrementa e, se `baseVersion` era vecchia, include nella risposta `overwrote: { version, values }` con quanto è stato sovrascritto. Chi era stato sovrascritto lo riceve anche via SSE.
- **Errori.** Corpo `{ "error": { "code": "...", "message": "...", "details": {...} } }` con codici stabili (tabella sotto). I messaggi sono in lingua dell'utente; il client si basa sul codice.
- **Elenchi.** `limit` (predefinito 50, massimo 200) e `after` (identificativo dell'ultimo elemento ricevuto); risposta con `items` e `next` (NULL a fine elenco).
- **Non membri.** Una risorsa di una run di cui non si è membri risponde 404, come ogni risorsa inesistente.
- **Run non attiva.** Le scritture sui dati di gioco di una run `lost`, `completed` o cancellata rispondono 409 `run_not_active`, tranne la riapertura e il ripristino.
- **Lingua.** `Accept-Language` o la preferenza dell'utente decidono i nomi nei dati del Pokédex; l'inglese è la riserva.

### Codici di errore

| Stato | Codice | Quando |
| --- | --- | --- |
| 400 | `idempotency_key_required`, `bad_request` | Intestazione mancante, JSON non valido |
| 401 | `unauthenticated` | Nessuna sessione |
| 403 | `forbidden`, `password_change_required`, `account_disabled`, `registration_closed` | Permesso negato (il ruolo c'è ma l'azione no), stato dell'account, registrazione non consentita |
| 404 | `not_found` | Risorsa inesistente o non visibile |
| 409 | `idempotency_mismatch`, `group_inconsistent`, `run_not_active`, `game_locked`, `area_taken`, `dupe_clause_required`, `dupe_clause_not_applicable`, `team_full`, `type_clause_violation`, `group_not_linked`, `group_dead`, `already_member`, `last_admin`, `last_owner`, `invite_invalid` | Violazione di una regola o dello stato; `details` dice quale |
| 422 | `validation` | Il corpo non rispetta lo schema (`details.fields`) |
| 429 | `rate_limited` | Troppi tentativi (login, inviti) |
| 500 | `internal` | Errore inatteso; non rivela dettagli |

### Account

| Metodo e percorso | Input | Output | Errori | Permesso |
| --- | --- | --- | --- | --- |
| `GET /api/me` | | Utente, ruolo globale, preferenze, `mustChangePassword`, run in cui è membro (id, nome, ruolo) | 401 | `me.read` |
| `PATCH /api/me` | `name`, `locale`, `theme` (almeno uno) | Utente | 422 | `me.update` |
| `GET /api/invites/{token}` | | Tipo, run e ruolo offerti, validità (senza rivelare altro) | 404 `invite_invalid` | pubblico |
| `POST /api/invites/{token}/accept` | | Run o conferma di registrazione | 409 `invite_invalid`, `already_member` | `invite.accept` |
| `POST /api/invites/{token}/decline` | | 204; l'invito è revocato, il posto resta in attesa | 409 `invite_invalid` | `invite.accept` |
| `GET /api/health` | | `{ ok: true }` | | pubblico |

### Amministrazione

| Metodo e percorso | Input | Output | Errori | Permesso |
| --- | --- | --- | --- | --- |
| `GET /api/admin/users` | `limit`, `after`, `q` | Elenco utenti (id, nome, email, ruolo, disattivato, creato il) | | `admin.users.read` |
| `PATCH /api/admin/users/{id}` | `role` o `banned` (con `banReason`) | Utente | 409 `last_admin` | `admin.users.update` |
| `POST /api/admin/users/{id}/reset-password` | `newPassword` | Utente con `mustChangePassword` vero | 422 | `admin.users.update` |
| `DELETE /api/admin/users/{id}` | | 204; l'utente è anonimizzato, le sue run restano | 409 `last_admin` | `admin.users.delete` |
| `GET /api/admin/settings/registration` · `PUT` | `mode`: `open`, `invite`, `closed` | Modalità | 422 | `admin.settings.update` |
| `GET /api/admin/invites` · `POST` · `DELETE /{id}` | `maxUses`, `expiresAt` · | Invito con token (solo alla creazione) | 422 | `admin.invites.manage` |
| `GET /api/admin/areas` · `POST` · `PATCH /{id}` | `gameId`, `name`, `afterAreaKey` · `archived` | Area personalizzata | 409 se il nome esiste per quel gioco | `admin.areas.manage` |
| `GET /api/admin/runs` | `limit`, `after`, `deleted` | Elenco (id, nome, proprietario, stato, cancellata il) | | `admin.runs.read` |
| `POST /api/admin/runs/{id}/restore` | | Run | 409 se oltre 30 giorni | `admin.runs.restore` |

### Dati di riferimento

Pokédex e dati di gioco non dipendono da una run. Gli ultimi tre servono i dati effettivi di una run (override compresi).

| Metodo e percorso | Input | Output | Errori | Permesso |
| --- | --- | --- | --- | --- |
| `GET /api/games` | | Giochi disponibili (id, nomi, generazione, difficoltà possibili) | | `reference.read` |
| `GET /api/games/{gameId}` | | Aree in ordine (con `parentAreaKey`), incontri speciali, tappe con level cap, aree personalizzate non archiviate | 404 | `reference.read` |
| `GET /api/pokedex/species` | `q`, `gen`, `limit`, `after` | Elenco con nome, tipi, id | | `reference.read` |
| `GET /api/pokedex/species/{id}` | `gen` o `game`, `lang` | Scheda: varietà, tipi, statistiche, abilità, evoluzioni | 404 | `reference.read` |
| `GET /api/pokedex/moves` · `/{id}` · `/abilities` · `/natures` | `q`, `game` | Elenchi e schede (valori per il gruppo di versioni del gioco) | 404 | `reference.read` |
| `GET /api/mechanics/type-chart` | `gen` | Tabella dei tipi dell'epoca | 422 | `reference.read` |
| `GET /api/runs/{runId}/members/{memberId}/species/{speciesId}` | `variety` | Dati effettivi: ogni campo con `source` (`override` o `pokedex`) | 404 | `run.read` |
| `GET /api/runs/{runId}/areas` | | Aree del gioco in ordine unite ai gruppi esistenti (stato per giocatore) | 404 | `run.read` |
| `GET /api/runs/{runId}/members/{memberId}/level-cap` | | Level cap calcolato e sua origine (tappa, difficoltà, riserva `normal`, override) | 404 | `run.read` |

### Run e membri

| Metodo e percorso | Input | Output | Errori | Permesso |
| --- | --- | --- | --- | --- |
| `GET /api/runs` | `deleted` (solo proprietario), `status` (`active`, `ended`) | Le mie run: id, nome, gioco, generazione, numero di giocatori, stato, ruolo, ultima attività, `randomizer`, e un riepilogo per chi guarda: medaglie del proprio giocatore, gruppi vivi e gruppi morti | | `run.list` |
| `POST /api/runs` | `name`, `gameId`, `settings`, `seats` (nome, ruolo, posto dei giocatori invitati: crea i posti in attesa e un invito per ognuno) e, se già iniziata (`startedInProgress`), l'avanzamento: tappe per giocatore, aree già visitate, gruppi con esemplari e posizioni | Run, membro proprietario, posti in attesa con il loro invito (token in chiaro solo qui) | 422, 409 `group_inconsistent` | `run.create` |
| `GET /api/runs/{id}` | | Istantanea: run, membri, gruppi, incontri, esemplari, tappe, override, `lastEventId` | 404 | `run.read` |
| `PATCH /api/runs/{id}` | `name`, `settings` (parziale), `baseVersion` | Run | 409 `game_locked` (impostazioni bloccate dopo il primo incontro), 409 `run_not_active` | `run.update` |
| `PUT /api/runs/{id}/level-cap-override` | `value` (1–100) o `null` | Run | 422 | `run.update` |
| `POST /api/runs/{id}/status` | `status`: `lost`, `completed`, `active`; `endInfo` | Run | 409 transizione non ammessa | `run.status` |
| `POST /api/runs/{id}/transfer-ownership` | `memberId` | Membri | 409 `last_owner` se non è un giocatore | `run.transfer` |
| `DELETE /api/runs/{id}` · `POST /api/runs/{id}/restore` | | 204 · Run | 409 oltre 30 giorni | `run.delete` · `run.restore` |
| `GET /api/runs/{id}/invites` · `POST` · `DELETE /{inviteId}` | `role`, `maxUses`, `expiresAt` | Invito (token in chiaro solo alla creazione) | 422 | `run.invite` |
| `PATCH /api/runs/{id}/members/{memberId}` | `role`, `seat` | Membro | 409 `last_owner` | `run.members.update` |
| `DELETE /api/runs/{id}/members/{memberId}` | | 204 (rimozione o uscita) | 409 `last_owner` | `run.members.remove` / `run.leave` |

### Incontri, gruppi ed esemplari

Le regole del Soul Link sono **applicate dal server** in una sola transazione per richiesta, con il diario aggiornato nella stessa transazione. Il client non è mai l'autorità: l'interfaccia può anticipare un errore, il server lo ripete.

| Metodo e percorso | Input | Output | Errori | Permesso |
| --- | --- | --- | --- | --- |
| `POST /api/runs/{id}/encounters` | `memberId`, `areaKey`, `slot`, `specialKey?`, `outcome`, `speciesId`, `varietyId?`, `levelMet`, e per `caught`: `specimen` (soprannome, livello, natura, abilità, mosse) | Incontro, gruppo con il nuovo stato, esemplare, gruppi cambiati | 409 `area_taken`, `dupe_clause_required`, `dupe_clause_not_applicable`, 422 | `encounter.create` |
| `PATCH /api/runs/{id}/encounters/{encounterId}` | `outcome?`, `speciesId?`, `levelMet?`, `baseVersion` | Incontro, gruppo | 409 `group_dead` | `encounter.update` |
| `DELETE /api/runs/{id}/encounters/{encounterId}` | | 204; ricalcola il gruppo | | `encounter.delete` |
| `PATCH /api/runs/{id}/specimens/{specimenId}` | `nickname`, `level`, `nature`, `ability`, `teraType`, `moves`, `speciesId`/`varietyId` (evoluzione), `baseVersion` | Esemplare | 422 | `specimen.update` |
| `POST /api/runs/{id}/groups/{groupId}/move` | `position`: `team`, `box` | Gruppo con la nuova posizione (e quella dei partner) | 409 `group_not_linked`, `group_dead`, `team_full`, `type_clause_violation` | `group.move` |
| `POST /api/runs/{id}/groups/{groupId}/death` | `fallenSpecimenId`, `cause` (avversario, mossa, area, nota) | Gruppo `dead`, esemplari morti, stato della run (`lost` se wipe) | 409 `group_not_linked`, `group_dead` | `group.die` |
| `PATCH /api/runs/{id}/groups/{groupId}/death-cause` | `cause` | Gruppo | 409 se il gruppo non è morto | `group.die` |
| `PUT /api/runs/{id}/members/{memberId}/milestones/{key}` · `DELETE` | `obtainedAt?` | Tappa; level cap ricalcolato | 422 chiave inesistente | `milestone.set` |
| `GET /api/runs/{id}/members/{memberId}/overrides` | | Override del giocatore | | `run.read` |
| `PUT /api/runs/{id}/members/{memberId}/overrides/{speciesId}/{varietyId}/{field}` · `DELETE` | `value`, `baseVersion` | Override · 204 | 422 | `override.set` |
| `DELETE /api/runs/{id}/members/{memberId}/overrides/{speciesId}/{varietyId}` | | 204, ripristina tutta la specie | | `override.set` |
| `POST /api/runs/{id}/overrides/copy` | `fromMemberId`, `toMemberId`, `speciesIds?` | Override copiati | 409 | `override.copy` |

### Regole del Soul Link applicate dal server

| Operazione | Regole verificate |
| --- | --- |
| Registrare un incontro | La run è attiva; il membro è giocatore o proprietario; il gioco ha quell'area o incontro speciale e la chiave effettiva si calcola con `separateRooms`; un solo incontro valido per giocatore e gruppo (`area_taken`); con la dupes clause accesa, la specie della stessa catena evolutiva di un esemplare già posseduto (anche morto) deve essere registrata come `dupe` (`dupe_clause_required`) e un `dupe` senza specie posseduta è rifiutato (`dupe_clause_not_applicable`); un regalo non fallisce né fugge |
| Dopo ogni incontro | Ricalcolo dello stato del gruppo (`open`, `linked`, `skipped`, `untracked`) e di tutti i partner nella stessa transazione ([P2-03](06-Modello-dati-bozza.md#p2-03-aree-incontri-e-link-soul-link)) |
| Spostare in team | Gruppo `linked`, non morto; al massimo 6 esemplari in team **per ogni giocatore** coinvolto (`team_full`); con `typeClause`, nessun tipo primario ripetuto nel team di ogni giocatore (`type_clause_violation`) |
| Dichiarare una morte | Gruppo `linked` e non già morto; tutti i partner passano a `dead` insieme; se un giocatore resta senza esemplari vivi, la run diventa `lost` con `endInfo` di tipo `wipe` |
| Cambiare le impostazioni | Dopo il primo incontro `separateRooms`, `difficulty`, `dupesClause`, `separateGifts` e `typeClause` sono rifiutate (`game_locked`); `damageCalculator` e `randomizer` registrano un evento |
| Modificare un esemplare | L'abilità è tra quelle possibili con gli override del giocatore; al massimo 4 mosse senza ripetizioni |
| Cambiare ruolo o rimuovere un giocatore | Un solo proprietario (`last_owner`); gruppi `open` ricalcolati; nuovi giocatori ricevono incontri `untracked` per i gruppi già terminali |

### Timeline, lock e flusso

| Metodo e percorso | Input | Output | Errori | Permesso |
| --- | --- | --- | --- | --- |
| `GET /api/runs/{id}/events` | `after` (id dell'ultimo evento ricevuto), `limit`, `type` | Eventi con `id`, `type`, attore, entità, payload; `next`; `truncated: true` se oltre la soglia | 404 | `run.read` |
| `POST /api/runs/{id}/locks` | `resource` (`encounter:<id>`, `specimen:<id>`, `milestones:<memberId>`, `overrides:<memberId>:<speciesId>`, `settings`) | Lock (`holder`, `expiresAt`) o lo stato attuale se è di un altro | 403 spettatore | `lock.take` |
| `PUT /api/runs/{id}/locks/{resource}` | | Lease rinnovato (60 s) | 404 se scaduto | `lock.take` |
| `DELETE /api/runs/{id}/locks/{resource}` | | 204 | | `lock.take` |
| `GET /api/runs/{id}/stream` | `Last-Event-ID` (intestazione) | Flusso SSE, vedi [P2-10](#p2-10-catalogo-degli-eventi-sse) | 404 | `run.stream` |

Il lock è consultivo: un salvataggio senza lock o con lock di altri passa comunque (l'interfaccia ha chiesto conferma); il server non lo impone.

### Azioni e permessi

Le azioni elencate corrispondono alle righe della matrice di P2-08: `me.read`, `me.update`, `invite.accept`, `admin.*` (admin globale), `reference.read` (qualunque utente autenticato), `run.list`, `run.create`, `run.read`, `run.stream`, `run.update`, `run.status`, `run.transfer`, `run.delete`, `run.restore`, `run.invite`, `run.members.update`, `run.members.remove`, `run.leave`, `encounter.create|update|delete`, `specimen.update`, `group.move`, `group.die`, `milestone.set`, `override.set`, `override.copy`, `lock.take`. Per `encounter.*`, `specimen.update`, `milestone.set` e `override.*` il giocatore agisce sui propri dati, il proprietario su quelli di tutti; per `group.move` e `group.die` basta essere giocatore o proprietario.

### Fuori dall'MVP

Squadre viste in lotta (`seen_trainer`, `seen_pokemon`, rilascio 0.3), esportazione e importazione (rilascio 0.4) e le sezioni del Pokédex del rilascio 1.0 avranno i loro endpoint nel catalogo quando i PBI saranno pianificati.

### Domande aperte

- Cancellare un incontro catturato (ricalcolo del gruppo, esemplare eliminato) è riservato al proprietario: da confermare.
- `GET /api/runs/{id}` restituisce l'intera istantanea: una run ha qualche centinaio di righe, quindi un'unica risposta va bene; si rivaluta dopo la prima partita vera.

## P2-10 Catalogo degli eventi SSE

Data: 20 ottobre 2026. Taglia S. Il flusso `GET /api/runs/{id}/stream` ([P2-09](#p2-09-catalogo-delle-api)) porta i cambiamenti della run a tutti i collegati. Le regole di rete sono quelle dell'[ADR 0002](../adr/0002-rete-instabile.md); la prova di fattibilità è [P1-16](14-Prove-di-fattibilita.md#p1-16-prova-sync-sse-tra-due-browser).

### Formato

Ogni evento è un messaggio SSE con `event:` = nome dell'evento, `data:` = JSON, e, **solo per gli eventi persistenti**, `id:` = identificativo della riga del diario (`run_event.id`, UUIDv7, ordinato nel tempo). Gli eventi senza `id` non cambiano `Last-Event-ID`.

- **Persistenti**: ogni riga del diario ([P2-04](06-Modello-dati-bozza.md#p2-04-esemplari-morte-ed-eventi)); si possono recuperare dopo una riconnessione. Il nome è il `type` del diario (`encounter.recorded`, `group.died`, …).
- **Effimeri**: lock, segnale, controllo; nessun `id`, nessun recupero.

I dati di un evento persistente:

```json
{
  "id": "0192f3…",
  "type": "group.died",
  "actorUserId": "…",
  "createdAt": 1790000000000,
  "entity": "link_group",
  "entityId": "…",
  "payload": { "before": {}, "after": {} },
  "changes": [
    { "entity": "link_group", "id": "…", "version": 7, "value": { } },
    { "entity": "specimen", "id": "…", "version": 3, "value": { } },
    { "entity": "run", "id": "…", "version": 12, "value": null }
  ]
}
```

`changes` elenca **tutte le entità cambiate** con il loro valore completo e la nuova `version` (`value: null` se eliminata). Il client non ricalcola mai le regole del Soul Link: applica le `changes`. Una azione di gruppo (morte, spostamento) è un solo evento con tutti i partner in `changes`. Il client applica una `change` solo se la sua `version` è maggiore o uguale a quella locale, e ignora un evento con `id` già applicato: così un evento ripetuto non fa danni.

### Eventi persistenti

Destinatari: **tutti i membri** della run (proprietario, giocatori, spettatori), salvo dove indicato. Le entità in `changes` sono tra `run`, `run_member`, `link_group`, `encounter`, `specimen`, `run_milestone`, `species_override`.

| Evento | Quando | Entità in `changes` |
| --- | --- | --- |
| `run.created`, `run.deleted`, `run.restored` | Vita della run | `run` |
| `run.settings_changed`, `run.status_changed`, `run.owner_changed` | Impostazioni, stato, proprietario | `run`, `run_member` |
| `levelcap.override_set` | Override del level cap | `run` |
| `member.joined`, `member.declined`, `member.role_changed`, `member.removed` | Giocatori (`member.declined` quando un invitato rifiuta: il posto resta in attesa); con `member.removed` il server chiude il flusso del membro rimosso | `run_member`, gruppi ricalcolati |
| `group.created`, `group.linked`, `group.skipped`, `group.moved`, `group.died`, `group.death_corrected` | Gruppi | `link_group`, `specimen` dei partner |
| `encounter.recorded`, `encounter.corrected`, `encounter.deleted` | Incontri | `encounter`, `link_group`, `specimen` |
| `specimen.created`, `specimen.updated`, `specimen.evolved`, `specimen.corrected` | Esemplari | `specimen` |
| `milestone.reached`, `milestone.revoked` | Tappe | `run_milestone` |
| `override.set`, `override.cleared` | Override | `species_override` |

`group.linked` e `group.skipped` non sono eventi a sé quando seguono una registrazione: viaggiano come `changes` dell'evento `encounter.recorded`, che porta anche il motivo nel payload; restano tipi del diario per la timeline.

### Eventi effimeri

| Evento | Destinatari | Dati | Quando |
| --- | --- | --- | --- |
| `hello` | Il solo client che si collega | `bootId` (cambia a ogni avvio del server), `serverTime`, `lastEventId` della run, `heartbeatSeconds` (15) | A ogni connessione, per primo |
| `ping` | Ogni client | `serverTime` | Ogni 15 secondi |
| `reset` | Il solo client | `reason`: `too_many_events`, `unknown_event_id`, `server_restarted`, `access_changed` | Quando non si può recuperare per eventi: il client ricarica l'istantanea |
| `locks.snapshot` | Il solo client | Lock attivi: `resource`, `holder` (utente), `expiresAt` | Dopo `hello` e dopo il recupero |
| `lock.taken`, `lock.renewed` | Membri non spettatori e spettatori | `resource`, `holder`, `expiresAt` | Presa e rinnovo ogni 20 secondi |
| `lock.released` | Idem | `resource` | Rilascio, annullamento, chiusura, scadenza |
| `conflict.overwritten` | **Solo l'utente la cui modifica è stata sovrascritta** (tutte le sue connessioni) | `entity`, `id`, `yourVersion`, `newVersion`, `newValue`, `byUserId` | Un salvataggio con `baseVersion` vecchia |
| `session.expired` | Il client | | La sessione è scaduta o l'utente è stato disattivato; il flusso si chiude |

`ping` è un evento con nome e non un commento SSE: l'API `EventSource` del browser non mostra i commenti, e il client deve poter vedere che il flusso è vivo per mostrare l'avviso dopo 40 secondi. (La prova P1-16 usava un commento per tenere aperta la connessione: basta per il proxy, non per l'avviso del client.)

### Connessione e recupero

1. Il client carica l'istantanea (`GET /api/runs/{id}`), che include `lastEventId`, e apre il flusso con quell'identificativo.
2. L'identificativo si passa con l'intestazione `Last-Event-ID` (riconnessione automatica del browser) **o** con il parametro `?lastEventId=` (apertura manuale, necessaria per l'attesa crescente di 1, 2, 4, 8… fino a 30 secondi, che `EventSource` non fa da solo).
3. Il server controlla l'accesso, manda `hello`, poi:
   - se `lastEventId` manca: nessun recupero, solo eventi nuovi;
   - se esiste e gli eventi successivi sono al massimo **500**: li rimanda in ordine, con i loro `id`;
   - se sono più di 500, o l'`id` non esiste nel diario della run: manda `reset` e il client ricarica l'istantanea;
   - se `bootId` è diverso da quello visto dal client (riavvio del server): il client considera persi i lock e ricarica l'istantanea (ADR 0002), anche se il recupero sarebbe possibile.
4. Poi `locks.snapshot` e gli eventi in tempo reale. Gli eventi arrivati mentre si faceva il recupero si mettono in coda e si inviano dopo, senza duplicati né buchi (il recupero e l'iscrizione agli eventi nuovi avvengono nella stessa sezione critica).
5. Il client che aveva moduli aperti riprende i propri lock con `POST /locks`; se qualcuno li ha presi nel frattempo, l'interfaccia lo dice e il salvataggio chiede conferma ([ADR 0002](../adr/0002-rete-instabile.md)).

### Segnale e avviso

- Il server manda `ping` ogni 15 secondi; qualunque evento ricevuto azzera il timer del client.
- Dopo **40 secondi senza alcun evento** il client mostra l'avviso «I dati potrebbero non essere aggiornati» e apre una nuova connessione; l'avviso sparisce da solo al riallineamento.
- Senza connessione i pulsanti di salvataggio sono disattivati e le bozze restano nel browser.

### Permessi e limiti

- Il flusso richiede `run.stream` (qualunque membro). Se il permesso cambia (`member.removed`, `member.role_changed` a spettatore per i lock), il server chiude il flusso interessato con `reset` (`access_changed`) o lo restringe.
- Un utente può avere al massimo **5 connessioni** aperte per run (telefono, computer, schede); la sesta chiude la più vecchia con `reset`.
- Coda per connessione: al massimo 200 eventi in attesa; se un client lento non li consuma la connessione si chiude e il client recupera riconnettendosi.
- Le connessioni chiuse (cancel del flusso, errore di scrittura) liberano subito abbonamento e timer; un test di carico di P3-10 le conta.
- Il server è una sola istanza: lo stato dei lock e degli abbonamenti è in memoria ([specifica](01-Specifica-dei-requisiti.md#concorrenza-e-lock)).

### Domande aperte

Nessuna. Le soglie (500 eventi, 5 connessioni, coda di 200) sono proposte da ritoccare dopo la prima partita vera.
