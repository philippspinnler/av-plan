# Jugend (JD/JM): Sonntagsklassen, Mittwochaktivitäten, Jugendseite

Design vom 2026-10-19. Ersetzt die Airtable-Base "JD / JM" (Interfaces "Sonntagsklassen" und "JD/JM Programm").

## Absicht

AVplan plant heute nur die Abendmahlsversammlung. Neu deckt es auch die Sonntagsklassen und die Mittwochaktivitäten der Jungen Damen (JD) und Jungen Männer (JM) ab, mit denselben Grundsätzen wie der Rest der App: eine Mitgliederliste als Quelle, Personenauswahl statt Freitext, Autosave, Live-Aktualisierung und Anwesenheit (siehe `CLAUDE.md`). Dazu kommt eine Übersichtsseite für die Jugendlichen ohne Login.

Warum jetzt: Die Airtable ist eine zweite Datenquelle mit eigenem Personen-Vokabular (Tags statt Mitglieder), ohne Rechte je Seite (JD/JM) und ohne Übersicht für die Jugendlichen.

## Ziele

- Berater/innen, JD-Leitung und Bischofschaft planen Sonntagsklassen und Mittwochaktivitäten in AVplan.
- Jugendliche sehen auf einer Seite ohne Passwort die nächsten Termine.
- Ideen für Aktivitäten lassen sich sammeln und beim Planen übernehmen.
- Ausfälle (Pfahl, Tempel, Ferien) sind sichtbar und müssen nicht pro Woche einzeln erfasst werden.

## Nicht-Ziele

- Keine Zeiten und Orte (Standardzeiten sind bekannt; Abweichungen stehen in "Details").
- Keine Anwesenheitserfassung der Jugendlichen, keine Statistik.
- Kein Zugriff auf die Jugendseite auf Erwachsenen-Anwesenheit, Leitungssitzungen oder Ideen.

## Anti-Ziele (das wäre ein Fehlschlag)

- JD- und JM-Verantwortliche können sich gegenseitig Inhalte überschreiben.
- Ein vergessener Eintrag sieht auf der Jugendseite aus wie "keine Aktivität".
- Jugendliche sehen Nachnamen oder Erwachsenen-Interna.
- Doppelpflege: Fällt die Abendmahlsversammlung aus (Generalkonferenz), muss die Klasse separat abgesagt werden.

## Rahmenbedingungen

- Bestehender Stack: SvelteKit, SQLite/Drizzle, ein Container. Migrationen per `npm run db:generate`.
- Live-Kanal und Autosave-Muster der Sonntagsseite (`src/routes/(app)/sonntag/[date]`) sind die Referenz; der Hook meldet jeden erfolgreichen POST bereits an alle offenen Browser.
- Nur Mitglieder (Tabelle `members`) können Jugendliche oder Berufungsträger sein.
- Keine echten Namen in Tests/Fixtures.

## Rollen und Rechte

Neue Rollen: `jm_berater` (JM-Berater), `jd_leitung` (JD-Beraterin und JD-Präsidentschaft; *mein Entscheid: eine Rolle, da identische Rechte – wer welches Amt hat, steht in den Berufungen*).

| Aktion | admin | bischofschaft | jm_berater | jd_leitung |
|---|---|---|---|---|
| `youth.view` – Jugendbereich sehen (alle Termine, beide Seiten, Ideen, Ausfälle) | ✓ | ✓ | ✓ | ✓ |
| `youth.jm` – JM-Teil bearbeiten | ✓ | ✓ | ✓ | – |
| `youth.jd` – JD-Teil bearbeiten | ✓ | – | – | ✓ |
| `youth.common` – Allgemeines eines Termins (Art, gemeinsam, Details, Thema/Link, Snack, Erwachsene), Ideen, Ausfälle | ✓ | ✓ | ✓ | ✓ |
| Berufungen/Jugendliche in den Einstellungen pflegen | ✓ (`settings.edit`) | – | – | – |

