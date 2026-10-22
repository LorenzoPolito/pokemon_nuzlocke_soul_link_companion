# ADR 0009 – Decisioni della fase 2: registrazione, regole, permessi, helper

- **Stato**: Accettata
- **Data**: 22 ottobre 2026
- **Decide**: product owner
- **PBI collegati**: P2-01, P2-02, P2-03, P2-05, P2-08, P2-09, P2-12, P2-13, P2-14, P4-02

## Contesto

La fase 2 ha lasciato 13 punti con una proposta dell'agente ([Revisione del gate 2](../progetto/18-Revisione-del-gate-2.md#3-decisioni-che-servono-al-product-owner)). Il product owner ha risposto «Come proposto» il 22 ottobre 2026: l'agente lo intende come accettazione di tutte e 13 le proposte.

## Decisione

1. **Registrazione**: predefinita **su invito** (`registration.mode = invite`); un invito a una run vale come invito per registrarsi.
2. **Regole opzionali**: predefiniti dupes clause, regali/fissi/scambi separati, stanze interne e calcolatore **accesi**; restrizione del tipo primario e randomizer **spenti**. Dopo il primo incontro sono bloccate dupes clause, regali separati, tipo primario, stanze interne e difficoltà; calcolatore e randomizer restano modificabili.
3. **Proprietario che non gioca**: ammesso, con posto senza numero.
4. **Dati di un altro giocatore**: ogni giocatore modifica i propri incontri, esemplari, tappe e override; il proprietario quelli di tutti; spostamento di un gruppo e morte le può fare ogni giocatore.
5. **Rimozione di un giocatore**: sempre ammessa dal proprietario, anche dopo il primo incontro (rimozione o conversione in spettatore); i suoi dati restano. Cambia il criterio di P4-02, che la limitava al periodo senza incontri.
6. **Admin e dati delle run**: l'admin non entra nei dati di gioco di una run di cui non è membro.
7. **Override**: la chiave comprende la varietà; `base_stats` si salva completo.
8. **Gruppi**: stato `untracked` e incontri `untracked` automatici per chi entra a run iniziata; con `separateGifts` spento, tra regalo e selvatico dell'area vale il primo registrato.
9. **Cancellazione di un incontro catturato**: riservata al proprietario.
10. **Helper**: i moltiplicatori mantengono il loro colore come informazione; l'elenco dei tipi che l'avversario riceve segue l'ordine fisso dei tipi del gioco, non quello di efficacia.
11. **Descrizioni di mosse e abilità**: non nel Pokédex dell'MVP.
12. **Calcolo del danno**: sul server (modulo `battle`).
13. **Sessione di gioco** nel riepilogo di una run finita: eventi senza pause oltre 3 ore.

## Alternative scartate

Quelle elencate accanto a ogni proposta nei documenti di fase 2: registrazione aperta di base, modifica libera dei dati di tutti, rimozione limitata al periodo senza incontri, calcolo nel browser, descrizioni incluse.

## Conseguenze

- I documenti di fase 2 passano da «proposta» a «deciso» dove citano queste scelte; P4-02 cambia criterio.
- Il punto 10 modifica i mockup di `Lotta`: l'ordine di «riceve» diventa quello dei tipi.
- Il punto 11 toglie il segnaposto delle descrizioni dai mockup `Mossa` e `Abilita`.
- I mockup non sono stati ancora aggiornati: l'elenco delle differenze è in [Flussi e schermate](../progetto/17-Flussi-e-schermate.md); l'aggiornamento è un lavoro di design da pianificare prima delle schermate di fase 4.
