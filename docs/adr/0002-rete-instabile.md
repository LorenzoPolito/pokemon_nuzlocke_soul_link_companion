# ADR 0002 – Comportamento con rete instabile durante la partita

- **Stato**: Accettata
- **Data**: 19 ottobre 2026
- **Decide**: product owner (risposte alle domande R-1…R-7 di [Domande aperte](../progetto/12-Domande-aperte.md))
- **PBI collegati**: P1-19, P1-16, P2-09, P2-10, P4-10, P4-18, P4-21, P7-02

## Contesto

Chi gioca è spesso su telefono, con rete mobile o Wi-Fi di casa, e una partita dura ore. Erano già decisi la sincronizzazione con SSE, i lock consultivi con lease di 60 secondi rinnovato ogni 20, "vince l'ultimo" con avviso a chi è sovrascritto e il valore precedente nel diario ([decisione 11](0001-decisioni-di-progetto.md#11-concorrenza-lock-consultivi-e-vince-lultimo)). Le Linee guida chiedono richieste idempotenti e riconnessione automatica con riallineamento. Mancavano le regole di comportamento quando la rete cade.

## Decisione

1. **Senza rete non si modifica e non c'è nessuna coda.** Quando la connessione risulta persa, i pulsanti di salvataggio sono disattivati e ciò che l'utente stava scrivendo resta compilato (punto 6). Al ritorno della rete si salva a mano.
2. **Connessione persa e ritorno.** Il server manda un segnale SSE ogni 15 secondi. Dopo 40 secondi senza nessun evento compare un avviso discreto ("I dati potrebbero non essere aggiornati"). Il client si riconnette da solo con attese crescenti (1, 2, 4, 8 secondi, al massimo 30). Al ritorno invia l'identificativo dell'ultimo evento ricevuto e il server rimanda gli eventi mancanti dal diario della run; se sono troppi o il server è stato riavviato, il client ricarica l'intero stato della run. L'avviso scompare da solo al riallineamento.
3. **Lock.** Se il rinnovo ogni 20 secondi non riesce, il modulo resta aperto e il lock scade da solo dopo 60 secondi. Al ritorno il client prova a riprenderlo; se nel frattempo lo ha preso un altro, il modulo mostra "ora in modifica da …" e il salvataggio chiede conferma. Se si salva lo stesso, vince l'ultimo e chi è sovrascritto riceve l'avviso con il valore nuovo. Un riavvio del server azzera i lock senza errori e i moduli aperti li richiedono di nuovo alla riconnessione. Il disegno dei lock della specifica è **confermato**.
4. **Doppio invio e risposta persa.** Ogni scrittura porta una chiave di idempotenza generata dal client; se il server la riceve di nuovo, restituisce la prima risposta senza rifare nulla. La chiave vale 24 ore (tabella `request_key` del modello dati).
5. **Aggiornamenti.** Le modifiche semplici si vedono subito, con un indicatore discreto "in invio", annullato con un messaggio se il server rifiuta. Le azioni Soul Link (cattura con collegamento, team e box, morte, area saltata) non sono mai ottimistiche: attendono la risposta del server.
6. **Bozze.** Ciò che l'utente sta scrivendo si conserva nel browser, per modulo e per dato, e si cancella al salvataggio riuscito e comunque dopo 24 ore. Se l'archivio del browser non è disponibile (navigazione privata), l'app funziona senza bozze.
7. **Offline completo.** Fuori ambito fino alla 1.0; si rivaluta dopo la prima partita vera con la 0.1.

## Alternative scartate

- **Coda delle modifiche semplici per 10 minuti** (con partenza automatica al ritorno della rete): scartata dal product owner, per semplicità e per non applicare nulla a uno stato vecchio.
- Ricaricare sempre l'intero stato al ritorno: più semplice, ma più traffico su rete mobile.
- Bozze sul server: sopravvivono al cambio di dispositivo, ma aggiungono tabelle e un altro caso di conflitto.
- Aggiornamenti sempre ottimistici, oppure sempre in attesa del server.
- Un'app installabile con sincronizzazione differita fin dalla 0.1.

## Conseguenze

- Nessuna coda lato client: il caso "modifica accodata" non esiste e non servono scadenze delle code.
- Il diario `run_event`, con identificativi ordinabili nel tempo, è la base del recupero degli eventi mancanti; l'evento SSE porta il suo identificativo.
- Le soglie (15 e 40 secondi, attese di riconnessione) sono parametri da ritoccare dopo le prove di P1-16, che misura anche riconnessione e recupero e controlla che un reverse proxy non memorizzi in blocco le risposte SSE (da documentare in P3-13).
- Da recepire nei PBI: P2-09 (idempotenza), P2-10 (segnale, identificativo dell'ultimo evento, ripresa dei lock), P4-10 (bozze), P4-18 (avviso di connessione), P4-21 (lock ripresi alla riconnessione). Test di calo della rete con Playwright in P7-02.
