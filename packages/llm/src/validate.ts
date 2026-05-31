import { DocumentSchema, type DocumentV1 } from '@lehrunterlagen/schema';

export interface ValidationResult {
  ok: boolean;
  document?: DocumentV1;
  fehler?: string;
}

// Holt das JSON-Objekt aus der Modellantwort heraus, auch wenn versehentlich
// Markdown-Zaeune oder Begleittext mitgeliefert wurden.
export function extractJson(raw: string): string {
  let s = raw.trim();
  // ```json ... ``` oder ``` ... ``` entfernen
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) s = fence[1].trim();
  // Auf das erste { bis zum letzten } eingrenzen
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  return s;
}

// Normalisiert LLM-Ausgabe: Claude liefert oft Arrays statt Records.
// z.B. antworten: [{ "nr": 1, "antwort": ["B"] }] -> { "1": ["B"] }
// z.B. zuordnung: [{ "item": 1, "option": "B" }] -> { "1": "B" }
function normalizeDocument(data: Record<string, unknown>): Record<string, unknown> {
  const doc = { ...data };
  if (!Array.isArray(doc.bloecke)) return doc;

  doc.bloecke = doc.bloecke.map((block: Record<string, unknown>) => {
    if (!block.loesung || typeof block.loesung !== 'object') return block;
    const loesung = { ...block.loesung } as Record<string, unknown>;

    // multipleChoice + offeneVerstaendnisfrage: antworten Array -> Record
    if (Array.isArray(loesung.antworten)) {
      const record: Record<string, unknown> = {};
      for (const entry of loesung.antworten) {
        if (entry && typeof entry === 'object') {
          const e = entry as Record<string, unknown>;
          const key = String(e.nr ?? e.frage ?? Object.keys(record).length + 1);
          // Liefert verschiedene Moeglichkeiten: korrekt, antwort, key, value
          record[key] = e.korrekt ?? e.antwort ?? e.key ?? e.value ?? entry;
        }
      }
      loesung.antworten = record;
    }

    // Falls antworten ein Record ist, aber Values sind Objekte statt Arrays
    // z.B. { "1": { "key": "A" } } -> { "1": ["A"] }
    // oder { "1": "A" } -> { "1": ["A"] }
    if (loesung.antworten && typeof loesung.antworten === 'object' && !Array.isArray(loesung.antworten)) {
      const fixed: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(loesung.antworten as Record<string, unknown>)) {
        if (Array.isArray(v)) {
          fixed[k] = v;
        } else if (v && typeof v === 'object') {
          const obj = v as Record<string, unknown>;
          fixed[k] = [obj.key ?? obj.antwort ?? obj.value ?? ''];
        } else if (typeof v === 'string') {
          fixed[k] = [v];
        } else {
          fixed[k] = [String(v ?? '')];
        }
      }
      loesung.antworten = fixed;
    }

    // matching: zuordnung Array -> Record
    if (Array.isArray(loesung.zuordnung)) {
      const record: Record<string, string> = {};
      for (const entry of loesung.zuordnung) {
        if (entry && typeof entry === 'object') {
          const e = entry as Record<string, unknown>;
          const key = String(e.nr ?? e.item ?? e.frage ?? Object.keys(record).length + 1);
          record[key] = String(e.option ?? e.key ?? e.value ?? '');
        }
      }
      loesung.zuordnung = record;
    }

    // Falls zuordnung ein Record ist, aber Values sind Objekte statt Strings
    if (loesung.zuordnung && typeof loesung.zuordnung === 'object' && !Array.isArray(loesung.zuordnung)) {
      const fixed: Record<string, string> = {};
      for (const [k, v] of Object.entries(loesung.zuordnung as Record<string, unknown>)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          const obj = v as Record<string, unknown>;
          fixed[k] = String(obj.option ?? obj.key ?? obj.value ?? '');
        } else {
          fixed[k] = String(v);
        }
      }
      loesung.zuordnung = fixed;
    }

    return { ...block, loesung };
  });

  return doc;
}

export function parseAndValidate(raw: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch (e) {
    return { ok: false, fehler: `JSON nicht parsebar: ${(e as Error).message}` };
  }

  // Erst normalisieren, dann validieren
  const normalized = typeof parsed === 'object' && parsed !== null
    ? normalizeDocument(parsed as Record<string, unknown>)
    : parsed;

  const result = DocumentSchema.safeParse(normalized);
  if (!result.success) {
    const fehler = result.error.issues
      .map((i) => `- ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    return { ok: false, fehler };
  }
  return { ok: true, document: result.data };
}
