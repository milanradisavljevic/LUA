import { describe, it, expect } from 'vitest';
import { baueKreuzwortgitter, type KreuzwortEintrag } from './grids.js';

const eintraege: KreuzwortEintrag[] = [
  { wort: 'HAUS', hinweis: 'Gebäude zum Wohnen' },
  { wort: 'GARTEN', hinweis: 'Grünfläche am Haus' },
  { wort: 'BAUM', hinweis: 'Pflanze mit Stamm' },
  { wort: 'TÜR', hinweis: 'Eingang' },
];

describe('baueKreuzwortgitter', () => {
  it('ist deterministisch (gleiche Eingabe → gleiches Gitter)', () => {
    const a = baueKreuzwortgitter(eintraege);
    const b = baueKreuzwortgitter(eintraege);
    expect(a).toEqual(b);
  });

  it('platziert alle (gültigen, eindeutigen) Wörter', () => {
    const g = baueKreuzwortgitter(eintraege);
    const woerter = new Set(g.platzierungen.map((p) => p.wort));
    for (const e of eintraege) expect(woerter.has(e.wort.toUpperCase())).toBe(true);
  });

  it('jede Platzierung trägt eine Nummer > 0 und einen Hinweis', () => {
    const g = baueKreuzwortgitter(eintraege);
    for (const p of g.platzierungen) {
      expect(p.nr).toBeGreaterThan(0);
      expect(p.hinweis.length).toBeGreaterThan(0);
    }
  });

  it('Buchstaben im Gitter stimmen mit den Wörtern überein', () => {
    const g = baueKreuzwortgitter(eintraege);
    for (const p of g.platzierungen) {
      for (let k = 0; k < p.wort.length; k++) {
        const r = p.zeile + (p.richtung === 'senkrecht' ? k : 0);
        const c = p.spalte + (p.richtung === 'waagrecht' ? k : 0);
        expect(g.belegung[r]?.[c]).toBe(p.wort[k]);
      }
    }
  });

  it('mindestens eine echte Kreuzung entsteht', () => {
    const g = baueKreuzwortgitter(eintraege);
    // Eine Kreuzung = eine Zelle, die zu einem waagrechten UND einem senkrechten Eintrag gehört.
    const hatWaag = g.platzierungen.some((p) => p.richtung === 'waagrecht');
    const hatSenk = g.platzierungen.some((p) => p.richtung === 'senkrecht');
    expect(hatWaag && hatSenk).toBe(true);
  });

  it('normalisiert Wörter (Großschreibung, entfernt Nicht-Buchstaben) und Dubletten', () => {
    const g = baueKreuzwortgitter([
      { wort: 'haus', hinweis: 'a' },
      { wort: 'HAUS', hinweis: 'dublette' },
      { wort: 'ba um', hinweis: 'mit Leerzeichen' },
      { wort: 'x', hinweis: 'zu kurz' },
    ]);
    const woerter = g.platzierungen.map((p) => p.wort).sort();
    expect(woerter).toEqual(['BAUM', 'HAUS']);
  });

  it('leere Eingabe → leeres Gitter', () => {
    const g = baueKreuzwortgitter([]);
    expect(g.zeilen).toBe(0);
    expect(g.platzierungen).toHaveLength(0);
  });
});
