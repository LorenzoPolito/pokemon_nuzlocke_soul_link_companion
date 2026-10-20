# Nuzlocke SoulLink Companion – Prove di fattibilità dello stack

Documento di output di P1-11…P1-17. Ogni prova ha una sezione, aggiunta quando il PBI si chiude. Le prove girano fuori dal repository (cartella di lavoro dell'agente) e qui restano il metodo, le misure e l'esito; il codice di produzione nasce in fase 3.

## P1-11 Prova: @smogon/calc con override

Data: 20 ottobre 2026. Taglia S. Esito: **fattibile**.

### Metodo

`@smogon/calc` 0.12.0 (MIT) installato con `npm i --ignore-scripts` in una cartella vuota, con Node 22. La prova costruisce Pokémon e mosse con le opzioni `overrides` e confronta il danno con e senza override, nelle generazioni 3, 5 e 8.

- Pokémon: `new Pokemon(gen, 'Snorlax', { level: 50, overrides: { types: [...], baseStats: { hp, atk, def, spa, spd, spe } } })`. Le chiavi delle statistiche sono `hp, atk, def, spa, spd, spe`: con le chiavi sbagliate (`at`, `df`, …) l'override viene ignorato senza errore.
- Mosse: `new Move(gen, 'Surf', { overrides: { type: 'Ice' } })`.

### Esiti

| Prova | Generazione | Senza override | Con override |
| --- | --- | --- | --- |
| Surf di Vaporeon su Snorlax; Snorlax diventa tipo Fuoco | 3 | 54–64 | 108–128 |
| come sopra | 5 | 54–64 | 108–128 |
| come sopra | 8 | 51–61 | 102–122 |
| Snorlax con PS base 200 e Dif. Sp. base 250 (PS reali 275, Dif. Sp. 270) | 3 | 54–64 | 28–33 |
| come sopra | 5 | 54–64 | 27–33 |
| come sopra | 8 | 51–61 | 25–31 |
| Surf con tipo cambiato in Ghiaccio su Dragonite | 5 | 29–35 | 156–188 |

I danni cambiano nella direzione attesa (Acqua contro Fuoco è superefficace; più difese, meno danno; Ghiaccio contro Drago/Volante è ×4).

### Verifica delle abilità (P1-09)

Danno di Surf o Tuono su un Pokémon con l'abilità, attaccante con Pressione (altrimenti l'abilità dell'attaccante, per esempio Teravolt di Zekrom, ignora quella del bersaglio):

| Abilità | Gen. 3 | Gen. 4 | Gen. 5 | Gen. 8 |
| --- | --- | --- | --- | --- |
| Parafulmine contro Tuono | 119–140 | 116–140 | 0 | 0 |
| Acquascolo contro Surf | 22–26 | 21–26 | 0 | 0 |

Confermato: **Parafulmine e Acquascolo danno immunità dalla quinta generazione**, prima attirano soltanto. Raccolto e Levitazione danno 0 già in gen. 5. Una trappola da ricordare nei test: se l'attaccante ha Rompiforma, Teravolt o Turbofiamma, le abilità difensive non agiscono.

### Dimensione

Pacchetto npm: 4,4 MB su disco (comprende sorgenti, dist e bundle). Bundle `esbuild --bundle --minify` dell'API completa (`calculate`, `Generations`, `Pokemon`, `Move`): 504 KB, **117 KB compressi con gzip**. Se il calcolo gira sul server, la dimensione non pesa sul client; se gira nel browser è accettabile ma non trascurabile: con tree-shaking limitato alle generazioni usate dall'MVP (solo la 5) sarebbe più piccolo, da misurare in fase 5 se serve.

### Decisioni prese

- Gli override di tipo e statistiche di `@smogon/calc` bastano per rappresentare le regole della run (tipi e statistiche modificati): nessuna alternativa da valutare.
- Il modulo `battle` converte i dati di PokéAPI nelle `overrides` con le chiavi `hp, atk, def, spa, spd, spe`; un test di unità verifica che un override cambi davvero il risultato, perché le chiavi sbagliate non danno errore.
- Nei test sulle abilità difensive l'attaccante ha un'abilità neutra.

### Domande aperte

Nessuna. Dove gira il calcolo (server o browser) si decide in fase 2 con l'architettura.