Ein Termin mit "gemeinsam" hat einen einzigen Inhaltsblock; den dürfen alle mit `youth.jm` oder `youth.jd` bearbeiten. Die bestehende Rollenumschaltung "Ansicht als" (Admin) gilt auch für die neuen Rollen.

## Einstellungen (nur Admin)

**Tab "Berufungen"** (ersetzt den Bischofschafts-Block auf "Allgemein"; Speicherung der Bischofschaft bleibt wie heute in `settings`):
- Bischof, 1. Ratgeber, 2. Ratgeber (bestehend)
- JM-Berater (mehrere), JD-Beraterin (mehrere), JD-Präsidentin, 1. Ratgeberin JD, 2. Ratgeberin JD
- Je Personenauswahl aus aktiven Gemeindemitgliedern.

**Tab "Jugendliche"**:
- Liste der Jugendlichen: Mitglied (Auswahl), Seite `jd`/`jm`, Gruppe (JM: `diakone`/`lehrer`/`priester`; JD: `hoffnung`/`glauben`/`licht`), entfernen.
- Ein Mitglied höchstens einmal.

Daraus speisen sich alle Dropdowns: Leitung/Gedanke JD → Jugendliche der Seite JD; JM entsprechend; "Erwachsene" → Bischofschaft + JM-Berater + JD-Beraterinnen + JD-Präsidentschaft.

## Datenmodell

```
youth              member_id (unique, FK members), side ('jd'|'jm'), group (text, s.o.)
youth_leaders      member_id (FK), role ('jm_berater'|'jd_beraterin'|'jd_praesidentin'|'jd_ratgeberin1'|'jd_ratgeberin2')
youth_events       id, date (unique, ISO), kind, joint (bool), details, topic, topic_url, snack, updated_at
youth_event_parts  event_id (FK), side ('jd'|'jm'|'both'), text, leader_member_id, leader_group, thought_member_id
                   (unique event_id+side; bei joint genau eine Zeile 'both', sonst je eine Zeile 'jd' und 'jm')
youth_event_adults event_id (FK), member_id (FK), present (bool)   -- An-/Abwesende Erwachsene
youth_ideas        id, text, side ('jd'|'jm'|'both'), note, created_by (FK users), created_at,
                   planned_event_id (FK youth_events, nullable), dismissed_at (nullable)
youth_breaks       id, from_date, to_date, label, kind ('ferien'|'pfahl'|'tempel')   -- Ferien, Pfahl- und Tempeltermine
settings           youth_page_token (zufällig, 24+ Zeichen)
```

**Termin-Arten (`kind`)** – Sonntag: `klasse`, `erwachsene` (Klasse zusammen mit den Erwachsenen, typisch am 5. Sonntag im Monat; kein JD/JM-Teil, auf der Jugendseite "Klasse mit den Erwachsenen"), `keine`. Die Planungsliste markiert fünfte Sonntage mit einem Hinweis, setzt die Art aber nicht automatisch. Mittwoch: `aktivitaet`, `basel` (gemeinsam mit Basel; impliziert joint), `fireside`, `uebertragung`, `pfahl`, `tempel`, `ferien`, `keine`. Ausfall = `pfahl`, `tempel`, `ferien`, `keine`; `details` trägt die Begründung ("Mini-MTC ab Jg 12", "Schulferien BL/AG").

**Felder je Seite** – Mittwoch: `text` (Aktivität), `leader_member_id` (Jugendliche/r), `thought_member_id`. Sonntag: `leader_group` (Gruppe, die leitet – fest: JM `diakone|lehrer|priester|leitung`, JD `hoffnung|glauben|licht|leitung`), `thought_member_id`; `text` ungenutzt. `topic` + `topic_url` nur am Sonntag; `snack` nur am Mittwoch (gilt für alle Jugendlichen).

