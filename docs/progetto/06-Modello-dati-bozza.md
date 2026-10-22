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
| user\_id | TEXT | NULL, FK user | NULL per un **posto in attesa**: riservato a un invitato che non ha ancora accettato ([P2-11](#p2-11-posti-in-attesa)) |
| display\_name | TEXT | NULL, 1–40 caratteri | Nome del posto in attesa; per i membri veri vale il nome dell'utente |
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
| status | TEXT | CHECK in (open, linked, skipped, untracked) | open finché manca l'incontro valido di qualche giocatore attivo; regole complete in [P2-03](#p2-03-aree-incontri-e-link-soul-link) |
| position | TEXT | NULL, CHECK in (team, box, dead) | Valorizzata se e solo se status = linked |
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
| outcome | TEXT | CHECK in (caught, failed, fled, dupe, untracked) | failed = non catturato (esausto, palle finite); fled = il Pokémon è fuggito; dupe = scartato per dupes clause, dà diritto a un nuovo tentativo; untracked per le run già iniziate |
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
- **custom\_area**: aree aggiunte dall'admin, definite in [P2-03](#p2-03-aree-incontri-e-link-soul-link).
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
- `invite(id, token_hash UNIQUE, kind CHECK IN ('app','run'), run_id NULL FK run CASCADE, member_id NULL FK run_member (posto riservato a questo invito), role NULL CHECK IN ('player','spectator'), created_by FK user, expires_at, max_uses, uses default 0, revoked_at NULL, created_at)`. Il token in chiaro si mostra una volta sola. Un invito `run` richiede `run_id` e `role`; un invito `app` no. Un invito è valido se non è revocato, non è scaduto e `uses < max_uses`.

### Identificativi degli utenti

Il resto del modello usa UUIDv7. Better Auth genera propri identificativi per `user`, `session`, `account` e `verification`. Se la libreria permette di fornire un generatore (da verificare in P3-07), anche questi diventano UUIDv7; altrimenti restano stringhe di Better Auth. Nessun'altra tabella dipende dal formato: i riferimenti a `user.id` sono TEXT.

### Domande aperte

Modalità di registrazione predefinita: la proposta è `invite`. Da confermare con il product owner.

## P2-02 Run, giocatori e regole

Data: 20 ottobre 2026. Completa le tabelle `run` e `run_member` della sezione "Tabelle principali" con le regole, gli stati e i vincoli.

### Una run, un gioco

`run.game_id` è la chiave di un file di gioco, cioè una **versione** (`black`, `white`, `black-2`, `white-2`): è uguale per tutti i giocatori della run, che non hanno un gioco proprio. Le regole e le impostazioni stanno una volta sola nella riga della run e valgono per tutti; solo `species_override` è per giocatore.

Non cambiano dopo il primo incontro: `game_id`, `game_data_version`, `settings.separateRooms`, `settings.difficulty`, `settings.dupesClause`, `settings.separateGifts` e `settings.typeClause`. Il «primo incontro» è la prima riga di `encounter` della run, comprese quelle `untracked` create alla nascita di una run già iniziata: per quelle run il blocco vale dalla creazione. Il vincolo è nel dominio (nessun trigger: serve un messaggio d'errore chiaro) con un test dedicato.

### Regole sempre attive

Non sono impostazioni e non si possono spegnere: un incontro per area, Pokémon esausto = morto, soprannome obbligatorio, collegamento degli incontri della stessa area, stesso destino dei partner, morte di tutti i partner, area saltata per tutti se un giocatore perde l'incontro. Vivono nel dominio (vedi "Invarianti"), non in `settings`.

### Impostazioni della run (`run.settings`)

Documento JSON validato con Zod, `settings_schema` = versione dello schema (oggi 1). Una regola nuova si aggiunge con un valore predefinito e una funzione che porta il documento alla versione corrente in lettura.

| Chiave | Tipo | Predefinito | Regola |
| --- | --- | --- | --- |
| `dupesClause` | booleano | vero | Dupes clause: se un giocatore ha già la linea evolutiva della specie incontrata (anche morta), solo lui ha un altro tentativo |
| `typeClause` | booleano | falso | Restrizione del tipo primario: niente tipi primari ripetuti nel team |
| `separateGifts` | booleano | vero | Regali, incontri fissi e scambi in gioco come incontri separati: non consumano l'incontro dell'area |
| `separateRooms` | booleano | vero | Stanze interne come aree separate ([ADR 0003](../adr/0003-giochi-aree-e-impostazioni-della-run.md)); non modificabile dopo il primo incontro |
| `randomizer` | booleano | falso | Senza tabelle di incontro: la specie si sceglie dal Pokédex |
| `damageCalculator` | booleano | vero | Mostra il calcolatore dei danni |
| `difficulty` | `easy`, `normal`, `challenge` | `normal` | Solo per `black-2` e `white-2`; assente per gli altri giochi. Determina il level cap |

I valori predefiniti sono una proposta: la specifica elenca le regole opzionali ma non dice quali partono accese. `typeClause` parte spenta perché cambia molto il modo di giocare; `dupesClause` e `separateGifts` partono accese perché sono le regole comuni del Soul Link e le due già descritte come caso normale nella specifica. Il proprietario le sceglie alla creazione; quali si possono cambiare dopo è nel paragrafo seguente.

Quali impostazioni si possono cambiare in corso di run: `damageCalculator` e `randomizer` sì, in qualsiasi momento, con un evento nel diario (cambiano solo ciò che si mostra); `dupesClause`, `separateGifts`, `typeClause`, `separateRooms` e `difficulty` no dopo il primo incontro, perché cambierebbero il significato degli incontri e dei gruppi già registrati. Il mockup delle impostazioni della run ([P2-12](17-Flussi-e-schermate.md#p2-12-bozze-schermate-tracker)) mostra già queste regole come «Bloccata: la run è iniziata»; la bozza precedente di questa sezione le lasciava modificabili.

### Stato della run

`run.status`: `active`, `lost`, `completed`.

| Da | A | Quando |
| --- | --- | --- |
| `active` | `lost` | Un giocatore resta senza Pokémon vivi (wipe), oppure il proprietario dichiara la run persa |
| `active` | `completed` | Il proprietario dichiara la run completata (di norma dopo il campione) |
| `lost` o `completed` | `active` | Il proprietario riapre la run, per correggere un errore; scrive un evento nel diario |

`ended_at` è valorizzato in `lost` e `completed`, NULL in `active`. Nuova colonna **`end_info`** (TEXT JSON, NULL): per `lost` registra il motivo (`wipe` con il giocatore, oppure `declared`) e, se noto, l'area. Una run non `active` resta consultabile ma non accetta scritture sui dati di gioco (incontri, esemplari, tappe, override), tranne la riapertura. La condizione di wipe si calcola nel dominio nella stessa transazione della morte; non è un trigger.

### Giocatori e ruoli nella run

`run_member` collega utenti e run. Completa la tabella principale così:

| Regola | Come |
| --- | --- |
| Un solo proprietario per run | Indice UNIQUE parziale su `run_member(run_id)` dove `role = 'owner'` |
| Il proprietario è anche un giocatore? | Sì, di norma: il proprietario ha `role = 'owner'` e partecipa alla run come giocatore con un posto. Un proprietario che non gioca è ammesso solo se ha `seat` NULL |
| Spettatore | `role = 'spectator'`, `seat` NULL, sola lettura |
| Posto | `seat` è NULL per gli spettatori e un intero 1…N per proprietario e giocatori; UNIQUE (`run_id`, `seat`) dove `seat` non è NULL |
| Numero di giocatori | Nessun limite nel database; limite dell'interfaccia da fissare in P2-12 (proposta: 8) |
| Cambio di proprietario | Il proprietario cede il ruolo a un altro giocatore, oppure passa automaticamente al posto successivo se l'account è eliminato. Nella stessa transazione: il vecchio proprietario diventa `player`, il nuovo `owner` |
| Rimozione di un giocatore | Il proprietario rimuove un giocatore o lo trasforma in spettatore; i suoi dati (incontri, esemplari, tappe, override) restano e si leggono ancora, ma il gruppo non aspetta più il suo incontro. Questa regola cambia l'invariante «gruppo collegato quando tutti hanno catturato»: vale per i giocatori **attivi** (con `role` ≠ `spectator`). Da trattare con attenzione in P2-03 |

### Nuove colonne e indici

- `run.end_info` TEXT JSON NULL.
- `run_member`: indice UNIQUE parziale sul proprietario; UNIQUE parziale su (`run_id`, `seat`).
- `run(deleted_at)`: indice per il job di eliminazione definitiva dopo 30 giorni.

### Run già iniziata

`run.started_in_progress` = 1: alla creazione il proprietario indica quali aree sono già passate e per ciascun giocatore la situazione; le aree precedenti ricevono un incontro `untracked` per ogni giocatore, il che blocca `game_id` e `separateRooms` dalla creazione. I dettagli del flusso sono in P2-11.

### Domande aperte

- Valori predefiniti delle regole opzionali (tabella sopra): da confermare.
- Un proprietario che non gioca: permesso o no? La proposta lo permette con `seat` NULL.

## P2-03 Aree, incontri e link Soul Link

Data: 20 ottobre 2026. Taglia M. Definisce come un'area del gioco diventa un gruppo collegato, come si registra un incontro e come si calcola lo stato del gruppo con N giocatori. Aggiorna le tabelle `link_group` e `encounter` e aggiunge `custom_area`.

### Dall'area al gruppo

I dati di gioco ([`data/games/<game_id>.json`](11-Dati-di-gioco.md)) elencano le aree in ordine, con una chiave stabile. Il database non ha una tabella delle aree: un gruppo (`link_group`) nasce **quando si registra il primo incontro** di quell'area, da parte di un giocatore qualsiasi. L'elenco delle aree si costruisce incrociando i dati di gioco (in ordine) con i gruppi esistenti, per `area_key` e `slot`: un'area senza gruppo è un'area non ancora visitata da nessuno.

La chiave di un gruppo è (`run_id`, `area_key`, `slot`):

| Caso | `area_key` | `slot` |
| --- | --- | --- |
| Incontro selvatico dell'area, starter compreso (l'area `starter` è la prima) | Chiave **effettiva** dell'area | `main` |
| Regalo, incontro fisso, scambio o grotta nascosta, con `separateGifts` acceso | Chiave propria dell'incontro speciale (`gift-driftveil-city-zorua`) | `gift` |
| Gli stessi, con `separateGifts` spento | Chiave effettiva dell'area in cui avvengono | `main` |
| Area personalizzata | `custom:<id>` | `main` |

**Chiave effettiva**: con `separateRooms` acceso è la chiave dell'area; con `separateRooms` spento, per un'area con `parentAreaKey` è la chiave dell'area principale (si risale finché c'è un padre). Si calcola alla registrazione e si scrive nel gruppo; non cambia mai, perché `separateRooms` è bloccato dopo il primo incontro. Per gli incontri speciali vale la chiave effettiva dell'area dichiarata nel dato (`areaKey`).

Con `separateGifts` spento un regalo e un incontro selvatico della stessa area condividono lo stesso gruppo: **vale il primo che il giocatore registra**, il secondo è rifiutato dal server (un incontro valido per giocatore per gruppo). Le grotte nascoste di Nero 2 e Bianco 2 seguono la stessa regola dei regali e hanno la specie scelta dal Pokédex ([ADR 0003](../adr/0003-giochi-aree-e-impostazioni-della-run.md)).

Le chiavi dei dati di gioco sono **stabili**: un aggiornamento dei dati non cancella né rinomina una chiave già usata da una run. Un'area che sparisce o cambia si sostituisce con una chiave nuova e l'area vecchia resta nel file marcata come obsoleta (regola da riportare nel processo dei dati di gioco). Il controllo periodico dei riferimenti rotti segnala quel che sfugge.

### Incontro (`encounter`)

Un incontro è ciò che **un giocatore** registra in un gruppo. Colonne aggiunte o precisate rispetto alla tabella principale:

| Colonna | Tipo | Vincoli | Note |
| --- | --- | --- | --- |
| `special_key` | TEXT | NULL | Chiave dell'incontro speciale (regalo, fisso, scambio, grotta) se l'incontro viene da lì; il tipo (`gift`, `static`, `trade`, `grotto`) si legge dai dati di gioco |
| `outcome` | TEXT | CHECK in (`caught`, `failed`, `fled`, `dupe`, `untracked`) | Vedi sotto |
| `species_id` | INTEGER | NULL | Obbligatoria con `caught` e `dupe` (CHECK) |
| `level_met` | INTEGER | NULL, CHECK 1–100 | |

Esiti, come richiesti dalla specifica:

| Esito | Significato | Effetto sul gruppo |
| --- | --- | --- |
| `caught` | Catturato (anche un regalo, uno scambio o un incontro fisso: la loro natura sta in `special_key`) | Crea l'esemplare (P2-04); conta come incontro valido |
| `failed` | Non catturato: Pokémon esausto, palle finite, battaglia persa | L'area è persa per tutti |
| `fled` | Il Pokémon selvatico è fuggito | L'area è persa per tutti |
| `dupe` | Specie della stessa linea evolutiva di un Pokémon già posseduto dal giocatore (anche morto), con la dupes clause accesa | Non è un incontro valido: dà diritto a un nuovo tentativo di quel giocatore, il gruppo resta aperto |
| `untracked` | Area precedente alla creazione di una run già iniziata, di cui non si sa nulla | Non blocca e non fa perdere l'area |

La voce «regalo» della specifica non è un esito ma una provenienza: un regalo si registra come `caught` con `special_key` di tipo `gift`. Un regalo non può essere `failed` né `fled`.

**Tentativi**: `attempt` parte da 1 e cresce di uno solo dopo un `dupe`. Per ogni (gruppo, giocatore) c'è al più **un incontro valido**, cioè con esito diverso da `dupe` (indice UNIQUE parziale già previsto). Gli incontri `dupe` restano come storia. La dupes clause si valuta per giocatore sulla sua linea evolutiva, quindi un `dupe` non tocca gli incontri degli altri.

Gli incontri dei giocatori **spettatori** non esistono. `member_id` deve riferirsi a un `run_member` con ruolo `owner` o `player` (controllo nel dominio).

### Stato del gruppo

`link_group.status` si ricalcola **nella stessa transazione** di ogni scrittura che tocca un incontro del gruppo, sui soli giocatori **attivi** (ruolo diverso da `spectator`), con questa precedenza:

1. `skipped` se un incontro valido di qualunque giocatore è `failed` o `fled` (l'area è persa per tutti, anche per chi non l'ha ancora incontrata).
2. `open` se qualche giocatore attivo non ha ancora un incontro valido (non ha registrato nulla oppure ha solo `dupe`).
3. Altrimenti tutti hanno un incontro valido, tutti `caught` o `untracked`: `linked` se almeno uno è `caught`, `untracked` se sono tutti `untracked`.

| Stato | `position` | Note |
| --- | --- | --- |
| `open` | NULL | In attesa di qualcuno |
| `linked` | `team`, `box` o `dead` (alla creazione `box`; il giocatore sposta in team) | I partner hanno sempre la stessa posizione |
| `skipped` | NULL | Terminale |
| `untracked` | NULL | Terminale; area di una run già iniziata |

CHECK: `(status = 'linked') = (position IS NOT NULL)` e `(position = 'dead') = (died_at IS NOT NULL)`. Uno stato terminale non si riapre, salvo correzione del proprietario con evento nel diario (da dettagliare in P2-09). Un `skipped` può essere riaperto solo se l'incontro che lo ha causato viene corretto.

Cambiamenti di giocatori attivi:

- **Nuovo giocatore** (o spettatore che diventa giocatore): nella stessa transazione riceve un incontro `untracked` per ogni gruppo già in stato `linked`, `skipped` o `untracked`; per i gruppi `open` dovrà fare il suo incontro e lo stato si ricalcola quando lo registra.
- **Giocatore rimosso o reso spettatore**: i suoi incontri e i suoi esemplari restano e si leggono; i gruppi `open` si ricalcolano senza di lui (possono diventare `linked` o `untracked`); i gruppi `linked` non cambiano. Il suo esemplare in un gruppo `linked` continua a seguire la posizione del gruppo.

Il ricalcolo è una funzione pura del dominio: dato l'elenco dei giocatori attivi e dei loro incontri validi restituisce stato e posizione. Si prova con test generati (proprietà: l'ordine in cui arrivano gli incontri non cambia lo stato finale).

### Concorrenza

Due giocatori possono registrare lo stesso gruppo nello stesso momento. La creazione del gruppo è un `INSERT … ON CONFLICT (run_id, area_key, slot) DO NOTHING` seguito da una lettura, dentro la transazione; il ricalcolo dello stato avviene dopo ogni inserimento, e l'ultimo a scrivere vede tutti gli incontri. `version` su gruppo e incontro sostiene l'avviso «vince l'ultimo» ([principi](#principi)).

### Aree personalizzate (`custom_area`)

Aggiunte dall'admin per i casi che i dati di gioco non coprono (una route di una ROM hack, un'area dimenticata).

| Colonna | Tipo | Vincoli | Note |
| --- | --- | --- | --- |
| `id` | TEXT | PK, UUIDv7 | La chiave nei gruppi è `custom:<id>` |
| `game_id` | TEXT | NOT NULL | Valida per le run di quel gioco |
| `name` | TEXT | NOT NULL, 1–60 | Un solo nome, nella lingua di chi la crea |
| `after_area_key` | TEXT | NULL | Chiave dell'area (di gioco o personalizzata) dopo cui compare nell'elenco; NULL = in fondo |
| `created_by` | TEXT | FK user | |
| `archived_at` | INTEGER | NULL | Un'area già usata non si cancella: si archivia e sparisce dall'elenco delle run nuove |
| | | UNIQUE (`game_id`, `name`) | |

Più aree dopo la stessa area stanno nell'ordine di creazione. Le aree personalizzate non hanno stanze (`parentAreaKey`) né incontri speciali.

### Invarianti aggiunte

| Invariante | Garantita da |
| --- | --- |
| Un solo gruppo per area e slot | UNIQUE (`run_id`, `area_key`, `slot`) |
| Un solo incontro valido per giocatore e gruppo | Indice UNIQUE parziale su `encounter` |
| `position` presente se e solo se il gruppo è `linked` | CHECK sul gruppo |
| Specie obbligatoria con `caught` e `dupe` | CHECK sull'incontro |
| Un regalo non fallisce né fugge | Dominio, controllato su `special_key` |
| Lo stato del gruppo è funzione degli incontri | Dominio: una sola funzione di ricalcolo, chiamata in ogni scrittura, con test di proprietà |
| La chiave effettiva dipende da `separateRooms` e non cambia | Dominio, con un test dedicato |

### Domande aperte

- Il gruppo `untracked` e il giocatore che entra a run iniziata (incontri `untracked` automatici) sono una proposta: da confermare nel flusso di P2-11.
- Con `separateGifts` spento, «vale il primo registrato» tra regalo e selvatico dell'area: va bene o deve decidere il giocatore? La proposta è il primo registrato.

## P2-04 Esemplari, morte ed eventi

Data: 20 ottobre 2026. Taglia M. Precisa `specimen`, la causa della morte in `link_group` e il diario `run_event`.

### Esemplare (`specimen`)

Un esemplare nasce da un incontro `caught`, in un gruppo qualsiasi (anche `open`: il giocatore ha già catturato, aspetta i compagni). Colonne, oltre a quelle della tabella principale:

| Colonna | Tipo | Vincoli | Note |
| --- | --- | --- | --- |
| `nickname` | TEXT | NOT NULL, 1–20 | Obbligatorio |
| `species_id`, `variety_id` | INTEGER | species NOT NULL; variety NULL | Cambiano con l'evoluzione e le forme ([ADR 0006](../adr/0006-varieta-dell-esemplare.md)); le chiavi esistono nel Pokédex (validazione all'ingresso) |
| `level` | INTEGER | NOT NULL, 1–100 | |
| `nature` | TEXT | NULL | Chiave del Pokédex; NULL = non nota |
| `ability` | TEXT | NULL | **Abilità effettiva** dell'esemplare, chiave del Pokédex; NULL = non nota. Deve essere tra quelle possibili della specie (o della sua varietà), considerando gli override del giocatore |
| `tera_type` | TEXT | NULL | Solo giochi di nona generazione |
| `moves` | TEXT (JSON) | NOT NULL, default `[]`, CHECK `json_array_length(moves) <= 4` | Chiavi delle mosse, senza ripetizioni (controllo nel dominio); le mosse imparabili sono quelle del Pokédex e degli override |
| `version` | INTEGER | NOT NULL | |

