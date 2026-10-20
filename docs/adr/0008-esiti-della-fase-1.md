# ADR 0008 – Esiti della fase 1: Turso, lingue nel client, forme cosmetiche

- **Stato**: Accettata
- **Data**: 20 ottobre 2026
- **Decide**: product owner
- **PBI collegati**: P1-12, P1-14, P1-02, P1-18

## Contesto

Le prove di fattibilità della fase 1 hanno lasciato tre punti aperti ([prove](../progetto/14-Prove-di-fattibilita.md)): la parte Turso di P1-12 non è verificabile dall'ambiente di lavoro dell'agente (rete bloccata, nessun database di prova); Paraglide mette nel client entrambe le lingue (P1-14); le forme cosmetiche dei Pokémon erano rimaste "non tracciate" in attesa di conferma ([ADR 0006](0006-varieta-dell-esemplare.md)). Il product owner ha risposto "Ok procedi" al resoconto che proponeva queste tre scelte; l'agente lo ha inteso come accettazione delle proposte.

## Decisione

1. **Turso**: la fase 1 chiude P1-12 come "verificato in locale". La verifica su Turso si fa in P3-03, dove il criterio esiste già (`TURSO_URL` e `TURSO_TOKEN`), con un database di prova creato dal product owner e il token come segreto dell'ambiente. Il codice resta uguale per i due casi; cambiano solo le variabili d'ambiente.
2. **Lingue nel client**: il client riceve entrambe le lingue (italiano e inglese). Costo stimato: decine di KB di testo.
3. **Forme cosmetiche** (mantelli di Burmy, stagioni di Deerling, forme di Unown): non si tracciano.

## Alternative scartate

- Aspettare un database Turso prima di chiudere la fase 1: avrebbe fermato il gate per una verifica che appartiene comunque alla fase 3.
- Una build per lingua o caricamento a richiesta dei messaggi: meno byte nel client, ma più complessità per un guadagno trascurabile.
- Tracciare le forme cosmetiche: nessun requisito le richiede.

## Conseguenze

- Il rischio "Turso non funziona come previsto" resta aperto fino a P3-03; se emerge, si risolve lì (l'alternativa è il solo file locale, già garantita).
- Se il numero di messaggi cresce di molto, si rivaluta la decisione 2.
- Le forme cosmetiche si possono aggiungere in seguito con una colonna, come già previsto per le varietà.
