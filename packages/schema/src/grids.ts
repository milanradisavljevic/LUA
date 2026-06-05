// Deterministischer Kreuzworträtsel-Generator.
//
// Leitprinzip: Das LLM liefert nur INHALT (Wort + Hinweis). Das LAYOUT (Gitter,
// Platzierung, Nummerierung) baut dieser Code — rein deterministisch aus der
// Wortliste (keine Zufallsquelle), damit Renderer (DOCX) und Web-Vorschau
// garantiert dasselbe Gitter zeigen.

export type Richtung = 'waagrecht' | 'senkrecht';

export interface KreuzwortEintrag {
  wort: string;
  hinweis: string;
}

export interface KreuzwortPlatzierung {
  nr: number;
  wort: string;
  hinweis: string;
  richtung: Richtung;
  zeile: number; // 0-basiert, normalisiert
  spalte: number;
}

export interface Kreuzwortgitter {
  zeilen: number;
  spalten: number;
  /** belegung[r][c] = Großbuchstabe oder null (Blockfeld). */
  belegung: (string | null)[][];
  /** nummern[r][c] = Startnummer eines Eintrags an dieser Zelle, sonst null. */
  nummern: (number | null)[][];
  /** Alle platzierten Einträge, sortiert nach nr (waagrecht vor senkrecht). */
  platzierungen: KreuzwortPlatzierung[];
}

interface Dir { dr: number; dc: number; richtung: Richtung; }
const WAAG: Dir = { dr: 0, dc: 1, richtung: 'waagrecht' };
const SENK: Dir = { dr: 1, dc: 0, richtung: 'senkrecht' };

interface Placed { wort: string; hinweis: string; r: number; c: number; dir: Dir; }

/** Nur Buchstaben, Großschreibung; deutsche Umlaute/ß bleiben erhalten. */
export function normalisiereWort(w: string): string {
  return w.toUpperCase().replace(/[^A-ZÄÖÜß]/g, '');
}