L'oggetto tenuto e il sesso non sono nell'MVP: si aggiungono come colonne nullable quando serviranno.

**Posizione.** Non è una colonna dell'esemplare: l'esemplare la eredita dal suo gruppo (`link_group.position`). Un esemplare il cui gruppo non è `linked` non ha posizione e l'interfaccia lo mostra «in attesa del collegamento». Il limite di 6 in team vale per giocatore: sono gli esemplari del giocatore nei gruppi con posizione `team`, controllati nel dominio nella transazione che sposta il gruppo.

**Eliminazione.** Gli esemplari non si cancellano: un errore di registrazione si corregge (evento `specimen.corrected`). Per un incontro registrato per sbaglio si elimina l'intero incontro con il suo esemplare, un'operazione del proprietario che scrive un evento con i valori eliminati.

**Evoluzione e forme.** `species_id` (e `variety_id`) cambiano con un evento `specimen.evolved` che porta prima e dopo. La dupes clause usa la catena evolutiva della specie dell'esemplare: la specie attuale e quella originale stanno nella stessa catena, quindi l'evoluzione non cambia il controllo.

### Causa della morte

La morte appartiene al gruppo: `link_group.died_at` (INTEGER, NOT NULL se `position = 'dead'`) e `link_group.death_cause` (JSON, NOT NULL se morto). Chi cade è un esemplare solo; i partner muoiono per il collegamento.