**Sonntag und Abendmahlsversammlung:** Die Klasse hängt am bestehenden Sonntag (`meetings`, Verknüpfung über das Datum). `classHeld(meeting.kind)` ist falsch für `generalkonferenz`, `pfahlkonferenz`, `keine`, `ostern` und `weihnachten` (keine zweite Stunde) – dann findet keine Klasse statt und der Termin wird überall als Ausfall mit `KIND_LABELS[meeting.kind]` angezeigt, ohne eigenen Eintrag. Fehlt der `meetings`-Eintrag, gilt der Sonntag als mit Klasse. Sonst hat der Sonntag eine Klasse, ausser `youth_events.kind = 'keine'`. Zeiträume (`youth_breaks`) wirken **nie** auf Sonntage.

**Ausfälle aus Zeiträumen (nur Mittwoch):** Liegt ein Mittwoch in einem `youth_breaks`-Zeitraum und ist sein Eintrag noch "offen" (Standard-Art, kein Inhalt in einem Teil), gilt er als Ausfall mit dem Label des Zeitraums. Sobald jemand Inhalt einträgt oder die Art ändert, findet er trotz Zeitraum statt; die Terminseite zeigt die JD/JM-Felder deshalb auch innerhalb eines Zeitraums (mit Hinweis "liegt in: Herbstferien").

**Termine an anderen Wochentagen** (Pfahl-Jugendtagung Fr–So, Tempeltaufen am Samstag) sind keine `youth_events`, sondern Einträge in `youth_breaks` mit Art `pfahl`/`tempel` und Text (z.B. "Tempeltaufen, 9:30 Session, Treffpunkt 9:00"). Sie erscheinen auf der Jugendseite als eigene Zeile im Fenster der fünf Termine. Eigene Gemeinde-Aktivitäten an anderen Tagen als Mittwoch gibt es nicht. *Mein Entscheid.*

**Lücke:** Ein Termin ohne Eintrag ausserhalb von Zeiträumen ist "offen" – in der Planungsliste rot markiert, auf der Jugendseite als "noch nicht geplant" gezeigt, nie als "keine Aktivität".

**Termine anlegen:** Wie `ensureSundays` für die AV legt `ensureYouthEvents` beim Öffnen der Planungsliste die Sonntage und Mittwoche der nächsten 6 Monate an (Sonntag: `klasse`, Mittwoch: `aktivitaet`, ohne Inhalte → "offen"). Einträge gelten als "offen", solange kein Teil Inhalt hat.

## Import aus der Airtable

Einmaliges Script `scripts/import-youth.ts` (`npm run import:jugend -- import/aktivitaeten.csv import/klassen.csv`), analog zu `scripts/import-sheets.ts`; die CSVs exportiert der Admin aus der Airtable (Tabellen "JD/JM Programm" und "Sonntagsklassen", Grid-Ansicht → Download CSV) in den gitignorierten Ordner `import/`. Voraussetzung: Jugendliche und Berufungen sind in den Einstellungen erfasst, denn die Airtable kennt nur Vornamen.

Abbildung: `Datum` → Termin (angelegt, falls fehlend); `Art der Aktivität` → `kind`/`joint` (Aktivitäten Pratteln JD AP → `aktivitaet`; JD/AP Pratteln gemeinsam → `aktivitaet` + joint; Gemeinsam mit Basel → `basel`; Pfahl-Aktivität → `pfahl`; Tempel Taufen → `tempel`; Fireside → `fireside`; Übertragung → `uebertragung`; Keine Aktivität → `ferien`, falls Details "Ferien" enthält, sonst `keine`); `Details`, `Thema`, `Snack` → gleichnamig; `Aktivität JD/JM` → `text` je Seite; `Leitung JD/JM` → `leader_member_id` (Vorname unter den Jugendlichen der Seite) bzw. am Sonntag `leader_group` (Priester Kollegium → `priester` usw.); `Geistiger Gedanke / Klasse` ("JD: Mia", "JM: Urs") → `thought_member_id` je Seite; `Anwesende/Abwesende Erw.` → `youth_event_adults` (Vorname unter Bischofschaft/Berufungen). Pfahl-/Tempeleinträge an anderen Wochentagen als Mittwoch → `youth_breaks`. Nicht auflösbare Vornamen werden als Hinweis ausgegeben; die von Jugendlichen werden zusätzlich in `details` angehängt ("Leitung JM: Reto"), damit nichts verloren geht. Nicht auflösbare Erwachsene erscheinen nur als Hinweis, nie in `details` (das als öffentliche Ausfallbegründung erscheinen kann). Wiederholter Import überschreibt vorhandene Termine desselben Datums.

