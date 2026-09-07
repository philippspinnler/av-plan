# Abendmahlsversammlung-Tool

Webapp zur Planung der Abendmahlsversammlung (Programm, Sprecher, Gebete, Lieder, Leitungszettel). Ersetzt die Google Sheets "AV Programm" und "Liederplanung AV".

## Rollen

| Rolle | darf |
|---|---|
| Admin | alles, inkl. Benutzer einladen, Personen pflegen, Einstellungen |
| Bischofschaft | Sonntage planen (Leitung, Gebete, Ansprachen, Bekanntmachungen, Berufungen), Personen anlegen; sieht Musik |
| Musik | Lieder pro Sonntag, Orgel, Dirigieren, Liederbuch; sieht das Programm |

## Betrieb mit Docker

```bash
cp .env.example .env    # ORIGIN anpassen
docker compose up -d --build
```

Beim ersten Aufruf leitet die App auf `/setup`, wo das Admin-Konto angelegt wird. Danach lädt der Admin unter "Benutzer" weitere Personen ein: Die App erzeugt einen Link plus fertigen Text zum Kopieren (kein Mailserver nötig). Einladungslinks gelten 7 Tage.

Die Datenbank liegt in `./data/app.db`. Backup: unter "Benutzer" oder "Einstellungen" die Datenbank herunterladen (konsistenter Snapshot). Die Datei `data/app.db` direkt kopieren nur, wenn der Container gestoppt ist, sonst können Änderungen aus der WAL-Datei fehlen.

## Import der bisherigen Sheets

Beide Google Sheets als `.xlsx` exportieren (Datei → Herunterladen → Microsoft Excel).

Das Laufzeit-Image enthält kein `scripts/`, `src/` und kein `tsx`, daher läuft der Import lokal auf dem Host gegen dieselbe Datenbankdatei, bei gestopptem Container:

```bash
docker compose stop
npm install    # einmalig
DATABASE_PATH=data/app.db npm run import -- import/av-programm.xlsx import/liederplanung.xlsx
docker compose up -d
```

Der Import ist wiederholbar. Am Ende listet er Personen, die nur in Programmzeilen vorkamen; diese sind inaktiv angelegt und können unter "Personen" aktiviert werden.

## Entwicklung

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest
npm run check        # svelte-check
npm run db:generate  # Migration nach Schema-Änderung erzeugen
```

Umgebungsvariablen: `DATABASE_PATH` (Standard `data/app.db`), `ORIGIN`, `PORT`.