```json
{
  "schema": 1,
  "fallenSpecimenId": "<id dell'esemplare caduto>",
  "opponent": { "kind": "trainer", "name": "Cheren", "speciesId": 505 },
  "move": "bite",
  "areaKey": "unova-route-4",
  "note": "facoltativa"
}
```

| Campo | Regola |
| --- | --- |
| `fallenSpecimenId` | Esemplare caduto; i partner dello stesso gruppo risultano morti «per collegamento» |
| `opponent.kind` | `trainer`, `wild`, `status` (veleno, meteo, danno da status) o `other` |
| `opponent.name` | Nome dell'allenatore (per `trainer`); facoltativo, testo libero fino a 60 caratteri |
| `opponent.speciesId` | Specie dell'avversario, se nota; chiave del Pokédex |
| `move` | Chiave della mossa che ha causato la morte; NULL per `status` e `other` |
| `areaKey` | Dove è avvenuta la morte: area del gioco o `custom:<id>`, **non necessariamente l'area del gruppo** |
| `note` | Testo libero fino a 200 caratteri |

Lo schema è validato con Zod; i campi mancanti sono ammessi dove indicato, così si può registrare una morte anche senza sapere tutto. La morte è irreversibile (trigger sul cambio di `position`); una registrazione sbagliata si corregge cambiando `death_cause`, non annullando la morte, con evento `group.death_corrected`.

