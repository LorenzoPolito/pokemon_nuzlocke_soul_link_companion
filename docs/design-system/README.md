# SoulLink Companion

Il companion per le run Nuzlocke Soul Link: leggero come un'app di sistema, chiaro a colpo d'occhio, sempre al servizio della partita che si sta giocando. Lo stile segue i principi di Material Design 3 e delle Human Interface Guidelines di Apple: superfici calme, un solo colore d'azione, gerarchia data da dimensione e peso del testo, non da decorazioni.

## Principi

- **La partita al centro.** Ogni schermata risponde a una domanda di chi sta giocando: cosa ho catturato qui, chi è collegato a chi, cosa rischio in questa lotta. Tutto il resto sta a un tocco di distanza.
- **Informare, non decidere.** L'aiuto per le lotte mostra dati completi e neutri. Nessun colore, ordine o badge indica la "mossa migliore".
- **Il legame si vede sempre.** Il collegamento Soul Link ha un colore riservato (`link`) e un'icona propria, e compare ovunque compaia un Pokémon collegato.
- **Una run, un gioco.** L'intestazione di una run prende il colore del suo gioco (`run-accent`), così si capisce subito in quale partita si è.
- **Leggero.** Font di sistema, icone come font, nessuna immagine decorativa: le uniche immagini sono gli sprite.

## Tono dei testi

Frasi brevi, seconda persona, verbi d'azione: "Registra incontro", "Sposta in box", "Segna come morto". I nomi di Pokémon, mosse, abilità e aree seguono la lingua scelta. Le regole violate si spiegano in una riga: "Area già usata: Pidgey di Marco è già stato catturato qui." Niente punti esclamativi, niente emoji nell'interfaccia.

## Colori

- Superfici: `surface` per lo sfondo, `surface-container` per barre e intestazioni, `surface-raised` per card e righe. Testo sempre `ink` o `ink-muted`.
- Azione: `primary` per il pulsante principale e l'elemento attivo; `primary-container` per chip selezionati e indicatore della navigazione.
- Soul Link: `link` e `link-container` solo per il legame tra partner.
- Stati dei Pokémon: `status-alive`, `status-boxed`, `status-dead`, sempre accompagnati da icona ed etichetta, mai solo colore.
- Efficacia: scala arancio/blu `eff-4`, `eff-2`, `eff-1`, `eff-half`, `eff-quarter`, `eff-0`, scritta sempre come numero (×2, ×½). Arancio e blu si distinguono anche per lightness, quindi reggono il daltonismo rosso/verde.
- Tipi: `type-*`, usati solo come sfondo dei chip di tipo con testo bianco (contrasto ≥ 4,5:1 in entrambi i temi).

### Colore della run

`run-accent` vale `primary` finché non si apre una run. Dentro una run l'app lo sostituisce con il colore associato al gioco (definito nei dati di gioco, P1-07), generando la sua palette tonale come in Material You e verificando il contrasto ≥ 4,5:1 contro `surface` in entrambi i temi; se fallisce si usa `primary`. Si applica solo a intestazione della run, indicatore della tab attiva e avatar della run: mai a testo corrente o stati.

## Tipografia

Una sola famiglia, quella di sistema (`sans`): Roboto su Android, SF Pro su Apple, Segoe UI su Windows. Nessun font da scaricare. Sette stili: `display`, `title-l`, `title-m`, `body`, `body-s`, `label`, `caption`. Le statistiche usano cifre tabulari (`font-variant-numeric: tabular-nums`).

## Spazi, forme, movimento

- Griglia da 4 px: `space-1` … `space-8`. Margini di schermata `space-4` su telefono, `space-8` da 840 px in su.
- Forme morbide: `radius-sm` per chip, `radius-md` per campi e pulsanti, `radius-lg` per card e sheet, `radius-full` per pill e pulsante flottante.
- Niente ombre forti: le card si staccano per colore di superficie. Movimento tra 150 e 250 ms, rispettando "riduci movimento" del sistema.

## Navigazione e layout

- Telefono (< 600 px): barra di navigazione in basso con tre voci, Run, Pokédex, Profilo; dentro una run, tab in alto: Aree, Team, Lotta, Cimitero, Diario.
- Tablet e desktop: rail di navigazione a sinistra e due colonne (lista e dettaglio).
- Bersagli tattili di almeno 48 × 48 px. Azioni distruttive (segna come morto) chiedono conferma in un bottom sheet.

## Iconografia

Material Symbols Rounded, peso 400, 24 px, caricati come font solo con i glifi usati. Icone chiave: `link` (Soul Link), `inventory_2` (box), `favorite` (vivo), `skull` (morto), `swords` (lotta), `military_tech` (medaglie), `menu_book` (Pokédex). Gli sprite Pokémon vengono da PokéAPI, a 96 px con `image-rendering: pixelated` e un'immagine di riserva neutra.

## Accessibilità

Contrasto ≥ 4,5:1 per il testo in entrambi i temi, 3:1 per bordi di controlli e icone. Ogni stato ha icona ed etichetta. Tutto raggiungibile da tastiera e lettore di schermo; i chip di tipo hanno il nome del tipo come testo, non solo il colore.
