# Changelog

Tutte le modifiche rilevanti del progetto sono registrate in questo file.

Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e il progetto usa il [Semantic Versioning](https://semver.org/lang/it/). Ogni rilascio ha un tag Git `vX.Y.Z`, creato dal product owner, e un'immagine Docker con lo stesso tag.

## [Non rilasciato]

### Aggiunto

- Documentazione di progetto in `docs/`: requisiti, piano, MVP e rilasci, regole di lavoro, linee guida, modello dati in bozza, rischi e fonti, configurazione di GitHub, mappa degli artefatti, backlog, design system, mockup e fonti.
- Registro delle decisioni in `docs/adr/`: l'ADR 0001 con le prime 26 decisioni e le ADR 0002–0005.
- File di base del repository: `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `.gitignore`, modello di pull request, `CODEOWNERS` e hook `pre-push` che blocca i push su `main` e `develop`.
- Decisioni di P1-19 (rete instabile, giochi e impostazioni della run, fonti dei dati) nelle ADR 0002–0005 e nella specifica; dati di gioco con stanze interne, specie aggiuntive, grotte nascoste e livelli facili.
- Git flow con `main` e `develop` e controllo dei branch delle pull request con GitHub Actions (`branch-policy`).
