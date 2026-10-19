# Registro delle decisioni

Registro delle decisioni di progetto in stile ADR (Architecture Decision Record). Ogni voce ha un numero che non si riusa, una data, il contesto, la decisione, le alternative scartate e le conseguenze. Contesto e alternative vengono dai documenti in `docs/`; dove i documenti non ne parlano, la voce dice "non documentato".

Regole del registro:

- Una decisione si cambia solo con l'approvazione del product owner, aggiungendo una voce nuova che la sostituisce; la vecchia resta, con stato "Sostituita da N".
- Le linee guida di sviluppo prevedono anche gli ADR in `docs/adr/NNNN-titolo.md` (P3-01): fino a decisione diversa del product owner, questo file è il registro unico e `docs/adr/` non esiste.

| N. | Decisione | Stato |
| --- | --- | --- |
| 1 | [Stack: SvelteKit con adapter Node, TypeScript strict, un solo container](#1-stack-sveltekit-con-adapter-node-typescript-strict-un-solo-container) | Accettata |
| 2 | [Database: libSQL su file locale, Turso opzionale](#2-database-libsql-su-file-locale-turso-opzionale) | Accettata |
| 3 | [ORM e migrazioni: Drizzle, solo in avanti, all'avvio](#3-orm-e-migrazioni-drizzle-solo-in-avanti-allavvio) | Accettata |
| 4 | [Autenticazione: Better Auth, admin da variabili d'ambiente](#4-autenticazione-better-auth-admin-da-variabili-dambiente) | Accettata |
| 5 | [Lingue: Paraglide, italiano e inglese, cambio con ricarica](#5-lingue-paraglide-italiano-e-inglese-cambio-con-ricarica) | Accettata |
| 6 | [Pokédex: SQLite in sola lettura generato in build](#6-pokédex-sqlite-in-sola-lettura-generato-in-build) | Accettata |
| 7 | [Dati di gioco da nuzlocke.data e PokéAPI](#7-dati-di-gioco-da-nuzlockedata-e-pokéapi) | Accettata |
| 8 | [Calcolatore danni @smogon/calc, attivabile per run; l'helper non suggerisce](#8-calcolatore-danni-smogoncalc-attivabile-per-run-lhelper-non-suggerisce) | Accettata |
| 9 | [Un gioco per run, regole comuni, override per giocatore](#9-un-gioco-per-run-regole-comuni-override-per-giocatore) | Accettata |
| 10 | [Run già iniziata](#10-run-già-iniziata) | Accettata |
| 11 | [Concorrenza: lock consultivi e vince l'ultimo](#11-concorrenza-lock-consultivi-e-vince-lultimo) | Accettata |
| 12 | [Rete: solo HTTP](#12-rete-solo-http) | Accettata |
| 13 | [Repository privato senza CI, verifica locale](#13-repository-privato-senza-ci-verifica-locale) | Modificata da 23 |
| 14 | [Agente: app Claude per GitHub](#14-agente-app-claude-per-github) | Integrata da 24 |
| 15 | [Dupes clause per giocatore, su tutta la linea evolutiva](#15-dupes-clause-per-giocatore-su-tutta-la-linea-evolutiva) | Accettata |
| 16 | [Starter come incontro collegato nell'area `starter`](#16-starter-come-incontro-collegato-nellarea-starter) | Accettata |
| 17 | [Regali, incontri fissi e scambi in gioco](#17-regali-incontri-fissi-e-scambi-in-gioco) | Accettata |
| 18 | [Account eliminato e run cancellate](#18-account-eliminato-e-run-cancellate) | Accettata |
| 19 | [MVP 0.1: Bianco, Nero, Bianco 2, Nero 2](#19-mvp-01-bianco-nero-bianco-2-nero-2) | Accettata |
| 20 | [Design: Material 3 e Apple, font di sistema, token](#20-design-material-3-e-apple-font-di-sistema-token) | Accettata |
| 21 | [La documentazione nel repository è l'unica fonte valida](#21-la-documentazione-nel-repository-è-lunica-fonte-valida) | Accettata |
| 22 | [Git flow: `main` e `develop`](#22-git-flow-main-e-develop) | Accettata |
| 23 | [GitHub Actions solo per il controllo dei branch, gratis](#23-github-actions-solo-per-il-controllo-dei-branch-gratis) | Accettata |
| 24 | [L'agente può approvare le proprie pull request](#24-lagente-può-approvare-le-proprie-pull-request) | Accettata |
| 25 | [Protezioni con gli hook di Claude Code e di git](#25-protezioni-con-gli-hook-di-claude-code-e-di-git) | Accettata |

---

## 1. Stack: SvelteKit con adapter Node, TypeScript strict, un solo container

- **Data**: 3 ottobre 2026
- **Contesto**: l'app è self-hosted in un unico container Docker e deve restare leggera e veloce anche su telefono. La specifica motiva la scelta con "poco JavaScript nel browser, frontend e backend in un solo progetto" ([Specifica, Architettura e stack](progetto/01-Specifica-dei-requisiti.md#architettura-e-stack)). Le linee guida chiedono TypeScript strict, senza `any` ([Linee guida](progetto/05-Linee-guida-di-sviluppo.md#convenzioni-di-codice-e-interfaccia)).
- **Decisione**: SvelteKit con adapter Node, TypeScript in modalità strict, tutto (interfaccia, API, SSE, Pokédex) in un solo container costruito con build multi-stage su Node Alpine.
- **Alternative scartate**: non documentato.
- **Conseguenze**: un solo processo Node serve tutto; i lock in memoria e l'hub SSE presuppongono una sola istanza, e con più istanze servirebbe un canale di notifica condiviso ([Specifica, Vincoli](progetto/01-Specifica-dei-requisiti.md#vincoli-e-punti-aperti)). Lo scheletro nasce con P3-01, l'immagine con P3-02; dimensione stimata 150–200 MB, da misurare in P1-17.

## 2. Database: libSQL su file locale, Turso opzionale

- **Data**: 3 ottobre 2026
- **Contesto**: i dati utente devono stare nello stesso container, con la possibilità di passare a un database online cambiando solo variabili d'ambiente. La specifica motiva libSQL con "nessuna rete tra app e database, stesso codice in locale e online, piano gratuito Turso da 5 GB".
- **Decisione**: libSQL su file locale in un volume Docker (per esempio `/data/app.db`) come predefinito; Turso opzionale, con lo stesso codice, attivato da `TURSO_URL` e `TURSO_TOKEN` (P3-03).
- **Alternative scartate**: Neon (Postgres gestito), scartato per restare leggeri e in un solo container. Il segnaposto del diagramma di architettura nella specifica ("container, Neon, dati PokéAPI") è un residuo di questa alternativa: il diagramma nel PDF va aggiornato quando si ridisegna.
- **Conseguenze**: senza volume, ricreando il container si perde tutto; i backup sono a carico di chi installa (copia del file o Litestream), provati in P7-06. Impostazioni all'avvio: WAL, foreign_keys ON, busy_timeout 5000 ms, synchronous NORMAL ([Modello dati](progetto/06-Modello-dati-bozza.md#prestazioni-ed-evoluzione)). Turso entra nel rilascio 1.0 ([MVP e rilasci](progetto/03-MVP-e-rilasci.md)); la fattibilità si prova in P1-12.

## 3. ORM e migrazioni: Drizzle, solo in avanti, all'avvio

- **Data**: 3 ottobre 2026
- **Contesto**: il modello dati deve evolvere senza rompere le versioni precedenti e senza interventi a mano sul database. Il modello dati prevede migrazioni drizzle-kit applicate all'avvio, con una copia del file prima di ogni migrazione ([Modello dati, Evoluzione dello schema](progetto/06-Modello-dati-bozza.md#prestazioni-ed-evoluzione)).
- **Decisione**: Drizzle ORM con drizzle-kit; migrazioni solo in avanti, applicate all'avvio; una correzione è sempre una nuova migrazione.
- **Alternative scartate**: non documentato.
- **Conseguenze**: si usa il metodo "espandi e contrai" (colonna nuova nullable, popolata, usata; la vecchia si toglie in un rilascio successivo). Un errore di migrazione blocca l'avvio con un messaggio chiaro (P3-03). Le regole nuove della run non richiedono migrazioni perché le impostazioni sono un JSON versionato.

## 4. Autenticazione: Better Auth, admin da variabili d'ambiente

- **Data**: 3 ottobre 2026
- **Contesto**: l'app usa account veri con login e un amministratore creato al primo avvio del container ([Specifica, Account](progetto/01-Specifica-dei-requisiti.md#account-ruoli-e-amministrazione)). Better Auth "gira nel container, nessun servizio esterno"; ha un adattatore Drizzle per SQLite e la sua CLI genera lo schema ([Rischi](progetto/07-Rischi-tecnici-e-fonti-dei-dati.md#registro-dei-rischi), rischio basso).
- **Decisione**: Better Auth con email e password; l'admin si crea al primo avvio da `ADMIN_EMAIL` e `ADMIN_PASSWORD`, solo se non esiste già, con cambio password obbligatorio al primo accesso.
- **Alternative scartate**: non documentato.
- **Conseguenze**: tabelle user, session, account, verification gestite da Better Auth, con `role`, `must_change_password`, `locale`, `theme`, `disabled_at` aggiunte a user. Se le variabili mancano e non esiste un admin, l'avvio si ferma (P3-08). Prova di fattibilità con il client libSQL asincrono in P1-13.

## 5. Lingue: Paraglide, italiano e inglese, cambio con ricarica

- **Data**: 3 ottobre 2026
- **Contesto**: la lingua è sempre selezionabile, con italiano e inglese completi. Con Paraglide 2 `setLocale()` ricarica la pagina; il cambio senza ricarica è un'eccezione limitata al browser ([Rischi](progetto/07-Rischi-tecnici-e-fonti-dei-dati.md#registro-dei-rischi)).
- **Decisione**: interfaccia tradotta con Paraglide, italiano e inglese completi; il cambio lingua ricarica la pagina mantenendo la schermata corrente. Nomi di Pokémon, mosse e abilità dai nomi localizzati di PokéAPI, con l'inglese come riserva.
- **Alternative scartate**: cambio lingua senza ricarica, scartato perché con Paraglide 2 è un'eccezione limitata al browser; i criteri di P1-14 e P6-07 sono stati corretti di conseguenza.
- **Conseguenze**: nel browser arriva solo la lingua in uso; un controllo automatico segnala le chiavi mancanti (P3-05). I nomi italiani delle aree potrebbero mancare in PokéAPI: in quel caso stanno nei file dei dati di gioco (P1-05).

## 6. Pokédex: SQLite in sola lettura generato in build

- **Data**: 3 ottobre 2026
- **Contesto**: il Pokédex copre tutte le generazioni e le ricerche "non toccano né il database utente né internet" ([Specifica, Pokédex](progetto/01-Specifica-dei-requisiti.md#pokédex)). PokéAPI ha licenza BSD a 3 clausole.
- **Decisione**: un file SQLite in sola lettura, generato nello stage di build dell'immagine da uno snapshot di [PokeAPI/api-data](https://github.com/PokeAPI/api-data) e incluso nell'immagine.
- **Alternative scartate**: interrogare PokéAPI online durante l'uso, esclusa dalla specifica perché le ricerche non devono toccare internet. Altre alternative: non documentato.
- **Conseguenze**: i dati Pokémon si aggiornano solo con un nuovo rilascio; la versione dei dati è registrata e visibile all'admin (P3-04). Dimensione e tempi si misurano in P1-15; lo schema si progetta in P2-07. Gli sprite non sono nel file: arrivano dal repository sprite di PokéAPI, in cache nel browser.

## 7. Dati di gioco da nuzlocke.data e PokéAPI

- **Data**: 3 ottobre 2026
- **Contesto**: ordine delle aree, capipalestra, medaglie e level cap non sono in PokéAPI. Il progetto [nuzlocke.data](https://github.com/domtronn/nuzlocke.data) ha aree in ordine e lotte dei boss, ma nessuna licenza; per Cheren in Bianco 2 due fonti danno livelli diversi ([Rischi](progetto/07-Rischi-tecnici-e-fonti-dei-dati.md#registro-dei-rischi), rischio alto).
- **Decisione**: si usano i dati di nuzlocke.data senza chiedere, perché l'app resta privata e non commerciale (rischio accettato); i dati Pokémon e gli incontri vengono da PokéAPI. In P1-06 e P1-07 i dati si importano, si verificano e i conflitti si risolvono con una seconda fonte annotata.
- **Alternative scartate**: chiedere l'autorizzazione all'autore di nuzlocke.data, scartata ("senza chiedere"). La tabella "Dove troveremo i dati" del documento Rischi indicava per capipalestra e level cap una "compilazione manuale" da guide pubbliche ("dati fattuali da ricompilare, non copiare"): la decisione la supera per l'uso privato.
- **Conseguenze**: se un giorno l'app viene condivisa, i dati presi da nuzlocke.data vanno sostituiti o autorizzati; per questo ogni riga dei file in `data/games/` annota la propria fonte. I file sono validati con Zod all'avvio e un file non valido blocca l'avvio.

## 8. Calcolatore danni @smogon/calc, attivabile per run; l'helper non suggerisce

- **Data**: 3 ottobre 2026
- **Contesto**: l'helper per le lotte deve "aiutare con informazioni complete, senza suggerire la mossa da usare" ([Specifica, Helper](progetto/01-Specifica-dei-requisiti.md#helper-per-le-lotte)). @smogon/calc copre le meccaniche di tutte le generazioni e accetta dati di specie personalizzati, da cui prende anche i tipi ([Rischi](progetto/07-Rischi-tecnici-e-fonti-dei-dati.md#registro-dei-rischi)).
- **Decisione**: @smogon/calc è sempre incluso nell'app e si attiva o disattiva per run; riceve gli override del giocatore come dati di specie. L'helper mostra efficacia, STAB, categoria e potenza, ma non ordina, non evidenzia e non suggerisce mai una mossa.
- **Alternative scartate**: non documentato.
- **Conseguenze**: con il calcolatore disattivo non compare in nessuna schermata della run (P5-13). Il peso aggiunto al bundle si misura in P1-11; la licenza MIT va confermata in P1-10. Il design system vieta colori, ordini o badge da "mossa migliore". Non è nell'MVP (rilasci 0.3 e 0.4).

## 9. Un gioco per run, regole comuni, override per giocatore

- **Data**: 3 ottobre 2026
- **Contesto**: una run Soul Link coinvolge N giocatori che giocano in parallelo; il collegamento degli incontri per area presuppone le stesse aree per tutti. La scelta del gioco unico è stata introdotta dall'assessment del progetto ([Registro sessioni](backlog/02-Registro-sessioni.md)).
- **Decisione**: ogni run ha un solo gioco, uguale per tutti i giocatori, che non cambia dopo il primo incontro; le regole scelte alla creazione valgono per tutti. Solo gli override di specie sono del singolo giocatore, con chiave run + giocatore + specie, e valgono solo dentro la run.
- **Alternative scartate**: non documentato.
- **Conseguenze**: il gioco è una chiave del file di gioco su `run.game_id`; medaglie e override appartengono al giocatore nella run (`run_member`), non all'utente. Il Pokédex globale e le altre run non vedono mai gli override. Il pulsante "copia override" serve a chi usa lo stesso seed di un randomizer (P5-03).

## 10. Run già iniziata

- **Data**: 3 ottobre 2026
- **Contesto**: la specifica vuole che il companion "si possa adottare in qualsiasi momento" ([Specifica, Run già iniziate](progetto/01-Specifica-dei-requisiti.md#run-giocatori-e-regole)).
- **Decisione**: si può creare una run a gioco già avviato indicando medaglie, level cap, aree già visitate (con esito o come "precedenti, non tracciate"), team, box e morti con i collegamenti; i dati mancanti si completano dopo.
- **Alternative scartate**: non documentato.
- **Conseguenze**: il modello dati ha `run.started_in_progress` e l'esito `untracked` sugli incontri. La funzione è nel rilascio 0.2, non nell'MVP (P4-19).

## 11. Concorrenza: lock consultivi e vince l'ultimo

- **Data**: 3 ottobre 2026
- **Contesto**: più giocatori modificano la stessa run in tempo reale, spesso da telefono e con reti poco affidabili. La specifica descrive il disegno completo ([Specifica, Concorrenza e lock](progetto/01-Specifica-dei-requisiti.md#concorrenza-e-lock)).
- **Decisione**: lock consultivi in memoria sul singolo dato, presi all'apertura del modulo di modifica, con lease di 60 secondi rinnovato ogni 20; se due giocatori salvano lo stesso dato vince l'ultimo, grazie a un numero di versione, e chi è stato sovrascritto riceve un avviso con i valori nuovi. Il valore precedente resta nel diario.
- **Alternative scartate**: lock salvati nel database, esclusi dal modello dati ("nessuna tabella per i lock"); sblocco forzato da parte di un utente, ritenuto non necessario perché ogni lock scade da solo. Lock che bloccano davvero la modifica: esclusi dalla specifica ("dicono chi sta modificando un dato senza bloccare nessuno").
- **Conseguenze**: ogni dato modificabile ha una colonna `version`; un riavvio azzera i lock senza errori; presa e rilascio viaggiano via SSE. Il disegno va confermato con il product owner in P1-19, insieme al comportamento con rete instabile. Implementazione in P4-21.

## 12. Rete: solo HTTP

- **Data**: 3 ottobre 2026
- **Contesto**: l'app deve girare su qualsiasi server. Durante la verifica dei rischi l'HTTPS è stato tolto dall'ambito ([Rischi](progetto/07-Rischi-tecnici-e-fonti-dei-dati.md#registro-dei-rischi), rischio chiuso).
- **Decisione**: l'app parla solo HTTP; chi vuole HTTPS mette davanti un reverse proxy esterno, senza modifiche all'app.
- **Alternative scartate**: HTTPS gestito dall'app, con certificati propri, tolto dall'ambito; P3-13 è stato ridotto a compatibilità con reverse proxy.
- **Conseguenze**: dietro un proxy l'app legge protocollo e indirizzo originali dalle intestazioni inoltrate e marca i cookie Secure quando il proxy indica HTTPS; in HTTP il pannello admin avvisa che password e sessioni viaggiano in chiaro (P3-13).

## 13. Repository privato senza CI, verifica locale

- **Data**: 3 ottobre 2026
- **Contesto**: l'assessment del progetto ha scelto un repository privato senza CI ([Regole di lavoro, Modifiche alle regole](progetto/04-Regole-di-lavoro.md#modifiche-alle-regole)). Sul piano Free di GitHub regole di protezione e ruleset esistono solo per i repository pubblici ([Configurazione di GitHub](progetto/08-Configurazione-di-GitHub.md#decisioni)).
- **Decisione**: repository privato, nessuna CI; i controlli girano in locale con `npm run verify` (lint, tipi, test di unità e di sistema, build dell'immagine) e un hook pre-push versionato in `.githooks/`, che blocca anche i push su `main`.
- **Alternative scartate**: CI su GitHub Actions, scartata dall'assessment; ruleset e protezione di `main`, non disponibili sui repository privati del piano Free (si attiveranno solo con un eventuale passaggio a GitHub Pro).
- **Conseguenze**: la protezione di `main` è affidata all'hook e alle regole di lavoro; il modello di pull request chiede l'esito della verifica; GitHub Actions resta disattivato. L'hook si attiva a mano con `git config core.hooksPath .githooks`; finché P3-11 non arriva, blocca solo i push su `main`. La decisione 23 riattiva GitHub Actions per il solo controllo dei branch delle pull request; la decisione 22 estende l'hook a `develop`.

## 14. Agente: app Claude per GitHub

- **Data**: 3 ottobre 2026
- **Contesto**: la Configurazione di GitHub prevedeva un account bot dedicato, collaboratore del solo repository, con un token fine-grained a 90 giorni. Il motivo della sostituzione non è documentato.
- **Decisione**: l'agente lavora tramite l'app Claude per GitHub, che sostituisce l'account bot. Crea branch, fa push e apre pull request; non unisce, non crea tag e non cambia impostazioni del repository.
- **Alternative scartate**: account bot dedicato con token fine-grained, previsto nei documenti fino a questa decisione.
- **Conseguenze**: niente token da creare, ruotare o revocare a mano; l'accesso si gestisce dalle impostazioni dell'app su GitHub. L'app ha tecnicamente il permesso di unire: unisce solo il product owner, per regola. I commit dell'agente portano l'autore Claude, così si distinguono da quelli del product owner. Il criterio di P3-12 sull'account bot è stato riscritto di conseguenza. Dal 19 ottobre 2026 si sa che l'agente agisce con l'account del product owner: vedi la decisione 24.

## 15. Dupes clause per giocatore, su tutta la linea evolutiva

- **Data**: 3 ottobre 2026
- **Contesto**: le regole di riferimento descrivono la dupes clause come "se il primo incontro è una specie che possiedi già, puoi saltarlo e avere un altro incontro" ([Regole Soullocke](fonti/Regole-Soullocke.pdf)), senza dire come si applica con più giocatori collegati.
- **Decisione**: con la regola attiva, la dupes clause vale per il singolo giocatore: solo lui ha un nuovo tentativo nell'area e il gruppo resta aperto; gli incontri degli altri restano validi e il collegamento avviene con il suo nuovo incontro. "Già posseduta" vale per l'intera linea evolutiva e conta tutti gli esemplari del giocatore nella run, anche morti.
- **Alternative scartate**: non documentato.
- **Conseguenze**: il controllo usa l'id della catena evolutiva del Pokédex e legge gli esemplari senza filtrare per posizione; il modello dati ha `encounter.attempt` e l'esito `dupe` ([Modello dati](progetto/06-Modello-dati-bozza.md#decisioni-sulle-domande-aperte)). Regola opzionale, nel rilascio 0.2 (P4-08).

## 16. Starter come incontro collegato nell'area `starter`

- **Data**: 3 ottobre 2026
- **Contesto**: la specifica dice che lo starter "conta come un normale incontro collegato", ma serviva un posto nei dati per registrarlo.
- **Decisione**: lo starter è un normale incontro collegato, nello slot `main` dell'area speciale `starter`, in testa all'ordine delle aree di ogni gioco.
- **Alternative scartate**: una tabella apposita per lo starter, ritenuta non necessaria. Altre: non documentato.
- **Conseguenze**: ogni file di gioco in `data/games/` comincia con l'area `starter` (P1-06); lo starter segue tutte le regole Soul Link (stesso destino, morte condivisa).

## 17. Regali, incontri fissi e scambi in gioco

- **Data**: 3 ottobre 2026
- **Contesto**: le regole di riferimento considerano "quasi universale" che i Pokémon regalati contino come incontri separati da quello dell'area ([Regole Soullocke](fonti/Regole-Soullocke.pdf)); la specifica la rende una regola opzionale.
- **Decisione**: regali, incontri fissi e scambi in gioco sono incontri separati se la regola è attiva, altrimenti contano come incontro dell'area in cui avvengono. Nei dati di gioco ognuno ha una chiave propria e l'area a cui appartiene.
- **Alternative scartate**: non documentato.
- **Conseguenze**: con la regola attiva l'incontro è un gruppo nello slot `gift` con la sua chiave; senza, è l'incontro `main` della sua area ([Modello dati](progetto/06-Modello-dati-bozza.md#decisioni-sulle-domande-aperte)). I regali seguono le stesse regole di link. Regola opzionale, nel rilascio 0.2 (P4-09).

## 18. Account eliminato e run cancellate

- **Data**: 3 ottobre 2026
- **Contesto**: le run sono condivise tra più giocatori: eliminare un account non deve rompere le run degli altri né il diario.
- **Decisione**: un account eliminato diventa una riga anonima ("Utente eliminato", con email, password e sessioni cancellate); le sue run restano e, se era il proprietario, la proprietà passa al giocatore successivo per posto. Una run cancellata è recuperabile dal proprietario per 30 giorni, poi viene eliminata definitivamente.
- **Alternative scartate**: eliminare fisicamente la riga dell'utente, scartata perché romperebbe chiavi esterne e diario. Per le run: non documentato.
- **Conseguenze**: il modello dati ha `run.deleted_at`; un job all'avvio e una volta al giorno elimina le run cancellate da più di 30 giorni. Implementazione in P3-09 (account) e P4-14 (run).

## 19. MVP 0.1: Bianco, Nero, Bianco 2, Nero 2

- **Data**: 3 ottobre 2026
- **Contesto**: l'MVP serve a giocare una vera run Soul Link il prima possibile ([MVP e rilasci](progetto/03-MVP-e-rilasci.md)). Il motivo della scelta della quinta generazione non è documentato.
- **Decisione**: l'MVP (versione 0.1) supporta Pokémon Bianco, Nero, Bianco 2 e Nero 2; le altre generazioni arrivano con i rilasci 0.5 e 1.0.
- **Alternative scartate**: non documentato.
- **Conseguenze**: i PBI di fase 1 sui dati di gioco (P1-01, P1-04, P1-06, P1-07) partono da questi quattro giochi; i dati Pokémon dell'MVP si limitano a specie, tipi e nomi della quinta generazione. L'MVP comprende 59 dei 96 PBI.

## 20. Design: Material 3 e Apple, font di sistema, token

- **Data**: 3 ottobre 2026
- **Contesto**: l'app deve sembrare "leggera come un'app di sistema", soprattutto su telefono ([Design system](design-system/README.md)).
- **Decisione**: lo stile segue Material Design 3 e le Human Interface Guidelines di Apple; si usano i font di sistema e solo i token del design system in [`design-system/tokens.json`](design-system/tokens.json), come variabili CSS.
- **Alternative scartate**: non documentato (il design system esclude i font da scaricare in nome della leggerezza).
- **Conseguenze**: nessun valore esadecimale nei componenti; ogni schermata parte dai mockup e uno scostamento si discute prima. Il canvas dei mockup contiene una copia dei token in `mockup/ds/soullink/tokens.json`: in caso di differenze vale `design-system/tokens.json`.

## 21. La documentazione nel repository è l'unica fonte valida

- **Data**: 3 ottobre 2026
- **Contesto**: i documenti erano Claude Docs su claude.ai, esportati in uno zip il 3 ottobre 2026; il README dello zip chiedeva di scegliere una sola fonte aggiornata e mantenere solo quella.
- **Decisione**: da ora la documentazione in `docs/` è l'unica fonte valida; le copie su claude.ai non si aggiornano più.
- **Alternative scartate**: continuare ad aggiornare i Claude Docs su claude.ai, scartata. Tenere due fonti in parallelo, esclusa dal README dello zip.
- **Conseguenze**: backlog, bug e registro sessioni sono file in `docs/backlog/` e si aggiornano con le pull request; i link interni puntano ai file del repository. Fa eccezione il canvas dei mockup, che si visualizza solo su claude.ai e resta collegato lì. I PDF in `docs/progetto/pdf/` sono copie del 3 ottobre 2026 e non si aggiornano: quando un diagramma cambia, si aggiorna il Markdown.

## 22. Git flow: `main` e `develop`

- **Data**: 19 ottobre 2026
- **Contesto**: le Regole di lavoro prevedevano un solo ramo stabile, `main`, con un branch per PBI unito direttamente su `main`. Il product owner ha chiesto di seguire git flow, con `main` e `develop` protetti.
- **Decisione**:
  - `main` contiene solo i rilasci e riceve modifiche solo da pull request che partono da `develop`. I tag di versione si creano su `main`.
  - `develop` è il ramo di integrazione e riceve modifiche solo da pull request di branch `pbi/…`, `bug/…` o `chore/…`, creati da `develop`.
  - Le pull request verso `develop` si uniscono con squash merge (un commit per PBI); quella di rilascio da `develop` a `main` con un merge commit, così i due rami non divergono.
  - Non si usano branch `release/…` né `hotfix/…`: una correzione urgente è un `bug/…` verso `develop`, seguito da un rilascio.
- **Alternative scartate**: il flusso con il solo `main` previsto fino a questa decisione; git flow completo con `release/…` e `hotfix/…`, escluso perché verso `main` si va solo da `develop`.
- **Conseguenze**: l'hook pre-push rifiuta i push su `main` e su `develop`; la verifica con i test end-to-end gira su `develop` dopo ogni unione, e su `main` prima di ogni rilascio. Nelle impostazioni del repository restano attivi squash merge e merge commit; quale usare dipende dal ramo di destinazione, per regola. `develop` è nato il 19 ottobre 2026 dal commit iniziale vuoto, lo stesso di `main`.

## 23. GitHub Actions solo per il controllo dei branch, gratis

- **Data**: 19 ottobre 2026
- **Contesto**: la decisione 13 disattivava GitHub Actions. Su un repository privato del piano Free non esistono ruleset, quindi GitHub non può impedire una pull request da un branch sbagliato. Il product owner vuole un controllo automatico senza spendere nulla.
- **Decisione**: GitHub Actions si riattiva per un solo workflow, `.github/workflows/branch-policy.yml`. Il workflow verifica che una pull request verso `main` parta da `develop` e che una verso `develop` parta da `pbi/…`, `bug/…` o `chore/…`. Gira in pochi secondi, con timeout di 1 minuto, dentro i minuti gratuiti del piano Free; il budget di spesa per Actions resta a 0 dollari. La verifica completa (`npm run verify`) resta locale: non c'è CI.
- **Alternative scartate**: GitHub Pro con ruleset, scartato per il costo; repository pubblico, scartato perché il repository resta privato; nessun controllo, scartato perché il product owner vuole il vincolo sui branch.
- **Conseguenze**: senza ruleset un controllo rosso non blocca il pulsante di unione. Si vede però sulla pull request, e per regola una pull request con il controllo rosso non si unisce. Se i minuti gratuiti finiscono, con budget a 0 il workflow si ferma senza addebiti.

## 24. L'agente può approvare le proprie pull request

- **Data**: 19 ottobre 2026
- **Contesto**: il 19 ottobre 2026 è emerso che l'agente agisce su GitHub con l'account del product owner (`LorenzoPolito`): le pull request risultano aperte da lui, solo i commit hanno come autore Claude. GitHub non consente a chi ha aperto una pull request di approvarla, quindi l'approvazione formale ("Approve") non è possibile né per l'agente né per il product owner.
- **Decisione**: l'agente può approvare le proprie pull request. Lo fa con una revisione di tipo commento che comincia con "Approvata dall'agente", e riporta la checklist di revisione e l'esito della verifica locale. L'agente non unisce: unisce solo il product owner. Le protezioni (hook pre-push e controllo dei branch) valgono anche per l'agente.
- **Alternative scartate**: un account bot separato per l'agente (la proposta iniziale della decisione 14), che renderebbe possibile l'approvazione formale; non adottato per ora e da riconsiderare se l'approvazione formale diventa necessaria.
- **Conseguenze**: nella cronologia di GitHub le azioni dell'agente e del product owner hanno lo stesso autore; si distinguono dai commit (autore Claude), dalla firma in fondo ai commenti e dalla revisione "Approvata dall'agente". La conseguenza della decisione 14 sulla distinzione delle azioni vale solo per i commit.

## 25. Protezioni con gli hook di Claude Code e di git

- **Data**: 19 ottobre 2026
- **Contesto**: attivando le regole di protezione dei branch, GitHub ha risposto che "non saranno applicate su questo repository privato finché non si passa a un account di organizzazione GitHub Team o Enterprise". Il product owner ha scelto di non farlo e di gestire il più possibile con gli hook. Il branch predefinito è rimasto `main`, perché GitHub non ha permesso di cambiarlo.
- **Decisione**: le regole di git flow e di lavoro sono applicate in tre punti, in aggiunta al controllo `branch-policy` (decisione 23).
  - **Hook di Claude Code** (`.claude/settings.json` e `.claude/hooks/guard.cjs`), prima di ogni azione dell'agente:
    - **vietati**: push su `main` e `develop`, commit e merge locali su quei rami, unione di pull request (anche automatica), tag e push di tag, `--no-verify`, cambio di `core.hooksPath`, pull request verso il ramo sbagliato, scritture con l'API su `main` e `develop`;
    - **con conferma del product owner**: push forzati, cancellazione di rami, `rebase`, `commit --amend`, `reset --hard`, scritture dirette sull'API di GitHub, modifiche agli hook, a `.claude/settings.json` e ai workflow.
  - **Hook SessionStart di Claude Code**: a ogni avvio di sessione imposta `core.hooksPath` su `.githooks`, così gli hook di git sono sempre attivi per l'agente.
  - **Hook di git** in `.githooks/`, per chiunque abbia `core.hooksPath` impostato:
    - `pre-commit`: rifiuta i commit su `main` e `develop` e i file `.env` e di database;
    - `commit-msg`: impone i Conventional Commits con l'ID (`docs(P1-01): …`), ammettendo i messaggi generati da git;
    - `pre-push`: rifiuta i push su `main` e `develop` e i push forzati.
- **Alternative scartate**: un account di organizzazione GitHub Team o Enterprise, scartato per il costo; il repository pubblico, scartato perché il repository resta privato.
- **Conseguenze**:
  - Le protezioni sono locali. Il product owner può saltare gli hook di git con `--no-verify` quando serve (per esempio per un tag o una correzione d'emergenza); l'agente no, perché l'hook di Claude Code glielo vieta.
  - Il product owner deve impostare una volta `git config core.hooksPath .githooks` sul proprio clone.
  - Con `main` come branch predefinito, ogni nuova pull request va aperta indicando `develop` come destinazione: l'hook di Claude Code lo impone all'agente, e il controllo `branch-policy` lo segnala per tutti.
  - Gli hook usano solo `sh`, `git` e `node`, già richiesto da Claude Code.
  - Il documento Configurazione di GitHub indicava GitHub Pro per i ruleset sui repository privati; secondo il messaggio ricevuto il 19 ottobre 2026 serve un'organizzazione Team o Enterprise.
