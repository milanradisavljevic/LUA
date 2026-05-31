import { describe, it, expect } from 'vitest';
import {
  DocumentSchema,
  MetaSchema,
  QuellTextSchema,
  LueckentextBlockSchema,
  MatchingBlockSchema,
  MultipleChoiceBlockSchema,
  OffeneVerstaendnisfrageBlockSchema,
  OffeneSchreibaufgabeBlockSchema,
  MarkieraufgabeBlockSchema,
  BlockSchema,
  type DocumentV1,
  type Meta,
  type QuellText,
  type LueckentextBlock,
  type MatchingBlock,
  type MultipleChoiceBlock,
  type OffeneVerstaendnisfrageBlock,
  type OffeneSchreibaufgabeBlock,
  type MarkieraufgabeBlock,
  type Block,
} from './index.js';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

describe('MetaSchema', () => {
  it('accepts valid oberstufe meta', () => {
    const meta: Meta = {
      stufe: 'oberstufe',
      fach: 'deutsch',
      thema: 'Medienkonsum',
      datum: '2026-05-30',
      klasse: '7A',
      notizen: '',
    };
    expect(MetaSchema.safeParse(meta).success).toBe(true);
  });

  it('accepts valid unterstufe meta', () => {
    const meta: Meta = {
      stufe: 'unterstufe',
      fach: 'englisch',
      thema: 'Environment',
      datum: '2026-06-01',
      klasse: '3B',
      notizen: 'Probearbeitsanweisung',
    };
    expect(MetaSchema.safeParse(meta).success).toBe(true);
  });

  it('rejects invalid stufe', () => {
    const result = MetaSchema.safeParse({ stufe: 'mittelschule', fach: 'deutsch', thema: 'x', datum: '2026-01-01', klasse: '1A', notizen: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid fach', () => {
    const result = MetaSchema.safeParse({ stufe: 'oberstufe', fach: 'mathematik', thema: 'x', datum: '2026-01-01', klasse: '5A', notizen: '' });
    expect(result.success).toBe(false);
  });

  it('rejects non-ISO datum', () => {
    const result = MetaSchema.safeParse({ stufe: 'oberstufe', fach: 'deutsch', thema: 'x', datum: '31.05.2026', klasse: '6A', notizen: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty thema', () => {
    const result = MetaSchema.safeParse({ stufe: 'oberstufe', fach: 'deutsch', thema: '', datum: '2026-01-01', klasse: '7A', notizen: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty klasse', () => {
    const result = MetaSchema.safeParse({ stufe: 'oberstufe', fach: 'deutsch', thema: 'Thema', datum: '2026-01-01', klasse: '', notizen: '' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// QuellText
// ---------------------------------------------------------------------------

describe('QuellTextSchema', () => {
  it('accepts upload source', () => {
    const q: QuellText = {
      id: 'q1',
      titel: 'Social Media',
      inhalt: 'Hier steht der Originaltext.',
      herkunft: { typ: 'upload', ref: 'quelltext_1.pdf' },
    };
    expect(QuellTextSchema.safeParse(q).success).toBe(true);
  });

  it('accepts url source', () => {
    const q: QuellText = {
      id: 'q2',
      titel: 'Artikel',
      inhalt: 'Text...',
      herkunft: { typ: 'url', ref: 'https://example.com/artikel' },
    };
    expect(QuellTextSchema.safeParse(q).success).toBe(true);
  });

  it('accepts drive source', () => {
    const q: QuellText = {
      id: 'q3',
      titel: 'Mein Text',
      inhalt: 'Text...',
      herkunft: { typ: 'drive', ref: 'file-id-abc123' },
    };
    expect(QuellTextSchema.safeParse(q).success).toBe(true);
  });

  it('rejects invalid herkunft typ', () => {
    const result = QuellTextSchema.safeParse({ id: 'q1', titel: 'x', inhalt: 'y', herkunft: { typ: 'email', ref: 'z' } });
    expect(result.success).toBe(false);
  });

  it('rejects empty id', () => {
    const result = QuellTextSchema.safeParse({ id: '', titel: 'x', inhalt: 'y', herkunft: { typ: 'upload', ref: 'f.pdf' } });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// lueckentext
// ---------------------------------------------------------------------------

describe('LueckentextBlockSchema', () => {
  it('accepts valid lueckentext without wortbank', () => {
    const block: LueckentextBlock = {
      id: 'b1',
      typ: 'lueckentext',
      punkte: 8,
      quelleId: 'q1',
      arbeitsanweisung: 'Lies den Text. Setze die fehlenden Begriffe ein.',
      config: { anzahlLuecken: 8, wortbank: false, distraktoren: 0 },
      loesung: { luecken: [{ nr: 1, wort: 'Medien' }, { nr: 2, wort: 'sozial' }] },
    };
    expect(LueckentextBlockSchema.safeParse(block).success).toBe(true);
  });

  it('accepts wortbank=true for unterstufe in document context', () => {
    // The block itself is valid; stufe-constraint is enforced at document level
    const block = {
      id: 'b1',
      typ: 'lueckentext',
      punkte: 5,
      arbeitsanweisung: 'Setze ein.',
      config: { anzahlLuecken: 5, wortbank: true, distraktoren: 2 },
      loesung: { luecken: [{ nr: 1, wort: 'Wort' }] },
    };
    expect(LueckentextBlockSchema.safeParse(block).success).toBe(true);
  });

  it('rejects wortbank=true with distraktoren=0', () => {
    const result = LueckentextBlockSchema.safeParse({
      id: 'b1',
      typ: 'lueckentext',
      punkte: 5,
      arbeitsanweisung: 'Setze ein.',
      config: { anzahlLuecken: 5, wortbank: true, distraktoren: 0 },
      loesung: { luecken: [] },
    });
    expect(result.success).toBe(false);
  });

  it('rejects anzahlLuecken <= 0', () => {
    const result = LueckentextBlockSchema.safeParse({
      id: 'b1',
      typ: 'lueckentext',
      punkte: 5,
      arbeitsanweisung: 'Setze ein.',
      config: { anzahlLuecken: 0, wortbank: false, distraktoren: 0 },
      loesung: { luecken: [] },
    });
    expect(result.success).toBe(false);
  });

  it('rejects punkte <= 0', () => {
    const result = LueckentextBlockSchema.safeParse({
      id: 'b1',
      typ: 'lueckentext',
      punkte: 0,
      arbeitsanweisung: 'Setze ein.',
      config: { anzahlLuecken: 3, wortbank: false, distraktoren: 0 },
      loesung: { luecken: [] },
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional clue', () => {
    const block = {
      id: 'b1',
      typ: 'lueckentext',
      punkte: 5,
      arbeitsanweisung: 'Setze ein.',
      clue: 'Achte auf den Kontext.',
      config: { anzahlLuecken: 5, wortbank: false, distraktoren: 0 },
      loesung: { luecken: [{ nr: 1, wort: 'Test' }] },
    };
    expect(LueckentextBlockSchema.safeParse(block).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// matching
// ---------------------------------------------------------------------------

describe('MatchingBlockSchema', () => {
  it('accepts valid matching block', () => {
    const block: MatchingBlock = {
      id: 'b2',
      typ: 'matching',
      punkte: 6,
      arbeitsanweisung: 'Ordne die Begriffe den Definitionen zu.',
      config: {
        items: [
          { nr: 1, prompt: 'Metapher' },
          { nr: 2, prompt: 'Hyperbel' },
          { nr: 3, prompt: 'Ironie' },
        ],
        optionen: [
          { key: 'A', text: 'Übertreibung' },
          { key: 'B', text: 'Gegenteil meinen' },
          { key: 'C', text: 'Bildlicher Vergleich ohne wie' },
          { key: 'D', text: 'Vergleich mit wie' },
        ],
      },
      loesung: { zuordnung: { '1': 'C', '2': 'A', '3': 'B' } },
    };
    expect(MatchingBlockSchema.safeParse(block).success).toBe(true);
  });

  it('rejects when optionen count <= items count', () => {
    const result = MatchingBlockSchema.safeParse({
      id: 'b2',
      typ: 'matching',
      punkte: 4,
      arbeitsanweisung: 'Zuordnen.',
      config: {
        items: [{ nr: 1, prompt: 'A' }, { nr: 2, prompt: 'B' }],
        optionen: [{ key: 'X', text: 'Eins' }, { key: 'Y', text: 'Zwei' }],
      },
      loesung: { zuordnung: { '1': 'X', '2': 'Y' } },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty items', () => {
    const result = MatchingBlockSchema.safeParse({
      id: 'b2',
      typ: 'matching',
      punkte: 4,
      arbeitsanweisung: 'Zuordnen.',
      config: { items: [], optionen: [{ key: 'A', text: 'Eins' }] },
      loesung: { zuordnung: {} },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// multipleChoice
// ---------------------------------------------------------------------------

describe('MultipleChoiceBlockSchema', () => {
  it('accepts valid multipleChoice block', () => {
    const block: MultipleChoiceBlock = {
      id: 'b3',
      typ: 'multipleChoice',
      punkte: 4,
      arbeitsanweisung: 'Kreuze die richtige Antwort an.',
      config: {
        fragen: [
          {
            nr: 1,
            frage: 'Was ist eine Metapher?',
            optionen: [
              { key: 'A', text: 'Ein Vergleich mit "wie"' },
              { key: 'B', text: 'Ein Bild ohne Vergleichswort' },
              { key: 'C', text: 'Eine Übertreibung' },
            ],
            mehrfach: false,
          },
        ],
      },
      loesung: { antworten: { '1': ['B'] } },
    };
    expect(MultipleChoiceBlockSchema.safeParse(block).success).toBe(true);
  });

  it('accepts mehrfach=true with multiple correct keys', () => {
    const block = {
      id: 'b3',
      typ: 'multipleChoice',
      punkte: 6,
      arbeitsanweisung: 'Kreuze alle richtigen Antworten an.',
      config: {
        fragen: [{
          nr: 1,
          frage: 'Welche sind Stilmittel?',
          optionen: [{ key: 'A', text: 'Metapher' }, { key: 'B', text: 'Satz' }, { key: 'C', text: 'Ironie' }],
          mehrfach: true,
        }],
      },
      loesung: { antworten: { '1': ['A', 'C'] } },
    };
    expect(MultipleChoiceBlockSchema.safeParse(block).success).toBe(true);
  });

  it('rejects empty fragen list', () => {
    const result = MultipleChoiceBlockSchema.safeParse({
      id: 'b3',
      typ: 'multipleChoice',
      punkte: 4,
      arbeitsanweisung: 'Kreuze an.',
      config: { fragen: [] },
      loesung: { antworten: {} },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// offeneVerstaendnisfrage
// ---------------------------------------------------------------------------

describe('OffeneVerstaendnisfrageBlockSchema', () => {
  it('accepts valid block', () => {
    const block: OffeneVerstaendnisfrageBlock = {
      id: 'b4',
      typ: 'offeneVerstaendnisfrage',
      punkte: 10,
      quelleId: 'q1',
      arbeitsanweisung: 'Beantworte die Fragen in ganzen Saetzen.',
      config: {
        fragen: [
          { nr: 1, frage: 'Was ist das Hauptthema?', zeilen: 4 },
          { nr: 2, frage: 'Nenne drei Argumente.', zeilen: 6 },
        ],
      },
      loesung: {
        antworten: {
          '1': 'Das Hauptthema ist die Auswirkung von Social Media auf Jugendliche.',
          '2': 'Erstens... Zweitens... Drittens...',
        },
      },
    };
    expect(OffeneVerstaendnisfrageBlockSchema.safeParse(block).success).toBe(true);
  });

  it('rejects zeilen < 1', () => {
    const result = OffeneVerstaendnisfrageBlockSchema.safeParse({
      id: 'b4',
      typ: 'offeneVerstaendnisfrage',
      punkte: 5,
      arbeitsanweisung: 'Beantworte.',
      config: { fragen: [{ nr: 1, frage: 'Was?', zeilen: 0 }] },
      loesung: { antworten: { '1': 'Antwort' } },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty fragen', () => {
    const result = OffeneVerstaendnisfrageBlockSchema.safeParse({
      id: 'b4',
      typ: 'offeneVerstaendnisfrage',
      punkte: 5,
      arbeitsanweisung: 'Beantworte.',
      config: { fragen: [] },
      loesung: { antworten: {} },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// offeneSchreibaufgabe
// ---------------------------------------------------------------------------

describe('OffeneSchreibaufgabeBlockSchema', () => {
  it('accepts valid Oberstufe writing task', () => {
    const block: OffeneSchreibaufgabeBlock = {
      id: 'b5',
      typ: 'offeneSchreibaufgabe',
      punkte: 30,
      arbeitsanweisung: 'Verfasse einen Kommentar.',
      config: {
        situation: 'Du hast einen Artikel ueber Social Media gelesen.',
        textsorte: 'Kommentar',
        umfangWorte: { min: 270, max: 330 },
        aspekte: [
          'Erklaere die Auswirkungen auf das Wohlbefinden.',
          'Nimm Stellung zur Verantwortung der Plattformen.',
        ],
      },
      loesung: {
        musterloesung: 'Social Media beeinflusst...',
        erwartungshorizont: {
          inhalt: 'Alle Aspekte angesprochen, eigene Meinung klar.',
          struktur: 'Einleitung, Hauptteil, Schluss erkennbar.',
          ausdruck: 'Treffende Wortwahl, variierter Satzbau.',
          sprachrichtigkeit: 'Keine gravierenden Fehler.',
        },
      },
    };
    expect(OffeneSchreibaufgabeBlockSchema.safeParse(block).success).toBe(true);
  });

  it('rejects when min > max in umfangWorte', () => {
    const result = OffeneSchreibaufgabeBlockSchema.safeParse({
      id: 'b5',
      typ: 'offeneSchreibaufgabe',
      punkte: 30,
      arbeitsanweisung: 'Verfasse.',
      config: {
        situation: 'Situation.',
        textsorte: 'Brief',
        umfangWorte: { min: 400, max: 300 },
        aspekte: ['Aspekt 1'],
      },
      loesung: {
        musterloesung: 'Loesung.',
        erwartungshorizont: { inhalt: 'x', struktur: 'x', ausdruck: 'x', sprachrichtigkeit: 'x' },
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty aspekte', () => {
    const result = OffeneSchreibaufgabeBlockSchema.safeParse({
      id: 'b5',
      typ: 'offeneSchreibaufgabe',
      punkte: 30,
      arbeitsanweisung: 'Verfasse.',
      config: {
        situation: 'Situation.',
        textsorte: 'Brief',
        umfangWorte: { min: 200, max: 300 },
        aspekte: [],
      },
      loesung: {
        musterloesung: 'Loesung.',
        erwartungshorizont: { inhalt: 'x', struktur: 'x', ausdruck: 'x', sprachrichtigkeit: 'x' },
      },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// markieraufgabe
// ---------------------------------------------------------------------------

describe('MarkieraufgabeBlockSchema', () => {
  it('accepts valid marking task', () => {
    const block: MarkieraufgabeBlock = {
      id: 'b6',
      typ: 'markieraufgabe',
      punkte: 5,
      quelleId: 'q1',
      arbeitsanweisung: 'Markiere alle Metaphern im Text.',
      config: { quelleId: 'q1', anweisung: 'Markiere alle Metaphern.' },
      loesung: { stellen: ['das Leben ist ein Fluss', 'die Zeit rennt davon'] },
    };
    expect(MarkieraufgabeBlockSchema.safeParse(block).success).toBe(true);
  });

  it('rejects empty stellen in loesung', () => {
    const result = MarkieraufgabeBlockSchema.safeParse({
      id: 'b6',
      typ: 'markieraufgabe',
      punkte: 5,
      arbeitsanweisung: 'Markiere.',
      config: { quelleId: 'q1', anweisung: 'Markiere.' },
      loesung: { stellen: [] },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DocumentSchema — full document validation
// ---------------------------------------------------------------------------

describe('DocumentSchema', () => {
  const validDoc: DocumentV1 = {
    schemaVersion: '0.1.0',
    meta: {
      stufe: 'oberstufe',
      fach: 'deutsch',
      thema: 'Medienkonsum und Jugendliche',
      datum: '2026-05-30',
      klasse: '7A',
      notizen: '',
    },
    quelltexte: [
      {
        id: 'q1',
        titel: 'Social Media Artikel',
        inhalt: 'Ein langer Text ueber Social Media...',
        herkunft: { typ: 'upload', ref: 'quelltext_1.pdf' },
      },
    ],
    bloecke: [
      {
        id: 'b1',
        typ: 'lueckentext',
        punkte: 8,
        quelleId: 'q1',
        arbeitsanweisung: 'Lies den Text. Setze die fehlenden Begriffe ein.',
        config: { anzahlLuecken: 8, wortbank: false, distraktoren: 0 },
        loesung: { luecken: [{ nr: 1, wort: 'Medien' }] },
      },
    ],
  };

  it('accepts a valid complete document', () => {
    expect(DocumentSchema.safeParse(validDoc).success).toBe(true);
  });

  it('rejects wrong schemaVersion', () => {
    const result = DocumentSchema.safeParse({ ...validDoc, schemaVersion: '1.0.0' });
    expect(result.success).toBe(false);
  });

  it('rejects document with empty quelltexte', () => {
    const result = DocumentSchema.safeParse({ ...validDoc, quelltexte: [] });
    expect(result.success).toBe(false);
  });

  it('rejects document with empty bloecke', () => {
    const result = DocumentSchema.safeParse({ ...validDoc, bloecke: [] });
    expect(result.success).toBe(false);
  });

  it('rejects wortbank=true in oberstufe document', () => {
    const doc: DocumentV1 = {
      ...validDoc,
      meta: { ...validDoc.meta, stufe: 'oberstufe' },
      bloecke: [{
        id: 'b1',
        typ: 'lueckentext',
        punkte: 5,
        arbeitsanweisung: 'Setze ein.',
        config: { anzahlLuecken: 5, wortbank: true, distraktoren: 2 },
        loesung: { luecken: [{ nr: 1, wort: 'Wort' }] },
      }],
    };
    expect(DocumentSchema.safeParse(doc).success).toBe(false);
  });

  it('accepts wortbank=true in unterstufe document', () => {
    const doc: DocumentV1 = {
      ...validDoc,
      meta: { ...validDoc.meta, stufe: 'unterstufe' },
      bloecke: [{
        id: 'b1',
        typ: 'lueckentext',
        punkte: 5,
        arbeitsanweisung: 'Setze ein.',
        config: { anzahlLuecken: 5, wortbank: true, distraktoren: 2 },
        loesung: { luecken: [{ nr: 1, wort: 'Wort' }] },
      }],
    };
    expect(DocumentSchema.safeParse(doc).success).toBe(true);
  });

  it('parses and returns typed document', () => {
    const result = DocumentSchema.parse(validDoc);
    expect(result.schemaVersion).toBe('0.1.0');
    expect(result.meta.fach).toBe('deutsch');
    expect(result.bloecke).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// BlockSchema discriminated union
// ---------------------------------------------------------------------------

describe('BlockSchema discriminated union', () => {
  it('correctly narrows to lueckentext', () => {
    const raw = {
      id: 'b1', typ: 'lueckentext', punkte: 5, arbeitsanweisung: 'Setze ein.',
      config: { anzahlLuecken: 3, wortbank: false, distraktoren: 0 },
      loesung: { luecken: [{ nr: 1, wort: 'Test' }] },
    };
    const result = BlockSchema.safeParse(raw);
    expect(result.success).toBe(true);
    if (result.success && result.data.typ === 'lueckentext') {
      expect(result.data.config.anzahlLuecken).toBe(3);
    }
  });

  it('rejects unknown block typ', () => {
    const result = BlockSchema.safeParse({
      id: 'b1', typ: 'unbekannt', punkte: 5, arbeitsanweisung: 'x',
      config: {}, loesung: {},
    });
    expect(result.success).toBe(false);
  });
});
