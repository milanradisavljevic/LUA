import type { Block } from '@lehrunterlagen/schema';

/**
 * Erkennt, ob ein Block noch die unveränderten Beispieldaten aus
 * `createDefaultBlock` (blockDefaults.ts) trägt. Solche Blöcke werden im
 * UI ausgegraut ("Beispiel — wird beim Generieren ersetzt") und lösen vor
 * dem Export eine Warnung aus, damit keine Platzhalter wie HAUS/BAUM ins
 * Echtdokument geraten.
 *
 * Bewusst Schema-frei: kein zusätzliches Feld am Block (Zod bleibt unberührt).
 * Wir vergleichen die inhaltlichen Kernfelder mit den bekannten Default-Werten.
 * Nur Blocktypen mit konkretem Beispielinhalt werden geprüft; Typen, deren
 * Default leer ist (z. B. multipleChoice, matching), liefern immer `false`.
 */

function arrGleich(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

export function istNochBeispiel(block: Block): boolean {
  switch (block.typ) {
    case 'wortgitter':
      return arrGleich(block.config.woerter, ['HAUS', 'GARTEN', 'BAUM', 'BLUME']);

    case 'kreuzwortraetsel': {
      const e = block.config.eintraege;
      return (
        e.length === 2 &&
        e[0]?.wort === 'HAUS' &&
        e[1]?.wort === 'BAUM'
      );
    }

    case 'wordScramble':
      return block.config.wort === 'Der Hund läuft im Park';

    case 'stiluebung':
      return block.config.ausgangstext === 'Der Typ war echt cool drauf.';

    case 'kategorisierung': {
      const items = block.config.items;
      const kat = block.config.kategorien;
      return (
        items[0]?.text === 'Begriff A' &&
        items[1]?.text === 'Begriff B' &&
        kat[0]?.name === 'Kategorie 1' &&
        kat[1]?.name === 'Kategorie 2'
      );
    }

    case 'tabelle': {
      const sp = block.config.spalten;
      return sp[0]?.titel === 'Spalte 1' && sp[1]?.titel === 'Spalte 2';
    }

    default:
      // lueckentext, matching, multipleChoice, offeneVerstaendnisfrage,
      // offeneSchreibaufgabe, markieraufgabe, songanalyse: Default ist leer.
      return false;
  }
}

/** Liefert die IDs aller Blöcke, die noch Beispieldaten tragen. */
export function beispielBloecke(bloecke: readonly Block[]): string[] {
  return bloecke.filter(istNochBeispiel).map((b) => b.id);
}
