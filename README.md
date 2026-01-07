# IPA Terre di Asolo e Monte Grappa

Sito statico demo per il progetto territoriale IPA Terre di Asolo e Monte Grappa.

## Struttura

- `index.html`: home con hero fotografico, progetto, card e news.
- `territorio.html`: racconto del territorio con sezioni narrative e card tematiche.
- `mappa.html`: mappa Leaflet con filtri, ricerca e lista POI.
- `news.html`: news con filtri statici e card con immagini.
- `contatti.html`: contatti e form demo.
- `styles.css`: stile principale e layout responsive.
- `app.js`: logica mappa e form.
- `data/pois.sample.json`: dataset POI di esempio.
- `images/`: logo e placeholder SVG locali per hero e card (sostituibili con foto).

## Avvio

1. Apri una shell nella cartella del progetto.
2. Avvia il server:

```bash
python -m http.server 8000
```

3. Apri il browser su `http://localhost:8000`.

## Checklist test

- La home (`index.html`) mostra hero full screen, progetto, card e ultime news.
- `territorio.html` contiene sezioni narrative e card tematiche.
- `mappa.html` carica la mappa, i filtri, la ricerca e la lista POI.
- Pulsanti mappa: Mostra tutto e Centra area funzionano.
- Popup mappa coerenti con lo stile.
- `news.html` mostra i filtri statici e 6 card.
- `contatti.html` valida il form senza invio reale.
- Verifica responsive riducendo la finestra.

## Note

Le immagini in `images/` sono placeholder SVG locali. Sostituiscile con foto del territorio mantenendo gli stessi nomi file.
