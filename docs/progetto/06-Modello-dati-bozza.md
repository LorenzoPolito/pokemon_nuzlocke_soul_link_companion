# Nuzlocke SoulLink Companion – Modello dati

Oct 3, 2026 · @Lorenzo

Bozza del modello entità-relazioni del database dell'app (libSQL), anticipata rispetto alla fase 2: copre l'MVP e prepara le funzioni dei rilasci successivi senza doverle migrare. Va confermata dopo P1-06, P1-07 e P1-19. Aggiornata il 19 ottobre 2026 con le decisioni di P1-19 ([ADR 0002](../adr/0002-rete-instabile.md), [ADR 0003](../adr/0003-giochi-aree-e-impostazioni-della-run.md)): `run_badge` è sostituita da `run_milestone`, le impostazioni della run comprendono la difficoltà e le stanze interne; la conferma completa resta al gate della fase 2 (P2-14).

## Principi

Il modello rende impossibili gli stati sbagliati invece di controllarli dopo, e separa ciò che cambia spesso da ciò che è fisso.

- **Stati sbagliati non rappresentabili.** La posizione (team, box, morto) appartiene al gruppo collegato, non al singolo Pokémon: i partner non possono divergere perché il dato esiste una volta sola.
- **Chiavi stabili.** Identificativi UUIDv7, generati dall'app: ordinabili nel tempo, sicuri da ripetere dopo un errore di rete, unibili se un giorno si passa a Turso. Aree, giochi e medaglie si riferiscono con chiavi testuali stabili dei file di gioco (`black-2`, `unova-route-19`), mai con i nomi visualizzati.
- **Ogni riga figlia porta il run\_id.** Permessi, cancellazione e query di una run si fanno con un filtro solo, senza join a catena.
- **Versione su ogni dato modificabile.** Una colonna `version` intera sostiene il "vince l'ultimo" e l'avviso a chi è stato sovrascritto.
- **Diario in sola aggiunta.** Ogni modifica scrive un evento con il prima e il dopo: storia della run, recupero degli errori e audit nello stesso posto.
- **Impostazioni come documento versionato.** Le regole della run sono un JSON validato con uno schema e un numero di versione: una regola nuova si aggiunge con un valore predefinito, senza migrazione.
- **Dati di riferimento fuori dal database.** Pokédex e dati di gioco sono file in sola lettura dentro l'immagine; il database contiene solo ciò che creano gli utenti.
- **Vincoli nel database dove possibile.** Chiavi esterne attive, valori ammessi con CHECK, unicità dove la regola lo richiede; il resto nel dominio, coperto da test.
- **Date in UTC** come millisecondi dall'epoca (INTEGER): ordinabili, compatte, senza ambiguità di fuso.

## Diagramma entità-relazioni

&#91;embedded content: modello entità-relazioni · database dell'app\]

Un gruppo collegato (link\_group) nasce in un'area e raccoglie l'incontro valido di ogni giocatore, anche dopo un suo nuovo tentativo per dupes clause; ogni cattura diventa un esemplare. Tappe superate (medaglie comprese) e override appartengono al giocatore nella run, non all'utente.

## Tabelle principali

Ogni tabella ha `id` TEXT (UUIDv7) come chiave primaria, salvo dove indicato; `created_at` e `updated_at` sono INTEGER in millisecondi UTC e non sono ripetuti qui.

### run

