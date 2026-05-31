# TASKS.md — Aufgabenbrett

Bevor du eine Aufgabe startest: trage deinen Namen und Status `in Arbeit` ein und
committe das zuerst. Status-Werte: `offen`, `in Arbeit`, `fertig`, `blockiert`.

Schema-Aenderungswuensche an Claude Code bitte unten unter "Schema-Anfragen" eintragen.

---

## Phase 0 — Fundament (Gate: Natascha)

| ID  | Aufgabe                                            | Owner       | Status |
|-----|----------------------------------------------------|-------------|--------|
| 0.1 | Monorepo scaffolden (pnpm, TS, Vitest)             | Claude Code | in Arbeit |
| 0.2 | Zod-Schema: meta, quelltexte, 6 Blocktypen         | Claude Code | in Arbeit |
| 0.3 | TS-Typen exportieren, in allen Modulen importierbar| Claude Code | in Arbeit |
| 0.4 | Beispiel-JSON pro Blocktyp als Fixture             | OpenCode #3 | offen  |

## Phase 1 — Renderer (Gate: Natascha, kritisch)

| ID  | Aufgabe                                            | Owner       | Status |
|-----|----------------------------------------------------|-------------|--------|
| 1.1 | Renderer-Grundgeruest, Hausstil verdrahten         | Claude Code | offen  |
| 1.2 | Schuelerfassung: Loesungsfelder leer                | Claude Code | offen  |
| 1.3 | Loesungsfassung: Loesungen kursiv, eingerueckt       | Claude Code | offen  |
| 1.4 | Linien fuer Luecken und Schreibflaechen (>=9mm)     | Claude Code | offen  |
| 1.5 | Kopf-/Fusszeile, kein Aufgaben-Umbruch              | Claude Code | offen  |
| 1.6 | Integrationstest: Fixture -> 2 gueltige .docx        | OpenCode #3 | offen  |

## Phase 2 — Ein LLM end-to-end (Gate: Natascha)

| ID  | Aufgabe                                            | Owner       | Status |
|-----|----------------------------------------------------|-------------|--------|
| 2.1 | Anbieter-Schnittstelle + Claude-Adapter            | OpenCode #1 | offen  |
| 2.2 | JSON erzwingen + Zod-Validierung der Antwort       | OpenCode #1 | offen  |
| 2.3 | Prompt-Bau aus Bloecken + Quelltext                | OpenCode #1 | offen  |
| 2.4 | txt-Parser fuer ersten echten Quelltext             | Kimi Code   | offen  |
| 2.5 | End-to-end-Test: Quelltext -> 2 .docx                | OpenCode #3 | offen  |

## Phase 3 — Input-Flexibilitaet (Gate: optional)

| ID  | Aufgabe                                            | Owner       | Status |
|-----|----------------------------------------------------|-------------|--------|
| 3.1 | docx- und pdf-Parser                                | Kimi Code   | offen  |
| 3.2 | html-Upload zu sauberem Text                       | Kimi Code   | offen  |
| 3.3 | url-Abruf mit Block-/Login-Fehlerbehandlung        | Kimi Code   | offen  |
| 3.4 | Quelltext-Aufbereitung (kuerzen auf Lesetempo)     | Kimi Code   | offen  |

## Phase 4 — Baukasten-UI + Vorschau (Gate: Natascha, kritisch)

| ID  | Aufgabe                                            | Owner       | Status |
|-----|----------------------------------------------------|-------------|--------|
| 4.1 | Vier-Schritte-Flow nach Mockup                     | OpenCode #2 | offen  |
| 4.2 | Baukasten: Drag and Drop, Punkte, Gesamtpunkte     | OpenCode #2 | offen  |
| 4.3 | Block-Konfigurationspanel pro Blocktyp             | OpenCode #2 | offen  |
| 4.4 | Stufenabhaengige Optionen deaktivieren             | OpenCode #2 | offen  |
| 4.5 | Zweispaltige editierbare Vorschau vor Export       | OpenCode #2 | offen  |
| 4.6 | Vorlagen speichern und laden                       | OpenCode #2 | offen  |

## Phase 5 — Ausbau (Gate: Natascha, final)

| ID  | Aufgabe                                            | Owner       | Status |
|-----|----------------------------------------------------|-------------|--------|
| 5.1 | ChatGPT-Adapter                                    | OpenCode #1 | offen  |
| 5.2 | Kimi-Adapter (mit Datenschutz-Schranke)            | OpenCode #1 | offen  |
| 5.3 | Drive-Anbindung, private Bibliothek                | Kimi Code   | offen  |
| 5.4 | Sprach-/Tippbefehl zu Dokument (ueber Renderer)    | OpenCode #2 | offen  |
| 5.5 | Korrekturraster-Anbindung                          | OpenCode #3 | offen  |

---

## Schema-Anfragen (an Claude Code)

Format: `- [Datum] Antragsteller: gewuenschte Aenderung, Begruendung`

(noch keine)
