import { describe, it, expect } from 'vitest';
import { renderDocument } from './index.js';
import type { DocumentV1 } from '@lehrunterlagen/schema';

// ZIP magic bytes — every .docx starts with PK\x03\x04
const isDocx = (buf: Buffer) =>
  buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;

// ---------------------------------------------------------------------------
// Minimal fixture helpers
// ---------------------------------------------------------------------------

const baseMeta = (stufe: 'oberstufe' | 'unterstufe' = 'oberstufe'): DocumentV1['meta'] => ({
  stufe,
  fach: 'deutsch',
  thema: 'Medienkonsum und Jugendliche',
  datum: '2026-05-30',
  klasse: '7A',
  notizen: '',
});

const baseQuelltext: DocumentV1['quelltexte'] = [
  {
    id: 'q1',
    titel: 'Quelltext',
    inhalt: 'Dies ist ein Beispieltext fuer den Renderer.',
    herkunft: { typ: 'upload', ref: 'test.pdf' },
  },
];

function makeDoc(bloecke: DocumentV1['bloecke'], stufe: 'oberstufe' | 'unterstufe' = 'oberstufe'): DocumentV1 {
  return { schemaVersion: '0.1.0', meta: baseMeta(stufe), quelltexte: baseQuelltext, bloecke };
}

// ---------------------------------------------------------------------------
// Return shape
// ---------------------------------------------------------------------------