## Seiten

**Navigation:** Neuer Eintrag "Jugend" im Hauptmenü für Rollen mit `youth.view`.

**`/jugend` – Planungsliste:** Zeilen für Sonntage und Mittwoche ab heute (Vergangenheit per Jahr-Umschalter wie bei der AV-Liste), Spalten: Datum/Wochentag, Art, JD (Kurztext + Leitung oder "offen"), JM, Snack, Hinweis bei Ausfall. Klick → Terminseite.

**`/jugend/[date]` – Terminseite** (Muster: Sonntagsseite, Autosave, Versionsprüfung je Abschnitt, Live):
- Abschnitt *Allgemein*: Art, "gemeinsam" (Schalter), Details, Sonntag: Thema + Link; Mittwoch: Snack. Bearbeitbar mit `youth.common`.
- Abschnitt *JD* und *JM* (oder *Gemeinsam*): Mittwoch: Aktivität (Text), Leitung (Jugendliche/r der Seite), Geistiger Gedanke (Jugendliche/r der Seite). Sonntag: Leitung (Gruppe), Geistiger Gedanke. Ohne Recht nur lesbar.
- Abschnitt *Erwachsene*: je Person aus der Berufungsliste: anwesend / abwesend / – (kein Eintrag).
- Beim Umschalten auf "gemeinsam" werden die Texte von JD und JM zu einem Block zusammengeführt (JD-Text, dann JM-Text, falls beide vorhanden); zurück kopiert den gemeinsamen Text in beide Seiten. Leitung/Gedanke beim Zusammenführen: JD-Werte übernommen, JM-Werte verworfen – sie sind auf der Jugendseite sichtbar und werden korrigiert.
- Bei Ausfall-Arten werden JD/JM/Erwachsene ausgeblendet.
- *Ideen-Vorschläge:* Neben dem Feld "Aktivität" eine Liste der offenen Ideen für diese Seite bzw. "beide"; Klick übernimmt den Text ins Feld und setzt `planned_event_id`.

**`/jugend/ideen`:** Liste offener Ideen (Text, Seite, Notiz, von wem, seit wann), neue Idee erfassen, verwerfen; geplante Ideen mit Datum in einem eingeklappten Bereich. Alle mit `youth.common`.

**`/jugend/ausfaelle`:** Zeiträume und Termine (von–bis, Text, Art Ferien/Pfahl/Tempel) anlegen und löschen. Alle mit `youth.common`.