### Diario (`run_event`)

Tabella in sola aggiunta con `id` UUIDv7. Colonne: `run_id`, `actor_user_id` (NULL per il sistema), `type`, `entity`, `entity_id`, `payload` (JSON con `before` e `after`), `created_at`.

**Blocco di modifica.** Due trigger rifiutano `UPDATE` e `DELETE`. Il trigger di `DELETE` ha la condizione `WHEN EXISTS (SELECT 1 FROM run WHERE id = OLD.run_id)`: scatta solo se la run esiste ancora, e lascia passare la cascata quando una run viene eliminata definitivamente. Provato su SQLite 3.45: l'`UPDATE` e il `DELETE` diretti sono bloccati, l'eliminazione della run porta via i suoi eventi. Da riprovare su libSQL in P3-03.

**Eventi.** Elenco iniziale dei tipi (`entity.azione`); il catalogo completo con i contenuti SSE è in P2-10.

| Tipo | Quando |
| --- | --- |
| `run.created`, `run.settings_changed`, `run.status_changed`, `run.owner_changed`, `run.deleted`, `run.restored` | Vita della run |
| `member.joined`, `member.declined`, `member.role_changed`, `member.removed` | Giocatori |
| `group.created`, `group.linked`, `group.skipped`, `group.moved`, `group.died`, `group.death_corrected` | Gruppi |
| `encounter.recorded`, `encounter.corrected`, `encounter.deleted` | Incontri |
| `specimen.created`, `specimen.updated`, `specimen.evolved`, `specimen.corrected` | Esemplari |
| `milestone.reached`, `milestone.revoked` | Tappe |
| `override.set`, `override.cleared`, `levelcap.override_set` | Override e level cap |

