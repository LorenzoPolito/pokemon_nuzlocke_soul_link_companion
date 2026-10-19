# Nuzlocke SoulLink Companion – Mappa degli artefatti

Oct 3, 2026 · @Lorenzo

Questa mappa è l'elenco unico di tutto ciò che il progetto produce: ogni sessione parte da qui, e un nuovo artefatto esiste solo dopo essere stato aggiunto a questa tabella.

## Artefatti

Gli artefatti di governo esistono già; quelli tecnici nascono con il PBI indicato.

| Artefatto | Tipo | Contenuto | Prodotto da | Si aggiorna quando | Stato |
| --- | --- | --- | --- | --- | --- |
| Nuzlocke SoulLink Companion – Specifica dei requisiti | Documento | Requisiti funzionali e scelte di stack | Fase 0 | Il product owner approva una modifica a un requisito | Esiste |
| Nuzlocke SoulLink Companion – Piano di progetto | Documento | Fasi e gate | Fase 0 | Si chiude un gate | Esiste |
| Nuzlocke SoulLink Companion – MVP e rilasci | Documento | Ambito dell'MVP, PBI per rilascio, criteri di uscita | Fase 0 | Un PBI cambia rilascio o un rilascio si chiude | Esiste |
| Nuzlocke SoulLink Companion – Product Backlog | Documento | PBI per fase, dipendenze, taglie, criteri, Definition of Done | Fase 0 | All'apertura e alla chiusura di ogni sessione | Esiste |
| Backlog, tab Bug | Tab | Registro dei bug con gravità e stato | Fase 0 | Si apre un bug o ne cambia lo stato | Esiste |
| Backlog, tab Registro sessioni | Tab | Una riga per sessione: lavoro fatto, stime, consumi reali | Fase 0 | Alla chiusura di ogni sessione | Esiste |
| Doc | Documento | Ruoli, flusso, protocollo di sessione, verifica, test, bug, stime | Fase 0 | Il product owner approva una modifica alle regole | Esiste |
| Doc | Documento | Repository privato, protezione di main, verifica locale, immagini, account bot | Fase 0 | Cambia un'impostazione o un permesso | Esiste |
| Doc | Documento | Moduli, livelli, codice atomico e antifragile, convenzioni, checklist di revisione | Fase 0 | Il product owner approva una modifica alle linee guida | Esiste |
| [Design System](https://claude.ai/artifact/Ha8b2PYXvqyVVKo2evQnUL) | Design system | Token di colore, tipografia, spazi e forme; manuale di stile | Fase 0 | Cambia un token o una regola visiva | Esiste |
| [Mockup](https://claude.ai/artifact/4W1JWddYcx4VzH1EDXtB6r) | Canvas di design | Schermate per telefono e tablet, con più giocatori, stati vuoti, errori e tema scuro | Fase 0, poi P2-12 e P2-13 | Nasce o cambia una schermata | Esiste |
| Mappa degli artefatti | Documento | Questo elenco | Fase 0 | Nasce, cambia o si ritira un artefatto | Esiste |
| Regole Soullocke (PDF) | Fonte di progetto | Regole Nuzlocke e Soul Link di riferimento | Esterno | Mai: solo consultazione | Esiste |
| Analisi delle fonti dati | Documento | Copertura di PokéAPI, nomi localizzati, licenze | P1-01–P1-05, P1-10 | Durante la fase 1 | Da creare |
| Dati di gioco: aree, medaglie, level cap | Documento | Fonti e formato dei dati di progressione, prima per Bianco, Nero, Bianco 2, Nero 2 | P1-06, P1-07 | Durante la fase 1 | Da creare |
| Meccaniche per generazione | Documento | Tabelle dei tipi e regole di calcolo | P1-08, P1-09 | Durante la fase 1 | Da creare |
| Prove di fattibilità dello stack | Documento | Esiti e misure delle prove tecniche | P1-11–P1-17 | Durante la fase 1 | Da creare |
| [Modello dati](https://claude.ai/code/artifact/6ed22ebf-ed7e-4754-8cf0-193449b3206f) (bozza) | Documento | Tabelle, relazioni, schema del Pokédex | P2-01–P2-07 | Ogni modifica allo schema | Esiste |
| Architettura e API | Documento | Permessi, catalogo API, eventi SSE e lock | P2-08–P2-10 | Ogni modifica a un endpoint o evento | Da creare |
| Flussi e schermate | Documento | Percorsi utente e bozze delle schermate | P2-11–P2-13 | Ogni modifica a un flusso | Da creare |
| Piano di test | Documento | Casi di test di sistema ed end-to-end | P7-01 | Ogni nuova regola o bug corretto | Da creare |
| Guida di installazione | Documento | Docker, HTTP e reverse proxy, variabili d'ambiente, volume, backup, Turso | P3-02, P3-08, P3-13, P7-05, P7-06 | Ogni nuova variabile o rilascio | Da creare |
| Repository GitHub (privato) | Codice | Codice, test, dati di gioco, hook, README, CHANGELOG.md, ADR | P3-12, P3-01 | A ogni pull request | Da creare |
| Verifica locale | Script e hook | npm run verify e hook pre-push | P3-11 | Ogni nuovo livello o strumento di test | Da creare |
| Immagine Docker | Rilascio | Immagine con tag di versione, costruita sul server | P7-07 e ogni rilascio | A ogni rilascio | Da creare |
| [Rischi tecnici e fonti dei dati](https://claude.ai/code/artifact/c62bccc6-3edc-47b5-adfd-733d7e5ac724) | Documento | Registro dei rischi con esito delle verifiche, fonte di ogni dato | Fase 0, poi fase 1 | Una verifica cambia un rischio o una fonte | Esiste |

Repository, CI e immagini sono ospitati su GitHub, come descritto nella Doc.