export function baueKreuzwortgitter(eintraege: KreuzwortEintrag[]): Kreuzwortgitter {
  // 1. normalisieren, zu kurze entfernen, Dubletten raus (deterministisch erste behalten)
  const seen = new Set<string>();
  const uniq: KreuzwortEintrag[] = [];
  for (const e of eintraege) {
    const wort = normalisiereWort(e.wort);
    if (wort.length < 2 || seen.has(wort)) continue;
    seen.add(wort);
    uniq.push({ wort, hinweis: e.hinweis });
  }
  // 2. deterministische Reihenfolge: längste zuerst, dann alphabetisch
  uniq.sort((a, b) => b.wort.length - a.wort.length || (a.wort < b.wort ? -1 : a.wort > b.wort ? 1 : 0));

  if (uniq.length === 0) {
    return { zeilen: 0, spalten: 0, belegung: [], nummern: [], platzierungen: [] };
  }

  const grid = new Map<string, string>();
  const key = (r: number, c: number) => `${r},${c}`;
  const at = (r: number, c: number) => grid.get(key(r, c));
  const placed: Placed[] = [];

  function canPlace(wort: string, r: number, c: number, dir: Dir): { ok: boolean; crossings: number } {
    const { dr, dc } = dir;
    // Zelle direkt vor dem Start und nach dem Ende muss frei sein (kein Zusammenkleben).
    if (at(r - dr, c - dc) !== undefined) return { ok: false, crossings: 0 };
    if (at(r + dr * wort.length, c + dc * wort.length) !== undefined) return { ok: false, crossings: 0 };
    const pr = dir === WAAG ? 1 : 0; // senkrecht zur Laufrichtung
    const pc = dir === WAAG ? 0 : 1;
    let crossings = 0;
    for (let k = 0; k < wort.length; k++) {
      const rr = r + dr * k, cc = c + dc * k;
      const cur = at(rr, cc);
      if (cur !== undefined) {
        if (cur !== wort[k]) return { ok: false, crossings: 0 };
        crossings++; // gültige Kreuzung
      } else {
        // Neue Zelle: senkrechte Nachbarn müssen frei sein (kein paralleles Ankleben).
        if (at(rr - pr, cc - pc) !== undefined) return { ok: false, crossings: 0 };
        if (at(rr + pr, cc + pc) !== undefined) return { ok: false, crossings: 0 };
      }
    }
    return { ok: true, crossings };
  }

  function doPlace(wort: string, hinweis: string, r: number, c: number, dir: Dir) {
    for (let k = 0; k < wort.length; k++) grid.set(key(r + dir.dr * k, c + dir.dc * k), wort[k]!);
    placed.push({ wort, hinweis, r, c, dir });
  }

  doPlace(uniq[0]!.wort, uniq[0]!.hinweis, 0, 0, WAAG);

  for (let i = 1; i < uniq.length; i++) {
    const { wort, hinweis } = uniq[i]!;
    let found: { r: number; c: number; dir: Dir } | null = null;
    // Erste gültige kreuzende Platzierung in deterministischer Scan-Reihenfolge.
    outer:
    for (const p of placed) {
      for (let pk = 0; pk < p.wort.length; pk++) {
        const pr = p.r + p.dir.dr * pk;
        const pc = p.c + p.dir.dc * pk;
        const letter = p.wort[pk]!;
        const dir = p.dir === WAAG ? SENK : WAAG;
        for (let k = 0; k < wort.length; k++) {
          if (wort[k] !== letter) continue;
          const r = pr - dir.dr * k;
          const c = pc - dir.dc * k;
          const res = canPlace(wort, r, c, dir);
          if (res.ok && res.crossings >= 1) { found = { r, c, dir }; break outer; }
        }
      }
    }
    if (found) {
      doPlace(wort, hinweis, found.r, found.c, found.dir);
    } else {
      // Kein Kreuz möglich → unterhalb von allem separat platzieren (Wort geht nicht verloren).
      let maxR = -Infinity;
      for (const k of grid.keys()) maxR = Math.max(maxR, Number(k.split(',')[0]));
      doPlace(wort, hinweis, maxR + 2, 0, WAAG);
    }
  }

  // Koordinaten auf 0-basiert normalisieren.
  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const k of grid.keys()) {
    const [r, c] = k.split(',').map(Number) as [number, number];
    minR = Math.min(minR, r); minC = Math.min(minC, c);
    maxR = Math.max(maxR, r); maxC = Math.max(maxC, c);
  }
  const zeilen = maxR - minR + 1;
  const spalten = maxC - minC + 1;
  const belegung: (string | null)[][] = Array.from({ length: zeilen }, () => Array<string | null>(spalten).fill(null));
  for (const [k, v] of grid.entries()) {
    const [r, c] = k.split(',').map(Number) as [number, number];
    belegung[r - minR]![c - minC] = v;
  }

  // Nummerierung (Standard-Kreuzwort): Zelle bekommt Nummer, wenn dort ein
  // waagrechter und/oder senkrechter Eintrag beginnt.
  const occ = (r: number, c: number) => r >= 0 && r < zeilen && c >= 0 && c < spalten && belegung[r]![c] !== null;
  const nummern: (number | null)[][] = Array.from({ length: zeilen }, () => Array<number | null>(spalten).fill(null));
  const startNr = new Map<string, number>();
  let nr = 0;
  for (let r = 0; r < zeilen; r++) {
    for (let c = 0; c < spalten; c++) {
      if (!occ(r, c)) continue;
      const startWaag = !occ(r, c - 1) && occ(r, c + 1);
      const startSenk = !occ(r - 1, c) && occ(r + 1, c);
      if (startWaag || startSenk) {
        nr++;
        nummern[r]![c] = nr;
        startNr.set(`${r},${c}`, nr);
      }
    }
  }

  const platzierungen: KreuzwortPlatzierung[] = placed
    .map((p) => {
      const zeile = p.r - minR;
      const spalte = p.c - minC;
      return {
        nr: startNr.get(`${zeile},${spalte}`) ?? 0,
        wort: p.wort, hinweis: p.hinweis, richtung: p.dir.richtung, zeile, spalte,
      };
    })
    .sort((a, b) => a.nr - b.nr || (a.richtung === b.richtung ? 0 : a.richtung === 'waagrecht' ? -1 : 1));

  return { zeilen, spalten, belegung, nummern, platzierungen };
}
