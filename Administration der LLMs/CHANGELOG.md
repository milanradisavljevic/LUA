# Changelog

Kanonischer, zusammengefuehrter Changelog des Projekts.

Waehrend der Arbeit schreibt jeder Agent NUR in seine eigene Datei unter
`changelog/<agent>.md` (verhindert Merge-Konflikte). Am Ende jeder Phase rollt
OpenCode #3 die Eintraege hier zusammen, gruppiert nach Phase.

Format orientiert an Keep a Changelog. Versionierung nach Phasen (0.x = Phase x).

## [Unveroeffentlicht]

### Phase 0
- Projekt-Geruest und Designdokument angelegt.
- Monorepo scaffold: pnpm workspaces, TypeScript, Vitest (Claude Code).
- Zod-Schema fuer alle 6 Blocktypen + TS-Typen exportiert (Claude Code).
- 6 Fixture-JSONs pro Blocktyp + Validierungstests (OpenCode #3).