Ogni scrittura che cambia dati di gioco scrive **nella stessa transazione** l'evento corrispondente; se la transazione fallisce non resta nulla. Una azione di gruppo (morte, spostamento) scrive un solo evento `group.*` e non uno per partner, con i partner nel payload. Gli eventi `group.linked` e `group.skipped` sono conseguenza di una registrazione e portano il suo `id` nel payload.

**Conflitti «vince l'ultimo».** Quando un salvataggio sovrascrive un dato con `version` più nuova di quella letta, il payload registra anche `overwrote`: la versione e i valori sovrascritti, così chi ha perso la modifica li può recuperare dal diario.

**Linea del tempo.** La timeline mostra gli eventi della run in ordine di `id`. Non tutti i tipi sono mostrati allo stesso modo: quelli tecnici (`group.created`, `specimen.corrected`) si possono nascondere con un filtro; la scelta è di P2-12.

**Recupero degli eventi mancanti.** Dopo una riconnessione il client invia l'`id` dell'ultimo evento ricevuto e il server restituisce gli eventi con `id` maggiore ([ADR 0002](../adr/0002-rete-instabile.md)); oltre una soglia (proposta: 500 eventi) conviene ricaricare tutto lo stato. La soglia si fissa in P2-10. Gli `id` sono ordinati nel tempo perché il server è una sola istanza e genera gli UUIDv7 con un contatore monotono.