| Colonna | Tipo | Vincoli | Note |
| --- | --- | --- | --- |
| name | TEXT | NOT NULL, 1–60 caratteri | Nome scelto dal proprietario |
| owner\_id | TEXT | FK user | Chi ha creato la run |
| game\_id | TEXT | NOT NULL | Chiave del file di gioco, che è una **versione** (`black`, `white`, `black-2`, `white-2`), non la coppia; non cambia dopo il primo incontro |
| game\_data\_version | TEXT | NOT NULL | Versione dei dati di gioco alla creazione, per riconoscere aree cambiate |
| status | TEXT | CHECK in (active, lost, completed) |  |
| settings | TEXT (JSON) | NOT NULL | Regole opzionali, randomizer, calcolatore, `separateRooms` (stanze interne come aree separate, di base vero, non modificabile dopo il primo incontro) e, per Nero 2 e Bianco 2, `difficulty` (`easy`, `normal`, `challenge`, di base `normal`); validate con Zod |
| settings\_schema | INTEGER | NOT NULL | Versione dello schema di settings |
| started\_in\_progress | INTEGER | 0 o 1 | Run creata a gioco già avviato |
| level\_cap\_override | INTEGER | NULL, CHECK 1–100 | Uno solo per la run, vale per tutti i giocatori; il level cap automatico si calcola per giocatore dalle sue tappe |
| ended\_at, deleted\_at | INTEGER | NULL | Fine della run; cancellazione logica, eliminazione definitiva dopo 30 giorni |
| version | INTEGER | NOT NULL, default 1 |  |

### run\_member

| Colonna | Tipo | Vincoli | Note |
| --- | --- | --- | --- |
| run\_id | TEXT | FK run, ON DELETE CASCADE |  |
| user\_id | TEXT | FK user |  |
| role | TEXT | CHECK in (owner, player, spectator) |  |
| seat | INTEGER | UNIQUE con run\_id | Ordine dei giocatori nell'interfaccia |
|  |  | UNIQUE (run\_id, user\_id) | Un utente compare una volta per run |

### link\_group

Il gruppo di Pokémon collegati nato in un'area; tiene posizione e morte per tutti i partner.

| Colonna | Tipo | Vincoli | Note |
| --- | --- | --- | --- |
| run\_id | TEXT | FK run, CASCADE |  |
| area\_key | TEXT | NOT NULL | Area del file di gioco o `custom:<id>` |
| slot | TEXT | CHECK in (main, gift) | Incontro dell'area, oppure regalo, incontro fisso o scambio separato (con la chiave propria in area\_key) |
| status | TEXT | CHECK in (open, linked, skipped) | open finché manca l'incontro valido di qualche giocatore |
| position | TEXT | NULL, CHECK in (team, box, dead) | Valorizzata solo se linked |
| died\_at | INTEGER | NULL |  |
| death\_cause | TEXT (JSON) | NULL | Chi è caduto, avversario, mossa |
| version | INTEGER | NOT NULL |  |
|  |  | UNIQUE (run\_id, area\_key, slot) | Un gruppo per area e slot |

### encounter

| Colonna | Tipo | Vincoli | Note |
| --- | --- | --- | --- |
| run\_id | TEXT | FK run, CASCADE |  |
| link\_group\_id | TEXT | FK link\_group, CASCADE |  |
| member\_id | TEXT | FK run\_member |  |
| attempt | INTEGER | NOT NULL, default 1 | Tentativo del singolo giocatore: la dupes clause vale solo per chi ha già la specie |
| outcome | TEXT | CHECK in (caught, fled, defeated, dupe, untracked) | dupe = scartato per dupes clause, dà diritto a un nuovo tentativo; untracked per le run già iniziate |
| species\_id | INTEGER | NULL | Specie incontrata (Pokédex) |
| level\_met | INTEGER | NULL, CHECK 1–100 |  |
| version | INTEGER | NOT NULL |  |
|  |  | UNIQUE (link\_group\_id, member\_id, attempt) |  |
|  |  | UNIQUE parziale (link\_group\_id, member\_id) WHERE outcome ≠ dupe | Un solo incontro valido per giocatore per gruppo |

### specimen

