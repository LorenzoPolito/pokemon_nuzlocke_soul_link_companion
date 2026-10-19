# ADR 0003 – Giochi, aree, tappe e impostazioni della run

- **Stato**: Accettata
- **Data**: 19 ottobre 2026
- **Decide**: product owner (risposte alle domande D-1…D-7 di [Domande aperte](../progetto/12-Domande-aperte.md))
- **PBI collegati**: P1-01, P1-06, P1-07, P1-19, P2-02, P2-03, P2-06, P4-01, P4-03, P4-04, P4-15

## Contesto

I PBI P1-01, P1-04, P1-06 e P1-07 hanno prodotto i file di gioco in `data/games/` e hanno aperto domande sul significato di "gioco", sull'ordine delle aree, sulle stanze interne delle grotte, sulle grotte nascoste, sulla difficoltà di Nero 2 e Bianco 2 e su come registrare level cap e tappe. Dettagli in [Analisi delle fonti dati](../progetto/10-Analisi-delle-fonti-dati.md) e [Dati di gioco](../progetto/11-Dati-di-gioco.md).

## Decisione

1. **Un "gioco" è una versione**: `black`, `white`, `black-2`, `white-2`. La coppia (version group) serve per meccaniche e mosse imparabili. È la scelta già adottata nei file di gioco.
2. **L'ordine delle aree è solo di visualizzazione.** Ogni area si registra quando si vuole, senza blocchi; l'ordine serve a mostrare l'elenco e a collocare le tappe dei level cap.
3. **Stanze interne**: è una **regola opzionale della run**, "Stanze interne come aree separate", scelta alla creazione, **accesa di base**. Accesa, ogni stanza è un'area con il suo incontro; spenta, un incontro in una stanza conta nell'area della grotta principale. Non si può cambiare dopo il primo incontro registrato. Oggi le stanze sono: Guidance Chamber (Mistralton Cave), Trial Chamber (Victory Road di Nero e Bianco), Rocky Mountain Room, Iron Room e Glacier Room (Underground Ruins di Nero 2 e Bianco 2).
4. **Grotte nascoste di Nero 2 e Bianco 2**: si trattano come gli incontri fissi ([decisione 17](0001-decisioni-di-progetto.md#17-regali-incontri-fissi-e-scambi-in-gioco)): con la regola "regali separati" attiva sono un incontro a parte, altrimenti contano come incontro dell'area. La specie si sceglie dal Pokédex.
5. **Difficoltà di Nero 2 e Bianco 2**: impostazione della run, uguale per tutti i giocatori, **normale** di default; il level cap segue la scelta.
6. **Level cap per giocatore**, calcolato dal suo avanzamento; l'override manuale resta **uno solo per la run**.
7. **Tappe senza medaglia**: una tabella `run_milestone` (giocatore, chiave della tappa, data) **sostituisce `run_badge`**; la medaglia diventa un attributo della tappa. Vale per ogni gioco, anche senza palestre.

## Alternative scartate

- Gioco = coppia con la versione come opzione della run.
- Aree sbloccate solo dopo le precedenti.
- Stanze sempre separate o sempre unite, senza scelta della run; stanze spente di base.
- Grotte nascoste vietate, o sempre come incontro separato.
- Difficoltà sempre normale.
- Un solo level cap per la run, dal giocatore più indietro.
- Una seconda tabella per le tappe senza medaglia accanto a `run_badge`.

## Conseguenze

- **Modello dati**: `run_badge` diventa `run_milestone`; le impostazioni della run (`settings`) comprendono `separateRooms` e, per Nero 2 e Bianco 2, `difficulty`; un'area stanza porta nei dati la chiave dell'area principale (`parentAreaKey`), da cui si ricava l'area effettiva.
- **Dati di gioco** (aggiornati con questa ADR, `dataVersion` 2026.10.19-3): `parentAreaKey` sulle cinque stanze; incontri speciali di tipo `grotto` per area, con le specie possibili; livelli della modalità facile per le otto palestre e per Iris (una sola fonte, Bulbapedia). **Mancano** i livelli facili dei Superquattro e di Ghetsis.
- **Da verificare**: le ricerche non dicono in modo univoco se le modalità facile e sfida siano disponibili in entrambe le versioni e da quale punto del gioco si sbloccano; la run le offre comunque entrambe.
- **Da recepire nei PBI**: P2-02 (impostazioni), P2-03 (stanze e `parentAreaKey`), P2-06 (tappe), P4-01 (creazione della run), P4-03 (gioco = versione), P4-04 (elenco delle aree), P4-15 (tappe e level cap per giocatore).
