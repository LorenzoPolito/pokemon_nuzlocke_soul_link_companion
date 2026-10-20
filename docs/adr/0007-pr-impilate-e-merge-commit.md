# ADR 0007 – PR impilate e merge commit

- **Stato**: Accettata
- **Data**: 19 ottobre 2026
- **Decide**: product owner
- **PBI collegati**: P3-12

## Contesto

L'unione delle prime sette PR (#1–#7) ha mostrato che lo squash merge e le PR impilate non vanno d'accordo. Lo squash crea su `develop` un commit nuovo che non è antenato dei branch impilati sopra, e per i file che le PR successive modificano ancora (registro sessioni, backlog, mappa, documento di analisi) Git vede due versioni diverse senza una base comune, cioè un conflitto "add/add", ripetuto a ogni PR. Il product owner ha scelto di non fermare il lavoro tra una PR e l'altra.

## Decisione

1. L'agente può **impilare** le PR: ogni PR parte dal branch della precedente, finché non vengono unite, e lo dichiara nella descrizione.
2. Le PR di una serie impilata si uniscono **in ordine** con **Create a merge commit**, non con squash.
3. Una PR che parte da `develop` aggiornato, senza nessuna PR aperta sotto, si unisce con squash, come da regole di lavoro.
4. Prima di ogni unione l'agente verifica che la PR sia unibile senza conflitti; se `develop` è cambiato con uno squash, aggiorna il branch con `develop` tenendo la versione della PR.

## Alternative scartate

- Una PR alla volta con squash: nessun conflitto e storia pulita, ma l'agente si fermerebbe a ogni PR finché non viene unita.
- L'agente unisce da sé con squash: non consentito dalle regole attuali ([ADR 0001, decisione 24](0001-decisioni-di-progetto.md#24-lagente-può-approvare-le-proprie-pull-request)).

## Conseguenze

- Nella storia di `develop` ci sono i merge commit delle serie impilate, oltre ai commit di squash delle PR singole. È un compromesso accettato.
- Se per errore una PR di una serie viene unita con squash, la successiva va aggiornata con `develop`: l'agente lo fa quando il product owner lo avvisa.
- Si valuta di tornare allo squash per tutto se all'agente verrà concesso di unire le PR (le sequenzierebbe una alla volta).