describe('renderDocument return shape', () => {
  it('returns schueler and loesung buffers', async () => {
    const doc = makeDoc([{
      id: 'b1', typ: 'lueckentext', punkte: 4, arbeitsanweisung: 'Setze ein.',
      config: { anzahlLuecken: 4, wortbank: false, distraktoren: 0 },
      loesung: { luecken: [{ nr: 1, wort: 'Test' }, { nr: 2, wort: 'Wert' }, { nr: 3, wort: 'mehr' }, { nr: 4, wort: 'letzt' }] },
    }]);
    const result = await renderDocument(doc);
    expect(result).toHaveProperty('schueler');
    expect(result).toHaveProperty('loesung');
    expect(result.schueler).toBeInstanceOf(Buffer);
    expect(result.loesung).toBeInstanceOf(Buffer);
  });

  it('both outputs are valid .docx (ZIP magic bytes)', async () => {
    const doc = makeDoc([{
      id: 'b1', typ: 'lueckentext', punkte: 4, arbeitsanweisung: 'Setze ein.',
      config: { anzahlLuecken: 2, wortbank: false, distraktoren: 0 },
      loesung: { luecken: [{ nr: 1, wort: 'A' }, { nr: 2, wort: 'B' }] },
    }]);
    const { schueler, loesung } = await renderDocument(doc);
    expect(isDocx(schueler)).toBe(true);
    expect(isDocx(loesung)).toBe(true);
  });

  it('schueler and loesung produce different files', async () => {
    const doc = makeDoc([{
      id: 'b1', typ: 'lueckentext', punkte: 4, arbeitsanweisung: 'Setze ein.',
      config: { anzahlLuecken: 2, wortbank: false, distraktoren: 0 },
      loesung: { luecken: [{ nr: 1, wort: 'Antwort' }, { nr: 2, wort: 'Zwei' }] },
    }]);
    const { schueler, loesung } = await renderDocument(doc);
    expect(schueler.equals(loesung)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Block types — all must render without throwing
// ---------------------------------------------------------------------------

describe('renderDocument: alle Blocktypen rendern fehlerfrei', () => {
  it('lueckentext', async () => {
    const doc = makeDoc([{
      id: 'b1', typ: 'lueckentext', punkte: 8, quelleId: 'q1',
      arbeitsanweisung: 'Lies den Text. Setze die fehlenden Begriffe ein.',
      config: { anzahlLuecken: 3, wortbank: false, distraktoren: 0 },
      loesung: { luecken: [{ nr: 1, wort: 'Medien' }, { nr: 2, wort: 'sozial' }, { nr: 3, wort: 'digital' }] },
    }]);
    await expect(renderDocument(doc)).resolves.toBeDefined();
  });

  it('lueckentext mit wortbank (unterstufe)', async () => {
    const doc = makeDoc([{
      id: 'b1', typ: 'lueckentext', punkte: 5, arbeitsanweisung: 'Setze ein.',
      config: { anzahlLuecken: 3, wortbank: true, distraktoren: 2 },
      loesung: { luecken: [{ nr: 1, wort: 'A' }, { nr: 2, wort: 'B' }, { nr: 3, wort: 'C' }] },
    }], 'unterstufe');
    await expect(renderDocument(doc)).resolves.toBeDefined();
  });

  it('matching', async () => {
    const doc = makeDoc([{
      id: 'b2', typ: 'matching', punkte: 6, arbeitsanweisung: 'Ordne zu.',
      config: {
        items: [{ nr: 1, prompt: 'Begriff A' }, { nr: 2, prompt: 'Begriff B' }, { nr: 3, prompt: 'Begriff C' }],
        optionen: [{ key: 'A', text: 'Def 1' }, { key: 'B', text: 'Def 2' }, { key: 'C', text: 'Def 3' }, { key: 'D', text: 'Def 4' }],
      },
      loesung: { zuordnung: { '1': 'C', '2': 'A', '3': 'B' } },
    }]);
    await expect(renderDocument(doc)).resolves.toBeDefined();
  });

  it('multipleChoice', async () => {
    const doc = makeDoc([{
      id: 'b3', typ: 'multipleChoice', punkte: 4, arbeitsanweisung: 'Kreuze an.',
      config: {
        fragen: [{
          nr: 1, frage: 'Was ist X?', mehrfach: false,
          optionen: [{ key: 'A', text: 'Eins' }, { key: 'B', text: 'Zwei' }, { key: 'C', text: 'Drei' }],
        }],
      },
      loesung: { antworten: { '1': ['B'] } },
    }]);
    await expect(renderDocument(doc)).resolves.toBeDefined();
  });

  it('offeneVerstaendnisfrage', async () => {
    const doc = makeDoc([{
      id: 'b4', typ: 'offeneVerstaendnisfrage', punkte: 10, quelleId: 'q1',
      arbeitsanweisung: 'Beantworte in ganzen Saetzen.',
      config: { fragen: [{ nr: 1, frage: 'Was ist das Thema?', zeilen: 4 }] },
      loesung: { antworten: { '1': 'Das Thema ist Medienkonsum.' } },
    }]);
    await expect(renderDocument(doc)).resolves.toBeDefined();
  });

  it('offeneSchreibaufgabe', async () => {
    const doc = makeDoc([{
      id: 'b5', typ: 'offeneSchreibaufgabe', punkte: 30, arbeitsanweisung: 'Verfasse einen Kommentar.',
      config: {
        situation: 'Du hast einen Artikel gelesen.',
        textsorte: 'Kommentar',
        umfangWorte: { min: 270, max: 330 },
        aspekte: ['Erklaere die Auswirkungen.', 'Nimm Stellung.'],
      },
      loesung: {
        musterloesung: 'Muster...',
        erwartungshorizont: { inhalt: 'x', struktur: 'x', ausdruck: 'x', sprachrichtigkeit: 'x' },
      },
    }]);
    await expect(renderDocument(doc)).resolves.toBeDefined();
  });

  it('markieraufgabe', async () => {
    const doc = makeDoc([{
      id: 'b6', typ: 'markieraufgabe', punkte: 5, quelleId: 'q1',
      arbeitsanweisung: 'Markiere alle Metaphern.',
      config: { quelleId: 'q1', anweisung: 'Markiere alle Metaphern.' },
      loesung: { stellen: ['das Leben ist ein Fluss'] },
    }]);
    await expect(renderDocument(doc)).resolves.toBeDefined();
  });

  it('Dokument mit mehreren Bloecken verschiedener Typen', async () => {
    const doc = makeDoc([
      {
        id: 'b1', typ: 'lueckentext', punkte: 4, quelleId: 'q1',
        arbeitsanweisung: 'Setze ein.',
        config: { anzahlLuecken: 2, wortbank: false, distraktoren: 0 },
        loesung: { luecken: [{ nr: 1, wort: 'A' }, { nr: 2, wort: 'B' }] },
      },
      {
        id: 'b2', typ: 'offeneVerstaendnisfrage', punkte: 6, quelleId: 'q1',
        arbeitsanweisung: 'Beantworte.',
        config: { fragen: [{ nr: 1, frage: 'Warum?', zeilen: 3 }] },
        loesung: { antworten: { '1': 'Weil...' } },
      },
    ]);
    await expect(renderDocument(doc)).resolves.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// House style: Schülerfassung vs. Lösungsfassung content rules
// ---------------------------------------------------------------------------

describe('renderDocument: Inhalt Schuelerfassung vs Loesungsfassung', () => {
  it('beide Outputs sind gueltige .docx Dateien (nicht leer)', async () => {
    const doc = makeDoc([{
      id: 'b1', typ: 'offeneVerstaendnisfrage', punkte: 6, quelleId: 'q1',
      arbeitsanweisung: 'Beantworte.',
      config: { fragen: [{ nr: 1, frage: 'Was ist das Thema?', zeilen: 4 }] },
      loesung: { antworten: { '1': 'Das Thema ist Medienkonsum.' } },
    }]);
    const { schueler, loesung } = await renderDocument(doc);
    expect(schueler.length).toBeGreaterThan(1000);
    expect(loesung.length).toBeGreaterThan(1000);
  });

  it('beide Versionen sind valide .docx-Dateien und unterschiedlich', async () => {
    const doc = makeDoc([{
      id: 'b1', typ: 'offeneVerstaendnisfrage', punkte: 10, quelleId: 'q1',
      arbeitsanweisung: 'Beantworte ausfuehrlich.',
      config: {
        fragen: [
          { nr: 1, frage: 'Frage 1?', zeilen: 6 },
          { nr: 2, frage: 'Frage 2?', zeilen: 6 },
        ],
      },
      loesung: {
        antworten: {
          '1': 'Eine sehr ausfuehrliche Musterantwort auf Frage 1 auf Schuelerniveau.',
          '2': 'Eine weitere ausfuehrliche Musterantwort auf Frage 2 auf Schuelerniveau.',
        },
      },
    }]);
    const { schueler, loesung } = await renderDocument(doc);
    expect(isDocx(schueler)).toBe(true);
    expect(isDocx(loesung)).toBe(true);
    // beide Dateien müssen sich inhaltlich unterscheiden
    expect(schueler.equals(loesung)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Meta in header
// ---------------------------------------------------------------------------

describe('renderDocument: Metadaten', () => {
  it('rendert ohne Fehler fuer englisch/unterstufe', async () => {
    const doc: DocumentV1 = {
      schemaVersion: '0.1.0',
      meta: { stufe: 'unterstufe', fach: 'englisch', thema: 'My School', datum: '2026-06-01', klasse: '3B', notizen: '' },
      quelltexte: [{ id: 'q1', titel: 'Text', inhalt: 'Hello world.', herkunft: { typ: 'upload', ref: 'test.txt' } }],
      bloecke: [{
        id: 'b1', typ: 'lueckentext', punkte: 3, arbeitsanweisung: 'Fill in.',
        config: { anzahlLuecken: 2, wortbank: true, distraktoren: 1 },
        loesung: { luecken: [{ nr: 1, wort: 'school' }, { nr: 2, wort: 'world' }] },
      }],
    };
    await expect(renderDocument(doc)).resolves.toBeDefined();
  });
});