**`/j/[token]` – Jugendseite (ohne Login):**
- Erreichbar nur mit gültigem `youth_page_token`; falscher Token → 404. Pfad `/j/` ist in `hooks.server.ts` öffentlich. Keine Links zurück in die App. `Cache-Control: no-store`, `robots: noindex`.
- Inhalt: Gemeindename, dann die **zwei nächsten Termine (heute eingeschlossen) in zeitlicher Reihenfolge gross**, danach **drei weitere kompakt** (eine Zeile je Termin). Die fünf Termine sind Sonntage und Mittwoche; Pfahl-/Tempeltermine aus `youth_breaks`, die in dieses Zeitfenster fallen, werden zusätzlich als kompakte Zeile eingeschoben (Ferien nicht).
- Die Jugendseite leitet ihre Daten aus dem Kalender ab (nächste Sonntage/Mittwoche), nicht aus vorhandenen `youth_events`-Zeilen; fehlende Zeilen gelten als "offen".
- Gross: Wochentag + Datum, Art als Badge (Aktivität / Klasse / Gemeinsam / Kein JD/JM), Mittwoch: JD- und JM-Block nebeneinander (Aktivität, Leitung, Gedanke) bzw. ein Block bei gemeinsam, Snack; Sonntag: Thema (als Link, falls `topic_url` gesetzt), je Seite Leitung (Gruppe) und Gedanke. Ausfall: nur Begründung. Offen: "noch nicht geplant".
- Kompakt: "Mi 4. Nov. · Gemeinsam · Kart fahren · Leitung: Reto" bzw. "So 1. Nov. · Klasse · FSJ Kap. 11 · Gedanke: Mia / Reto".
- **Nur Vornamen** der Jugendlichen; keine Erwachsenen, keine Leitungssitzung, keine Zeiten.
- Handy-Layout zuerst; Mockup: `.superpowers/brainstorm/*/content/jugendseite-v2.html` (Variante C).
- Admin: in "Einstellungen → Allgemein" den Link anzeigen/kopieren und neu erzeugen (alter Link wird ungültig).

## Was bereits entschieden ist (vom Nutzer)

- Admin alles; Bischofschaft nur JM. Berater/innen und Präsidentschaft nur ihre Seite; "gemeinsam" beide.
- Jugendliche und Berufungen als eigene Einstellungs-Tabs, nicht in der Mitgliederliste; Quelle ist die Mitgliederliste.
- Gruppen/Kollegien an den Jugendlichen; am Sonntag "Leitung" = Gruppe (nicht Person).
- Ferien gelten nur für Mittwoche; der Sonntag folgt der Abendmahlsversammlung (Generalkonferenz, Pfahlkonferenz, Ostern, Sonntag vor Weihnachten: keine Klasse).
- Snack am Mittwoch gilt für alle; keine Zeiten; ein Thema pro Sonntag mit Link; Jugendseite Variante C; nur Vornamen.
- Ideen-Topf, Ausfälle wegen Pfahl/Tempel/Ferien.
- Am 5. Sonntag kann die Klasse zugunsten einer Klasse mit den Erwachsenen entfallen (Art `erwachsene`).
- Import der Airtable-Daten per Script.

## Meine Entscheide (vom Nutzer nicht bestätigt, im Design markiert)

- Eine Rolle `jd_leitung` statt zwei.
- Snack und (in der App) volle Namen bleiben; Jugendseite Vornamen.
- Klasse hängt am AV-Sonntag; Ausfall folgt der AV.
- Zeiträume wirken nur auf Mittwoche; ein Mittwoch mit Inhalt findet trotz Zeitraum statt; Lücken sichtbar statt stumm.
- Pfahl-/Tempeltermine an anderen Wochentagen nur als Zeile auf der Jugendseite, nicht als planbare Termine.
- Bei gleichem Vornamen zweier Jugendlicher zeigt die Jugendseite den Nachnamen-Anfangsbuchstaben ("Mia K.").
- Erwachsene je Termin als Drei-Zustand (anwesend/abwesend/–) statt zwei Freitext-Listen.
- Termine sechs Monate im Voraus automatisch angelegt.

## Dem Entwickler überlassen

- Exakte Formulierungen und Reihenfolge der Felder; Badges/Farben im Stil der bestehenden Seiten.
- Wie die Versionsprüfung je Abschnitt geschnitten wird (Vorschlag: `common`, `jd`, `jm`, `adults`).
- Token-Erzeugung (z.B. `crypto.randomBytes(18).toString('base64url')`).
- Tests nach bestehendem Muster (Modul-Tests mit In-Memory-DB; Rechte-Matrix; Jugendseite-Auswahl der fünf Termine inkl. Ausfall- und Lückenlogik).