**Dimensione e conservazione.** Il diario si conserva finché esiste la run e sparisce con la sua eliminazione definitiva. Una run di 4 giocatori e 400 incontri produce poche migliaia di righe: nessuna potatura.

### Indici e invarianti aggiunti

| Cosa | Come |
| --- | --- |
| `specimen(encounter_id)` UNIQUE | Già previsto: un esemplare per incontro catturato |
| Soprannome obbligatorio, mosse al massimo 4, livello 1–100 | NOT NULL e CHECK |
| Morto se e solo se `died_at` e `death_cause` presenti | CHECK sul gruppo |
| Il diario non si modifica né si cancella (finché esiste la run) | Trigger |
| Ogni scrittura scrive il suo evento nella stessa transazione | Dominio, con un test per ogni caso d'uso |
| Un esemplare ha un'abilità tra quelle possibili | Dominio all'ingresso |

### Domande aperte

Nessuna bloccante. Soglia di recupero degli eventi (500) e tipi di evento da mostrare nella timeline si fissano in P2-10 e P2-12.

## P2-05 Override per specie per giocatore

Data: 20 ottobre 2026. Taglia S. Precisa `species_override` e come si calcolano i dati effettivi.

### Chiave e righe

Un override appartiene a un giocatore della run e a una specie. La chiave della bozza (`member_id`, `species_id`, `field`) si estende con la **varietà**: `variety_id INTEGER NOT NULL DEFAULT 0`, dove 0 vuol dire la varietà predefinita della specie e un altro valore è il `pokemon_id` del Pokédex ([ADR 0006](../adr/0006-varieta-dell-esemplare.md)). Così il Darmanitan in forma Zen o una forma di Wormadam hanno i propri dati, anche nei randomizer. La specifica parla di «specie»; il campo in più è una proposta.

| Colonna | Tipo | Vincoli | Note |
| --- | --- | --- | --- |
| `run_id` | TEXT | FK run, CASCADE | |
| `member_id` | TEXT | FK run_member | Il giocatore a cui valgono; deve essere un giocatore attivo |
| `species_id` | INTEGER | NOT NULL | Specie del Pokédex |
| `variety_id` | INTEGER | NOT NULL, default 0 | 0 = varietà predefinita |
| `field` | TEXT | CHECK in (`types`, `base_stats`, `abilities`, `learnset`) | Un campo per riga |
| `value` | TEXT (JSON) | NOT NULL | Valido per il campo, vedi sotto |
| `version` | INTEGER | NOT NULL | |
| | | UNIQUE (`member_id`, `species_id`, `variety_id`, `field`) | |

