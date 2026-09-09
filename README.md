# AVplan

Planung der Abendmahlsversammlung: Programm, Sprecher, Gebete, Lieder und Leitungszettel. SvelteKit, SQLite, ein Container.

## Rollen

| Rolle | darf |
|---|---|
| Admin | alles, inkl. Benutzer, Mitglieder, Einstellungen |
| Bischofschaft | Sonntage planen, Seite "Fragen", Musik |
| Gebete | Anfangs- und Schlussgebet eintragen, "Fragen" für Gebete |
| Musik | Lieder, Orgel/Klavier, Dirigieren, Liederbuch |
| Dirigent/in | nur Dirigieren |

## Betrieb

```bash
cp .env.example .env     # ORIGIN = öffentliche Adresse, sonst schlagen Formulare fehl
docker compose up -d     # zieht philippspinnler/av-plan:latest
```

Beim ersten Aufruf wird unter `/setup` das Admin-Konto angelegt. Weitere Personen lädt der Admin unter Einstellungen → Benutzer per Link ein. Das eigene Passwort ändert jede Person über ihren Namen oben rechts (Konto). Passwörter werden mit Argon2 gehasht gespeichert.

Die Datenbank liegt in `./data/app.db`. Backup über Einstellungen → Allgemein → "Datenbank herunterladen".

## Import aus den bisherigen Sheets

Beide Google Sheets als `.xlsx` exportieren und bei gestopptem Container auf dem Host importieren:

```bash
docker compose stop
npm install
DATABASE_PATH=data/app.db npm run import -- import/av-programm.xlsx import/liederplanung.xlsx
docker compose up -d
```

## Entwicklung

```bash
npm install
npm run dev          # http://localhost:5173
npm test
npm run check
npm run db:generate  # Migration nach Schema-Änderung
```

Umgebungsvariablen: `DATABASE_PATH` (Standard `data/app.db`), `ORIGIN`, `PORT`.

## Docker-Image

Jeder Push auf `main` baut das Image und veröffentlicht es als `philippspinnler/av-plan:latest` auf Docker Hub (GitHub Actions, Secrets `DOCKERHUB_USERNAME` und `DOCKERHUB_TOKEN`).
