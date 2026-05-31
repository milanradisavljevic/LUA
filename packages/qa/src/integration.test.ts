import { describe, it, expect } from 'vitest';
import { renderDocument } from '@lehrunterlagen/renderer';
import { DocumentSchema } from '@lehrunterlagen/schema';

import lueckentext from './fixtures/lueckentext.json';
import matching from './fixtures/matching.json';
import multipleChoice from './fixtures/multipleChoice.json';
import offeneVerstaendnisfrage from './fixtures/offeneVerstaendnisfrage.json';
import offeneSchreibaufgabe from './fixtures/offeneSchreibaufgabe.json';
import markieraufgabe from './fixtures/markieraufgabe.json';

const isDocx = (buf: Buffer) =>
  buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;

const fixtures = [
  { name: 'lueckentext', data: lueckentext },
  { name: 'matching', data: matching },
  { name: 'multipleChoice', data: multipleChoice },
  { name: 'offeneVerstaendnisfrage', data: offeneVerstaendnisfrage },
  { name: 'offeneSchreibaufgabe', data: offeneSchreibaufgabe },
  { name: 'markieraufgabe', data: markieraufgabe },
];

describe('Integrationstest: Fixture -> 2 gueltige .docx', () => {
  for (const { name, data } of fixtures) {
    it(`${name}: validiert, rendert zu 2 .docx, Schueler ≠ Loesung`, async () => {
      // 1. Validierung gegen Schema
      const parsed = DocumentSchema.parse(data);

      // 2. Rendering
      const { schueler, loesung } = await renderDocument(parsed);

      // 3. Beide sind gueltige .docx
      expect(schueler).toBeInstanceOf(Buffer);
      expect(loesung).toBeInstanceOf(Buffer);
      expect(isDocx(schueler)).toBe(true);
      expect(isDocx(loesung)).toBe(true);

      // 4. Nicht leer
      expect(schueler.length).toBeGreaterThan(500);
      expect(loesung.length).toBeGreaterThan(500);

      // 5. Schueler und Loesung unterscheiden sich
      expect(schueler.equals(loesung)).toBe(false);
    });
  }
});

describe('Integrationstest: Kombiniertes Dokument (alle 6 Blocktypen)', () => {
  it('rendert ein Dokument mit allen Blocktypen zu 2 .docx', async () => {
    const combined = DocumentSchema.parse({
      schemaVersion: '0.1.0',
      meta: {
        stufe: 'oberstufe',
        fach: 'deutsch',
        thema: 'Gesamtschularbeit — Medienkonsum',
        datum: '2026-05-30',
        klasse: '7A',
        notizen: 'Integrations-Test',
      },
      quelltexte: [
        {
          id: 'q1',
          titel: 'Social Media und das Wohlbefinden',
          inhalt: 'Die Nutzung von sozialen Medien hat in den letzten Jahren stark zugenommen. Besonders Jugendliche verbringen每天 mehrere Stunden am Tag auf Plattformen wie Instagram und TikTok.',
          herkunft: { typ: 'upload', ref: 'quelltext_1.pdf' },
        },
      ],
      bloecke: [
        {
          id: 'b1', typ: 'lueckentext', punkte: 8, quelleId: 'q1',
          arbeitsanweisung: 'Setze die fehlenden Begriffe ein.',
          config: { anzahlLuecken: 3, wortbank: false, distraktoren: 0 },
          loesung: { luecken: [{ nr: 1, wort: 'Medien' }, { nr: 2, wort: 'Jugendliche' }, { nr: 3, wort: 'Plattformen' }] },
        },
        {
          id: 'b2', typ: 'matching', punkte: 6,
          arbeitsanweisung: 'Ordne die Begriffe den Definitionen zu.',
          config: {
            items: [{ nr: 1, prompt: 'Metapher' }, { nr: 2, prompt: 'Hyperbel' }],
            optionen: [
              { key: 'A', text: 'Uebertreibung' },
              { key: 'B', text: 'Bildhafter Vergleich' },
              { key: 'C', text: 'Vergleich mit wie' },
            ],
          },
          loesung: { zuordnung: { '1': 'B', '2': 'A' } },
        },
        {
          id: 'b3', typ: 'multipleChoice', punkte: 4,
          arbeitsanweisung: 'Kreuze die richtige Antwort an.',
          config: {
            fragen: [{
              nr: 1, frage: 'Was ist eine Metapher?', mehrfach: false,
              optionen: [{ key: 'A', text: 'Vergleich' }, { key: 'B', text: 'Uebertreibung' }],
            }],
          },
          loesung: { antworten: { '1': ['A'] } },
        },
        {
          id: 'b4', typ: 'offeneVerstaendnisfrage', punkte: 10, quelleId: 'q1',
          arbeitsanweisung: 'Beantworte die Fragen.',
          config: { fragen: [{ nr: 1, frage: 'Was ist das Thema?', zeilen: 4 }] },
          loesung: { antworten: { '1': 'Medienkonsum bei Jugendlichen.' } },
        },
        {
          id: 'b5', typ: 'offeneSchreibaufgabe', punkte: 30,
          arbeitsanweisung: 'Verfasse einen Kommentar.',
          config: {
            situation: 'Du hast einen Artikel gelesen.',
            textsorte: 'Kommentar',
            umfangWorte: { min: 270, max: 330 },
            aspekte: ['Erklaere die Auswirkungen.'],
          },
          loesung: {
            musterloesung: 'Social Media beeinflusst Jugendliche...',
            erwartungshorizont: { inhalt: 'x', struktur: 'x', ausdruck: 'x', sprachrichtigkeit: 'x' },
          },
        },
        {
          id: 'b6', typ: 'markieraufgabe', punkte: 5, quelleId: 'q1',
          arbeitsanweisung: 'Markiere alle Metaphern.',
          config: { quelleId: 'q1', anweisung: 'Markiere Metaphern.' },
          loesung: { stellen: ['die Zeit rennt davon'] },
        },
      ],
    });

    const { schueler, loesung } = await renderDocument(combined);

    expect(isDocx(schueler)).toBe(true);
    expect(isDocx(loesung)).toBe(true);
    expect(schueler.length).toBeGreaterThan(1000);
    expect(loesung.length).toBeGreaterThan(1000);
    expect(schueler.equals(loesung)).toBe(false);
  });
});