Una riga esiste solo se il giocatore ha modificato quel campo: **tornare all'originale = eliminare la riga**, per campo o per tutta la specie. Un campo non modificato non ha riga e vale il Pokédex.

### Valori per campo (validati con Zod)

| Campo | Forma del valore | Regole |
| --- | --- | --- |
| `types` | `["water", "flying"]` | Uno o due tipi distinti; chiavi dei tipi dell'epoca del gioco ([P1-08](14-Prove-di-fattibilita.md)); l'ordine è primario, secondario |
| `base_stats` | `{"hp": 80, "atk": 82, "def": 83, "spa": 100, "spd": 100, "spe": 80}` | Sempre tutte e sei le statistiche (valore completo, non parziale), ognuna intera tra 1 e 255. Per Speciale unico (generazione 1) si useranno le chiavi di quel gioco: non rilevante per l'MVP |
| `abilities` | `{"slots": ["torrent", "rain-dish"], "hidden": "swift-swim"}` | Da una a due abilità normali, più una nascosta facoltativa; chiavi del Pokédex. Nei giochi senza abilità nascosta (prima della quinta) la chiave `hidden` è assente |
| `learnset` | `{"moves": [{"move": "surf", "level": 28}, {"move": "ice-beam"}]}` | Elenco completo delle mosse imparabili che **sostituisce** quello del Pokédex. Con `level` è appresa salendo di livello a quel livello; senza `level` è imparabile in altro modo (macchina, tutor, uova). Mosse scelte dall'elenco completo del Pokédex; niente ripetizioni |

Non si possono sovrascrivere evoluzioni, altezza, peso o curva di crescita: la specifica non li prevede. Un randomizer che cambia le evoluzioni non è coperto; lo registriamo come limite.

### Dati effettivi

Una sola funzione del dominio, `effectiveSpecies(run, member, species, variety)`, restituisce per ogni campo il valore dell'override se esiste, altrimenti quello del Pokédex per il version group del gioco della run; ogni campo porta `source: 'override' | 'pokedex'`. Tracker, helper delle lotte e calcolatore usano **solo** questa funzione, così nessuno legge il Pokédex direttamente per una specie di una run. I dati si segnalano come sovrascritti dove `source = 'override'`.

Gli override valgono per tutti gli esemplari di quella specie nel gioco di quel giocatore, suoi e avversari; non toccano le run degli altri giocatori né il Pokédex.

### Copia tra giocatori

«Copia override a un altro giocatore» (per chi usa lo stesso seed): un'operazione che, nella stessa transazione, copia le righe scelte (per specie o tutte) dal giocatore A al giocatore B come righe nuove con `version` 1; dove B ha già una riga per lo stesso campo, la riga di B viene **sostituita** (con conferma in interfaccia). Si scrive un solo evento `override.set` con `source_member_id` nel payload.

### Diario e concorrenza

Ogni impostazione, modifica o ripristino scrive `override.set` o `override.cleared` con valore prima e dopo. Il «vince l'ultimo» e l'avviso a chi è stato sovrascritto valgono come per gli altri dati (`version`). Un lock consultivo è per (giocatore, specie).

### Indici e dimensioni

`species_override(run_id, member_id)` per leggere tutti gli override di un giocatore in una query; in un randomizer completo possono essere centinaia di specie × 4 campi per giocatore, ancora poche migliaia di righe per run.

### Domande aperte

La varietà nella chiave (proposta di questa sezione) e il valore completo per `base_stats` da confermare con il product owner. Chi può modificare gli override di un altro giocatore si decide in P2-08.

## P2-06 Tappe, medaglie e level cap

Data: 20 ottobre 2026. Taglia XS. Precisa `run_milestone` e il calcolo del level cap.

### Tappe superate

