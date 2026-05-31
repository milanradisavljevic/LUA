# Changelog — claude

Append-only. Eintragsformat: `- [YYYY-MM-DD] Beschreibung (Phase X)`.
Nur dieser Agent schreibt in diese Datei.

- [2026-05-31] Datei angelegt, Rolle laut AGENTS.md uebernommen.
- [2026-05-31] Task 0.1: Monorepo-Grundgeruest erstellt — pnpm workspaces, tsconfig.base.json, Verzeichnisstruktur (packages/schema, renderer, input, llm, qa; apps/web; docs). (Phase 0)
- [2026-05-31] Task 0.2: Zod-Schema fuer alle 6 Blocktypen implementiert (lueckentext, matching, multipleChoice, offeneVerstaendnisfrage, offeneSchreibaufgabe, markieraufgabe) inkl. aller Constraints aus DESIGN.md Abschnitt 6. 41 Tests, alle gruen. (Phase 0)
- [2026-05-31] Task 0.3: TypeScript-Typen aus packages/schema exportiert; alle anderen Packages importieren via workspace:*. Beispiel-JSON mit allen 5 Blocktypen in docs/beispiel.json. (Phase 0)
- [2026-05-31] Enabler 4.5: renderDocumentToBlobs() in packages/renderer exportiert — gibt { schueler: Blob, loesung: Blob } zurueck via Packer.toBlob(). Browser-native, kein Buffer-Polyfill noetig. OpenCode #2 soll useExport.ts auf diese Funktion umstellen. 4 neue Tests, 18 gesamt gruen. (Phase 4-Enabler)
- [2026-05-31] Tasks 1.1–1.5: packages/renderer implementiert. renderDocument(doc) -> { schueler: Buffer, loesung: Buffer }. Hausstil nach DESIGN.md §7 fest kodiert (Arial 11pt, 2.0/2.2cm Raender, Kopf- und Fusszeile). Alle 6 Blocktypen: Schueler-Fassung mit Leerstellen/Schreiblinien (>=9mm), Loesungsfassung kursiv eingerueckt. keepNext verhindert Aufgabenumbrueche. 14 Tests gruen. (Phase 1)
