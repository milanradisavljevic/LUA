import { describe, it, expect } from 'vitest';
import { DocumentSchema } from '@lehrunterlagen/schema';

import lueckentext from './fixtures/lueckentext.json';
import matching from './fixtures/matching.json';
import multipleChoice from './fixtures/multipleChoice.json';
import offeneVerstaendnisfrage from './fixtures/offeneVerstaendnisfrage.json';
import offeneSchreibaufgabe from './fixtures/offeneSchreibaufgabe.json';
import markieraufgabe from './fixtures/markieraufgabe.json';

const fixtures = [
  { name: 'lueckentext', data: lueckentext },
  { name: 'matching', data: matching },
  { name: 'multipleChoice', data: multipleChoice },
  { name: 'offeneVerstaendnisfrage', data: offeneVerstaendnisfrage },
  { name: 'offeneSchreibaufgabe', data: offeneSchreibaufgabe },
  { name: 'markieraufgabe', data: markieraufgabe },
];

describe('Fixture-Validierung gegen DocumentSchema', () => {
  for (const { name, data } of fixtures) {
    it(`${name}: validiert gegen DocumentSchema`, () => {
      const result = DocumentSchema.safeParse(data);
      if (!result.success) {
        console.error(`${name} validation errors:`, JSON.stringify(result.error.format(), null, 2));
      }
      expect(result.success).toBe(true);
    });
  }
});

describe('Fixture-Details pruefen', () => {
  it('lueckentext hat 8 Luecken', () => {
    const doc = DocumentSchema.parse(lueckentext);
    const block = doc.bloecke[0];
    if (block.typ === 'lueckentext') {
      expect(block.config.anzahlLuecken).toBe(8);
      expect(block.loesung.luecken).toHaveLength(8);
    }
  });

  it('matching hat mehr Optionen als Items', () => {
    const doc = DocumentSchema.parse(matching);
    const block = doc.bloecke[0];
    if (block.typ === 'matching') {
      expect(block.config.optionen.length).toBeGreaterThan(block.config.items.length);
    }
  });

  it('multipleChoice: zweite Frage ist mehrfach', () => {
    const doc = DocumentSchema.parse(multipleChoice);
    const block = doc.bloecke[0];
    if (block.typ === 'multipleChoice') {
      expect(block.config.fragen[1].mehrfach).toBe(true);
    }
  });

  it('offeneVerstaendnisfrage: 2 Fragen mit Zeilen', () => {
    const doc = DocumentSchema.parse(offeneVerstaendnisfrage);
    const block = doc.bloecke[0];
    if (block.typ === 'offeneVerstaendnisfrage') {
      expect(block.config.fragen).toHaveLength(2);
      expect(block.config.fragen[0].zeilen).toBe(4);
      expect(block.config.fragen[1].zeilen).toBe(6);
    }
  });

  it('offeneSchreibaufgabe: min <= max bei umfangWorte', () => {
    const doc = DocumentSchema.parse(offeneSchreibaufgabe);
    const block = doc.bloecke[0];
    if (block.typ === 'offeneSchreibaufgabe') {
      expect(block.config.umfangWorte.min).toBeLessThanOrEqual(block.config.umfangWorte.max);
    }
  });

  it('markieraufgabe: mindestens eine Stelle', () => {
    const doc = DocumentSchema.parse(markieraufgabe);
    const block = doc.bloecke[0];
    if (block.typ === 'markieraufgabe') {
      expect(block.loesung.stellen.length).toBeGreaterThanOrEqual(1);
    }
  });
});
