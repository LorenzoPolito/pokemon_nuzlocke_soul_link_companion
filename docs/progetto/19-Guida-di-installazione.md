# Nuzlocke SoulLink Companion – Guida di installazione

Guida per chi installa l'app su un proprio server. Si completa con i PBI P3-08 (admin), P3-13 (HTTP e reverse proxy), P7-05 e P7-06 (installazione completa, backup e ripristino). Questa versione copre l'immagine e il volume dei dati (P3-02).

## Requisiti

- Docker (o un runtime compatibile) su un server Linux.
- Una porta libera (di base la 3000) e uno spazio per il volume dei dati.

## Costruire e avviare

L'immagine si costruisce dal repository; non è ancora pubblicata su un registro.

```sh
docker build -t nuzlocke-soullink-companion .
docker volume create nuzlocke-data
docker run -d --name nuzlocke \
  -p 3000:3000 \
  -v nuzlocke-data:/data \
  nuzlocke-soullink-companion
```

L'app risponde in HTTP su `http://<server>:3000`. Le variabili d'ambiente (admin, database remoto, indirizzo pubblico) si aggiungono con i PBI successivi e saranno elencate qui.

## Il volume dei dati

I dati degli utenti (il database) stanno in `/data` dentro il container. **Senza un volume, ricreando il container i dati si perdono.**

- **Volume nominato** (consigliato, come nell'esempio): al primo uso eredita il proprietario della cartella `/data` dell'immagine, che è l'utente non root del container. Non serve fare altro.
- **Cartella del server montata a mano** (`-v /srv/nuzlocke:/data`): la cartella deve essere scrivibile dall'utente `node` del container, che ha l'identificativo 1000. Prima di avviare: `sudo chown 1000:1000 /srv/nuzlocke`. Se la cartella appartiene a un altro utente, il database non si apre e l'app lo dice nel log all'avvio.

Il backup e il ripristino del volume sono descritti nella guida completa (P7-06).

## Controllo dello stato

L'immagine ha un controllo di salute: ogni 30 secondi chiede `/api/health` all'app e il container risulta `healthy` quando risponde. Per vederlo:

```sh
docker inspect --format '{{.State.Health.Status}}' nuzlocke
```

Il controllo parte 10 secondi dopo l'avvio e dopo tre fallimenti consecutivi il container risulta `unhealthy`.

## Cosa contiene l'immagine

- Basata su `node:22-alpine`, costruita in due stadi: lo stadio finale ha solo il risultato della build e le dipendenze di produzione, senza strumenti di build.
- Gira con l'utente `node` (non root).
- Dimensione misurata il 22 ottobre 2026: 241 MB con il solo scheletro dell'app; crescerà con il Pokédex e le dipendenze ([prove](14-Prove-di-fattibilita.md#p1-17-prova-immagine-docker-multi-stage)).