| Colonna | Tipo | Vincoli | Note |
| --- | --- | --- | --- |
| run\_id | TEXT | FK run, CASCADE |  |
| encounter\_id | TEXT | FK encounter, UNIQUE | Solo per gli incontri catturati |
| member\_id, link\_group\_id | TEXT | FK | Copiati dall'incontro per query semplici |
| nickname | TEXT | NOT NULL, 1–20 caratteri |  |
| species\_id | INTEGER | NOT NULL | Cambia con l'evoluzione |
| variety\_id | INTEGER | NULL | Varietà del Pokédex (`pokemon_id` di PokéAPI) con tipi, statistiche o abilità diversi (Wormadam, Rotom, Darmanitan zen, Kyurem, e così via); NULL = varietà predefinita della specie ([ADR 0006](../adr/0006-varieta-dell-esemplare.md)) |
| level | INTEGER | CHECK 1–100 |  |
| nature, ability, tera\_type | TEXT | NULL | Chiavi del Pokédex |
| moves | TEXT (JSON) | CHECK json\_array\_length ≤ 4 | Chiavi delle mosse attuali |
| version | INTEGER | NOT NULL |  |

### run\_milestone

Sostituisce `run_badge` ([ADR 0003](../adr/0003-giochi-aree-e-impostazioni-della-run.md)): una tappa del gioco (palestra, Superquattro, campione, boss della storia, prova) superata da un giocatore. La medaglia è un attributo della tappa nei dati di gioco.

| Colonna | Tipo | Vincoli | Note |
| --- | --- | --- | --- |
| run\_id | TEXT | FK run, CASCADE |  |
| member\_id | TEXT | FK run\_member |  |
| milestone\_key | TEXT | NOT NULL | Chiave della tappa nei dati di gioco, per esempio `badge-3` o `elite-four-marshal` |
| obtained\_at | INTEGER | NOT NULL |  |
| version | INTEGER | NOT NULL |  |
|  |  | PRIMARY KEY (member\_id, milestone\_key) | Nessun id separato |

### species\_override

| Colonna | Tipo | Vincoli | Note |
| --- | --- | --- | --- |
| run\_id | TEXT | FK run, CASCADE |  |
| member\_id | TEXT | FK run\_member | Gli override sono per giocatore |
| species\_id | INTEGER | NOT NULL |  |
| field | TEXT | CHECK in (types, base\_stats, abilities, learnset) | Un campo per riga, così il ripristino è per campo |
| value | TEXT (JSON) | NOT NULL | Validato per campo |
| version | INTEGER | NOT NULL |  |
|  |  | UNIQUE (member\_id, species\_id, field) |  |

### run\_event

| Colonna | Tipo | Vincoli | Note |
| --- | --- | --- | --- |
| run\_id | TEXT | FK run, CASCADE |  |
| actor\_user\_id | TEXT | NULL, FK user | NULL per eventi del sistema |
| type | TEXT | NOT NULL | Per esempio `encounter.recorded`, `group.died` |
| entity, entity\_id | TEXT | NOT NULL | Dato toccato |
| payload | TEXT (JSON) | NOT NULL | Valori prima e dopo |
|  |  | Nessun UPDATE né DELETE | Bloccati da trigger |

Il diario è anche la base per recuperare gli eventi mancanti dopo una riconnessione: il client invia l'identificativo dell'ultimo evento ricevuto, ordinabile nel tempo ([ADR 0002](../adr/0002-rete-instabile.md)).

## Tabelle di supporto

Account, configurazione e funzioni dei rilasci successivi stanno in tabelle piccole e separate, così il nucleo della run resta semplice.

