# Changelog — claude

Append-only. Eintragsformat: `- [YYYY-MM-DD] Beschreibung (Phase X)`.
Nur dieser Agent schreibt in diese Datei.

- [2026-05-31] Datei angelegt, Rolle laut AGENTS.md uebernommen.
- [2026-05-31] Task 0.1: Monorepo-Grundgeruest erstellt — pnpm workspaces, tsconfig.base.json, Verzeichnisstruktur (packages/schema, renderer, input, llm, qa; apps/web; docs). (Phase 0)
- [2026-05-31] Task 0.2: Zod-Schema fuer alle 6 Blocktypen implementiert (lueckentext, matching, multipleChoice, offeneVerstaendnisfrage, offeneSchreibaufgabe, markieraufgabe) inkl. aller Constraints aus DESIGN.md Abschnitt 6. 41 Tests, alle gruen. (Phase 0)
- [2026-05-31] Task 0.3: TypeScript-Typen aus packages/schema exportiert; alle anderen Packages importieren via workspace:*. Beispiel-JSON mit allen 5 Blocktypen in docs/beispiel.json. (Phase 0)