`run_milestone` (vedi tabella principale) registra una tappa superata da un giocatore: chiave della tappa nei dati di gioco (`badge-1`, `elite-four-marshal`, …), `obtained_at` e `version`. Chiave primaria (`member_id`, `milestone_key`); `run_id` presente per i filtri. La medaglia è un attributo della tappa (`badge` nei dati di gioco), non una riga a parte ([ADR 0003](../adr/0003-giochi-aree-e-impostazioni-della-run.md)). La chiave deve esistere nel file di gioco della run (validazione all'ingresso).

Le tappe si registrano in qualunque ordine e si possono togliere (riga eliminata, evento `milestone.revoked`), perché un errore di registrazione si corregge. `obtained_at` è la data della registrazione, modificabile dal giocatore.

### Level cap calcolato

Per ogni giocatore, il level cap è il campo `levelCap` della **prima tappa, nell'ordine del file di gioco, che il giocatore non ha ancora superato**. Il valore si sceglie in base alla difficoltà della run (`settings.difficulty`: `easy`, `normal`, `challenge`); nei giochi senza difficoltà e dove il valore della difficoltà scelta manca si usa `normal`.

| Situazione | Level cap mostrato |
| --- | --- |
| C'è una tappa non superata | `levelCap[difficoltà]`, altrimenti `levelCap.normal` |
| Tutte le tappe superate | Nessun limite (il campo è NULL e l'interfaccia lo dice) |
| `run.level_cap_override` valorizzato | L'override, per **tutti** i giocatori della run, al posto del valore calcolato |

Le tappe a cui manca il valore della difficoltà scelta (i livelli facili di Superquattro e Ghetsis in Nero 2 e Bianco 2, [P1-07](11-Dati-di-gioco.md)) usano il valore `normal` e l'interfaccia lo segnala come «valore della modalità normale». Il calcolo è una funzione pura del dominio, `levelCap(game, difficulty, doneMilestones, override)`, e non si salva: cambia con le tappe del giocatore e con l'eventuale aggiornamento dei dati di gioco.

L'override è **uno solo per la run** (`run.level_cap_override`, 1–100). Si imposta e si toglie con l'evento `levelcap.override_set`. Un override per giocatore, o per tappa, non è previsto.

### Domande aperte

Chi può registrare le tappe di un altro giocatore si decide in P2-08.

## P2-11 Posti in attesa

Aggiunta emersa dal flusso di creazione della run ([Flussi e schermate](17-Flussi-e-schermate.md#p2-11-flussi-creazione-run-inviti-run-già-iniziata)): quando il proprietario crea una run, spesso gli altri giocatori non hanno ancora accettato, ma i loro posti devono già esistere (il mockup mostra «Luca · invito inviato», e in una run già iniziata il proprietario inserisce i dati di tutti).

- `run_member.user_id` può essere NULL: il membro è un **posto in attesa** con `display_name`, `role` (`player` o `spectator`) e `seat`. L'unicità (`run_id`, `user_id`) non è violata da più NULL.
- Un posto in attesa conta come **giocatore attivo** nel ricalcolo dei gruppi (deve fare il suo incontro) e può avere incontri, esemplari, tappe e override, scritti dal proprietario.
- L'invito alla run di un posto porta `invite.member_id`. Chi accetta valorizza `user_id` con il proprio utente e il posto diventa un membro vero; l'`id` del membro non cambia, quindi nessun dato si sposta.
- Un utente non può occupare due posti della stessa run (controllo nel dominio: se è già membro, l'accettazione è rifiutata con `already_member`).
- Il proprietario può togliere un posto in attesa (rimozione come per un giocatore) o assegnarlo a un altro invito.
- Il proprietario ha sempre `user_id`.

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

- **Pokédex SQLite** (schema in [Schema del Pokédex](15-Schema-del-Pokedex.md), P2-07): specie e forme, tipi per generazione, statistiche, abilità, mosse con i valori per generazione, learnset per version group, aree e incontri, nomi localizzati in una tabella unica (entità, id, lingua, nome). Generato da PokeAPI/api-data.
- **File dei dati di gioco**, uno per gioco: game\_id, generazione, version group, colore della run, aree in ordine con area\_key stabile e nomi per lingua, medaglie con capopalestra e level cap, numero di versione. Nei file, le stanze interne portano `parentAreaKey`: con la regola `separateRooms` spenta l'area effettiva di un incontro in una stanza è quella della grotta principale. Le tappe (`milestones`) sostituiscono l'elenco delle sole medaglie. Generati da nuzlocke.data e PokéAPI, validati con Zod all'avvio: un file non valido blocca l'avvio con un messaggio chiaro.
- Il database dell'app li richiama solo per chiave (`species_id`, `game_id`, `area_key`), così aggiornare i dati non richiede migrazioni.

## Decisioni sulle domande aperte

- [x] Starter: deciso, è un normale incontro collegato nello slot main dell'area speciale starter, in testa ai dati di gioco; non serve nessuna tabella in più. Incontri fissi e scambi in gioco: decisi, si trattano come i regali. Nei dati di gioco ogni regalo, incontro fisso o scambio ha una chiave propria e l'area a cui appartiene: con la regola attiva è un gruppo nello slot gift con la sua chiave; senza, conta come incontro main della sua area.
- [x] Deciso il 3 ottobre 2026: la dupes clause vale per il singolo giocatore; solo lui ha un nuovo tentativo e il gruppo resta aperto. "Già posseduta" vale per l'intera linea evolutiva: il controllo usa l'id della catena evolutiva del Pokédex, quindi non serve una colonna in più nel database dell'app. Contano tutti gli esemplari del giocatore nella run, anche quelli morti: il controllo legge specimen senza filtrare per posizione.
- [x] Eliminazione di un account: deciso, le run restano. La riga di user diventa anonima ("Utente eliminato", email, password e sessioni cancellate) invece di sparire, così chiavi esterne e diario restano validi; se era il proprietario, la proprietà passa al giocatore successivo per posto.
- [x] Run cancellate: deciso, recuperabili dal proprietario per 30 giorni grazie a deleted\_at, poi eliminate definitivamente da un job all'avvio e una volta al giorno.