- **user, session, account, verification**, **app\_setting** e **invite**: definite in [P2-01](#p2-01-utenti-sessioni-e-ruoli-globali).
- **custom\_area**: `game_id`, `name`, `after_area_key` (dove inserirla nell'ordine), `created_by`. I gruppi la richiamano come `custom:<id>`.
- **seen\_trainer** e **seen\_pokemon** (rilascio 0.3): squadre viste in lotta. `seen_trainer` ha `run_id`, nome, area, giocatore che l'ha salvata; `seen_pokemon` ha specie, livello e mosse osservate in JSON.
- **request\_key**: chiave di idempotenza inviata dal client, utente, esito e risposta salvata. Un doppio invio restituisce la stessa risposta; le righe si eliminano dopo 24 ore.
- **Nessuna tabella per i lock**: vivono nella memoria del server, come da specifica.

## P2-01 Utenti, sessioni e ruoli globali

Data: 20 ottobre 2026. Definizione di dettaglio delle tabelle di account, verificata con la prova P1-13 ([prove di fattibilità](14-Prove-di-fattibilita.md#p1-13-prova-better-auth-con-admin-da-variabili-dambiente)) su `better-auth` 1.7.12 con il plugin `admin`.

### Tabelle di Better Auth

Le quattro tabelle sono quelle richieste da Better Auth; si riportano senza aggiungere né togliere colonne, tranne le aggiunte alla tabella `user` elencate sotto. Le date sono INTEGER in millisecondi UTC (modalità `timestamp_ms` di Drizzle), come il resto del modello.

| Tabella | Colonne di Better Auth | Note |
| --- | --- | --- |
| `user` | `id`, `name`, `email` (UNIQUE), `email_verified`, `image`, `created_at`, `updated_at` | Più le colonne del plugin `admin` e le nostre, sotto |
| `session` | `id`, `token` (UNIQUE), `expires_at`, `ip_address`, `user_agent`, `user_id` (FK user, CASCADE), `impersonated_by`, `created_at`, `updated_at` | `impersonated_by` è del plugin `admin`; non si usa l'impersonificazione ma la colonna c'è |
| `account` | `id`, `account_id`, `provider_id`, `user_id` (FK user, CASCADE), `password` (hash), `access_token`, `refresh_token`, `id_token`, `access_token_expires_at`, `refresh_token_expires_at`, `scope`, `created_at`, `updated_at` | Con email e password esiste una riga con `provider_id = 'credential'`; l'hash sta in `account.password`, mai in `user` |
| `verification` | `id`, `identifier`, `value`, `expires_at`, `created_at`, `updated_at` | Non usata nell'MVP (nessuna email), ma richiesta da Better Auth |

Lo schema si scrive a mano in Drizzle: il generatore `@better-auth/cli` non si installa con la versione provata. Va ricontrollato a ogni aggiornamento di Better Auth.

### Colonne aggiunte a `user`

| Colonna | Tipo | Vincoli | Note |
| --- | --- | --- | --- |
| `role` | TEXT | NULL, valori `admin` o `user` | Colonna del plugin `admin`; NULL o `user` valgono utente. Il ruolo globale non dà alcun diritto dentro le run: lì contano `run_member.role` |
| `banned`, `ban_reason`, `ban_expires` | INTEGER, TEXT, INTEGER | `banned` default 0 | Colonne del plugin `admin`. La **disattivazione** dell'utente (P3-09) è un ban: sostituisce la colonna `disabled_at` della bozza |
| `must_change_password` | INTEGER | NOT NULL, default 0, 0 o 1 | Vero per l'admin creato all'avvio finché non cambia la password; dichiarata con `additionalFields` e `input: false`, così un client non può impostarla |
| `locale` | TEXT | NULL, valori `it` o `en` | Lingua scelta; NULL = lingua del browser, poi italiano |
| `theme` | TEXT | NULL, valori `light`, `dark`, `system` | NULL = `system` |
| `deleted_at` | INTEGER | NULL | Valorizzato quando l'account è stato anonimizzato |

Le colonne `locale` e `theme` sono dichiarate con `additionalFields` e modificabili dall'utente stesso. `role`, `banned` e `must_change_password` no.

### Ruoli globali

| Ruolo | Chi | Può |
| --- | --- | --- |
| `admin` | L'utente creato all'avvio da `ADMIN_EMAIL` e `ADMIN_PASSWORD`; altri admin solo per promozione di un admin | Gestire utenti (disattivare, reimpostare la password, eliminare), modalità di registrazione, inviti all'app, aree personalizzate |
| `user` | Ogni altro account | Creare run e partecipare alle run a cui è invitato |

Esiste almeno un admin: l'ultimo admin non si può degradare, disattivare né eliminare (invariante controllata nel dominio).

### Eliminazione e anonimizzazione

Una riga `user` non si cancella mai se ha run o diario: si anonimizza. In una transazione: `name` = "Utente eliminato", `email` = `deleted-<id>@invalid` (resta UNIQUE), `image` NULL, `deleted_at` valorizzato, riga `account` eliminata, sessioni eliminate. `run_member` e `run_event` continuano a puntare alla riga. Se l'utente era proprietario di una run, la proprietà passa al giocatore con il posto (`seat`) successivo.

### Modalità di registrazione

Impostazione globale in `app_setting`, chiave `registration.mode`, valore JSON `"open"`, `"invite"` o `"closed"`:

| Valore | Effetto |
| --- | --- |
| `open` | Chiunque raggiunga l'app può registrarsi |
| `invite` | La registrazione richiede un invito all'app valido (tabella `invite`, `kind = 'app'`) |
| `closed` | Nessuna registrazione; l'admin crea gli account |

Valore predefinito proposto: **`invite`**, perché l'app è privata e raggiungibile dalla rete locale o da internet. Better Auth permette la registrazione per impostazione predefinita: il blocco sta nell'app, che rifiuta la registrazione prima di chiamare Better Auth quando la modalità non la consente (criterio in P3-07). Le modalità `invite` e `closed` non impediscono all'admin di creare un account.

### `app_setting` e `invite`

- `app_setting(key TEXT PRIMARY KEY, value TEXT NOT NULL (JSON), updated_at INTEGER NOT NULL)`. Chiavi iniziali: `registration.mode`. Il valore si valida con uno schema per chiave.
- `invite(id, token_hash UNIQUE, kind CHECK IN ('app','run'), run_id NULL FK run CASCADE, role NULL CHECK IN ('player','spectator'), created_by FK user, expires_at, max_uses, uses default 0, revoked_at NULL, created_at)`. Il token in chiaro si mostra una volta sola. Un invito `run` richiede `run_id` e `role`; un invito `app` no. Un invito è valido se non è revocato, non è scaduto e `uses < max_uses`.

### Identificativi degli utenti

Il resto del modello usa UUIDv7. Better Auth genera propri identificativi per `user`, `session`, `account` e `verification`. Se la libreria permette di fornire un generatore (da verificare in P3-07), anche questi diventano UUIDv7; altrimenti restano stringhe di Better Auth. Nessun'altra tabella dipende dal formato: i riferimenti a `user.id` sono TEXT.

### Domande aperte

Modalità di registrazione predefinita: la proposta è `invite`. Da confermare con il product owner.

## Invarianti

Ogni regola del Soul Link ha un posto preciso dove viene garantita: prima la struttura, poi il database, infine il dominio con i test.

| Invariante | Garantita da |
| --- | --- |
| I partner collegati hanno la stessa posizione | Struttura: la posizione esiste solo su link\_group |
| Un incontro per giocatore per area, salvo dupes clause e regali | UNIQUE su link\_group (area, slot) e indice UNIQUE parziale su encounter (un solo esito diverso da dupe per giocatore e gruppo); un nuovo tentativo solo se la dupes clause è attiva e il giocatore possiede già la specie, nel dominio |
| Un gruppo è collegato solo quando tutti i giocatori hanno catturato | Dominio, ricalcolato nella stessa transazione della registrazione |
| Un incontro non catturato fa saltare l'area per tutti | Dominio: il gruppo passa a skipped nella stessa transazione |
| La morte è irreversibile | Trigger: rifiuta il cambio di position quando vale già dead |
| Al massimo 6 Pokémon in team per giocatore | Dominio nel caso d'uso, in transazione; test con dati generati |
| Il gioco della run non cambia dopo il primo incontro | Dominio, con un test dedicato |
| Il soprannome è obbligatorio | NOT NULL e CHECK sulla lunghezza |
| Il diario non si modifica | Trigger che rifiutano UPDATE e DELETE su run\_event |
| Le specie e le chiavi del Pokédex esistono | Validazione all'ingresso e un controllo periodico che segnala riferimenti rotti |

## Prestazioni ed evoluzione

Una run contiene qualche centinaio di righe e il suo diario qualche migliaio: SQLite non ha bisogno di ottimizzazioni speciali, bastano gli indici giusti e poche query per schermata.

Indici:

- `run_member(user_id)`: elenco delle mie run.
- `link_group(run_id, area_key)` e `link_group(run_id, position)`: aree, team, box e cimitero.
- `encounter(run_id, member_id)` e `specimen(run_id, member_id)`: dati di un giocatore.
- `run_event(run_id, id)`: il diario in ordine di tempo, grazie agli UUIDv7.
- Gli indici UNIQUE già elencati servono anche alle ricerche.

Impostazioni di SQLite all'avvio: journal\_mode WAL, foreign\_keys ON, busy\_timeout 5000 ms, synchronous NORMAL.

Lettura di una run: tre query (gruppi, incontri, esemplari) invece di una per riga; la schermata le compone in memoria.

Evoluzione dello schema:

- **Migrazioni solo in avanti** con drizzle-kit, applicate all'avvio, con una copia del file del database prima di ogni migrazione.
- **Espandi e contrai**: una colonna nuova nasce nullable, si popola, si usa; la vecchia si toglie in un rilascio successivo. Nessuna migrazione rompe la versione precedente dell'app.
- **Regole nuove**: una chiave in settings con valore predefinito e una funzione che porta il JSON dalla versione vecchia alla nuova in lettura; nessuna migrazione.
- **Nuovi campi sovrascrivibili**: un valore in più nel CHECK di species\_override.
- **Passaggio a Turso**: stesso schema; gli UUIDv7 evitano conflitti se si uniscono dati.

## Dati fuori dal database

I dati di riferimento sono file in sola lettura dentro l'immagine: si aggiornano con un nuovo rilascio, mai a mano sul server.

- **Pokédex SQLite** (schema in P2-07): specie e forme, tipi per generazione, statistiche, abilità, mosse con i valori per generazione, learnset per version group, aree e incontri, nomi localizzati in una tabella unica (entità, id, lingua, nome). Generato da PokeAPI/api-data.
- **File dei dati di gioco**, uno per gioco: game\_id, generazione, version group, colore della run, aree in ordine con area\_key stabile e nomi per lingua, medaglie con capopalestra e level cap, numero di versione. Nei file, le stanze interne portano `parentAreaKey`: con la regola `separateRooms` spenta l'area effettiva di un incontro in una stanza è quella della grotta principale. Le tappe (`milestones`) sostituiscono l'elenco delle sole medaglie. Generati da nuzlocke.data e PokéAPI, validati con Zod all'avvio: un file non valido blocca l'avvio con un messaggio chiaro.
- Il database dell'app li richiama solo per chiave (`species_id`, `game_id`, `area_key`), così aggiornare i dati non richiede migrazioni.

## Decisioni sulle domande aperte

- [x] Starter: deciso, è un normale incontro collegato nello slot main dell'area speciale starter, in testa ai dati di gioco; non serve nessuna tabella in più. Incontri fissi e scambi in gioco: decisi, si trattano come i regali. Nei dati di gioco ogni regalo, incontro fisso o scambio ha una chiave propria e l'area a cui appartiene: con la regola attiva è un gruppo nello slot gift con la sua chiave; senza, conta come incontro main della sua area.
- [x] Deciso il 3 ottobre 2026: la dupes clause vale per il singolo giocatore; solo lui ha un nuovo tentativo e il gruppo resta aperto. "Già posseduta" vale per l'intera linea evolutiva: il controllo usa l'id della catena evolutiva del Pokédex, quindi non serve una colonna in più nel database dell'app. Contano tutti gli esemplari del giocatore nella run, anche quelli morti: il controllo legge specimen senza filtrare per posizione.
- [x] Eliminazione di un account: deciso, le run restano. La riga di user diventa anonima ("Utente eliminato", email, password e sessioni cancellate) invece di sparire, così chiavi esterne e diario restano validi; se era il proprietario, la proprietà passa al giocatore successivo per posto.
- [x] Run cancellate: deciso, recuperabili dal proprietario per 30 giorni grazie a deleted\_at, poi eliminate definitivamente da un job all'avvio e una volta al giorno.
