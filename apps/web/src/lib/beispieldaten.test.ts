import { describe, it, expect } from 'vitest';
import { createDefaultBlock } from './blockDefaults';
import { istNochBeispiel, beispielBloecke } from './beispieldaten';

const MIT_BEISPIEL = ['wortgitter', 'kreuzwortraetsel', 'wordScramble', 'stiluebung', 'kategorisierung', 'tabelle'] as const;
const OHNE_BEISPIEL = ['lueckentext', 'matching', 'multipleChoice', 'offeneVerstaendnisfrage', 'offeneSchreibaufgabe', 'markieraufgabe', 'songanalyse'] as const;

describe('istNochBeispiel', () => {
  it('erkennt frische Default-Bloecke mit Beispielinhalt', () => {
    for (const typ of MIT_BEISPIEL) {
      expect(istNochBeispiel(createDefaultBlock(typ))).toBe(true);
    }
  });

  it('liefert false fuer Typen ohne Beispielinhalt (leere Defaults)', () => {
    for (const typ of OHNE_BEISPIEL) {
      expect(istNochBeispiel(createDefaultBlock(typ))).toBe(false);
    }
  });

  it('liefert false, sobald der Inhalt editiert wurde', () => {
    const wg = createDefaultBlock('wortgitter');
    if (wg.typ === 'wortgitter') wg.config.woerter = ['SAUERSTOFF', 'CHLOROPHYLL'];
    expect(istNochBeispiel(wg)).toBe(false);

    const ws = createDefaultBlock('wordScramble');
    if (ws.typ === 'wordScramble') ws.config.wort = 'Die Photosynthese findet statt';
    expect(istNochBeispiel(ws)).toBe(false);
  });
});

describe('beispielBloecke', () => {
  it('liefert die IDs der noch unveraenderten Beispiel-Bloecke', () => {
    const a = createDefaultBlock('wortgitter');
    const b = createDefaultBlock('wordScramble');
    if (b.typ === 'wordScramble') b.config.wort = 'editiert hier etwas Echtes';
    const c = createDefaultBlock('multipleChoice');
    const ids = beispielBloecke([a, b, c]);
    expect(ids).toEqual([a.id]);
  });
});
