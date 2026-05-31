# AGENTS.md — Gemeinsame Regeln fuer alle Coding-Agents

Diese Datei lesen ALLE Agents zuerst (Claude Code, Kimi Code, OpenCode 1-3).
Danach: `DESIGN.md`. Danach die agenteneigene Datei (`CLAUDE.md`, `KIMI.md`).

## Wichtig: Hier bauen mehrere LLMs gleichzeitig

An diesem Repo arbeiten parallel fuenf Coding-Agents von verschiedenen Anbietern:

| Agent       | Anbieter   | Eigene Datei | Branch            |
|-------------|------------|--------------|-------------------|
| Claude Code | Anthropic  | CLAUDE.md    | agent/claude      |
| Kimi Code   | Moonshot   | KIMI.md      | agent/kimi        |
| OpenCode #1 | (frei)     | AGENTS.md    | agent/opencode-1  |
| OpenCode #2 | (frei)     | AGENTS.md    | agent/opencode-2  |
| OpenCode #3 | (frei)     | AGENTS.md    | agent/opencode-3  |

Du bist EINER von mehreren. Gehe nie davon aus, dass du allein im Repo bist.
Vor jeder Arbeitssitzung: `git pull --rebase`. Halte Commits klein.

## Modul-Ownership (verhindert Kollisionen)

Jeder Agent besitzt ein Modul. Du editierst NUR dein eigenes Modul. Willst du eine
Aenderung in einem fremden Modul, traegst du sie als Aufgabe in `TASKS.md` ein und
ueberlaesst sie dem Owner.

| Modul                | Owner       | Zweck                                   |
|----------------------|-------------|-----------------------------------------|
| packages/schema      | Claude Code | Datenstruktur (Zod + Typen), der Vertrag|
| packages/renderer    | Claude Code | JSON -> 2x .docx, Hausstil              |
| packages/input       | Kimi Code   | Quelltexte parsen + Drive lesen         |
| packages/llm         | OpenCode #1 | Anbieter-Adapter, erzwingt JSON         |
| apps/web             | OpenCode #2 | Baukasten-UI + Vorschau                 |
| packages/qa          | OpenCode #3 | Fixtures, Integrationstests, Raster     |

Sonderregel Schema: `packages/schema` ist der Vertrag zwischen allen Modulen.
Nur Claude Code aendert es. Alle anderen importieren es und melden Aenderungswuensche
ueber `TASKS.md`.

## Goldene Regeln

1. `DESIGN.md` ist die Quelle der Wahrheit. Bei Widerspruch gewinnt `DESIGN.md`.
2. Inhalt und Layout strikt trennen. Hausstil gehoert in den Renderer-Code, nie ins Prompt.
3. Editiere nur dein Modul. Fremde Aenderung -> `TASKS.md`.
4. Vor Arbeitsbeginn `git pull --rebase`, danach kleine Commits.
5. Jede LLM-Ausgabe wird gegen das Zod-Schema validiert, bevor sie gerendert wird.
6. Keine Schuelerdaten verarbeiten. Datenschutz-Hinweise in `DESIGN.md` Abschnitt 9 beachten.

## Aufgaben uebernehmen (Claim)

`TASKS.md` ist das Aufgabenbrett. Bevor du eine Aufgabe startest:
- setze in `TASKS.md` deinen Namen und Status `in Arbeit` in die Zeile.
- committe diese Aenderung zuerst (so sehen die anderen, dass die Aufgabe vergeben ist).
- nach Fertigstellung Status `fertig`.

## Branch- und Commit-Konvention

- Branch pro Agent (siehe Tabelle oben). `main` ist nur fuer integrierte, getestete Staende.
- Conventional Commits mit Agent-Tag, z. B.:
  `feat(renderer): lueckentext-block mit linien rendern [claude]`
  `fix(input): pdf-parser umlaute korrigieren [kimi]`
- Vor Merge nach `main`: Tests gruen (`pnpm test`).

## Changelog-Protokoll

Damit nicht alle in dieselbe Datei schreiben und Konflikte entstehen:
- jeder Agent schreibt NUR in seine eigene Datei `changelog/<agent>.md` (append-only).
- Eintragsformat: `- [YYYY-MM-DD] kurze Beschreibung (Phase X)`.
- Am Ende jeder Phase rollt OpenCode #3 die Eintraege in `CHANGELOG.md` zusammen.

## Definition of Done pro Aufgabe

- Code im eigenen Modul, gegen Schema getippt.
- Tests vorhanden und gruen.
- Eintrag in `changelog/<agent>.md`.
- Status in `TASKS.md` auf `fertig`.
