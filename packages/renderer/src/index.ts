import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LineRuleType,
  PageNumber,
  HeightRule,
  Packer,
  Paragraph,
  Tab,
  TabStopType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
  UnderlineType,
  convertMillimetersToTwip,
} from 'docx';
import type { DocumentV1, Block, QuellText } from '@lehrunterlagen/schema';
import { baueWortbank, shuffle, baueKreuzwortgitter, baueWortgitter } from '@lehrunterlagen/schema';

// ---------------------------------------------------------------------------
// House style constants (DESIGN.md §7, non-negotiable)
// ---------------------------------------------------------------------------

const FONT = 'Arial';

// Font sizes in half-points (docx unit)
const SZ = { body: 22, h1: 28, h2: 24, h3: 22 } as const;

// Margins in twips (1 cm = 566.93 twips)
const MARGIN = {
  top:    Math.round(2.0 * 566.93),
  bottom: Math.round(2.0 * 566.93),
  left:   Math.round(2.2 * 566.93),
  right:  Math.round(2.2 * 566.93),
};

// Nutzbare Textbreite (A4 = 11906 twips minus Seitenränder) — für rechtsbündige Tab-Stops.
const CONTENT_WIDTH = 11906 - MARGIN.left - MARGIN.right;

// Colors
const COLOR = { black: '000000', gray: '595959', lightGray: 'BFBFBF' } as const;

// 9 mm line height for writing areas (in twips)
const LINE_9MM = convertMillimetersToTwip(9);

// Thin border (0.5 pt = 4 eighths of a point)
const THIN_BORDER = { style: BorderStyle.SINGLE, size: 4, color: COLOR.black } as const;

// Invisible border for non-bordered cells
const NO_BORDER = { style: BorderStyle.NIL, size: 0, color: 'FFFFFF' } as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RenderResult {
  schueler: Buffer;
  loesung: Buffer;
}

export interface RenderResultBlobs {
  schueler: Blob;
  loesung: Blob;
}


// ---------------------------------------------------------------------------
// Korrekturraster types (lokal, spiegelt packages/qa/src/korrekturraster/types.ts)
// Kein Import aus qa — qa → renderer-Abhaengigkeit wuerde Kreis erzeugen.
// ---------------------------------------------------------------------------

export interface RasterKriterium {
  kriterium: string;
  beschreibung: string;
  maxPunkte: number;
  erreichtePunkte: number | null;
  anmerkung: string;
}

export interface RasterBlock {
  blockId: string;
  blockNr: number;
  typ: string;
  aufgabeLabel: string;
  kriterien: RasterKriterium[];
  maxPunkte: number;
}

export interface Notenstufe {
  note: 1 | 2 | 3 | 4 | 5;
  bezeichnung: string;
  minProzent: number;
  maxProzent: number;
  minPunkte: number;
  maxPunkte: number;
}

export interface KorrekturrasterDokument {
  meta: { fach: string; stufe: string; thema: string; datum: string; klasse: string };
  bloecke: RasterBlock[];
  gesamtPunkte: number;
  notenschluessel: Notenstufe[];
}

export async function renderDocument(doc: DocumentV1): Promise<RenderResult> {
  const [schueler, loesung] = await Promise.all([
    buildDocxPacked(Packer.toBuffer.bind(Packer), doc, 'schueler'),
    buildDocxPacked(Packer.toBuffer.bind(Packer), doc, 'loesung'),
  ]);
  return { schueler, loesung };
}

/** Browser-native export — returns Blobs suitable for URL.createObjectURL(). */
export async function renderDocumentToBlobs(doc: DocumentV1): Promise<RenderResultBlobs> {
  const [schueler, loesung] = await Promise.all([
    buildDocxPacked(Packer.toBlob.bind(Packer), doc, 'schueler'),
    buildDocxPacked(Packer.toBlob.bind(Packer), doc, 'loesung'),
  ]);
  return { schueler, loesung };
}

// ---------------------------------------------------------------------------
// Korrekturraster: Drittes Dokument (Lehrerinstrument)
// ---------------------------------------------------------------------------

export async function renderRaster(raster: KorrekturrasterDokument): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [
    ...buildRasterHeader(raster),
    ...raster.bloecke.flatMap((block) => buildRasterBlock(block)),
    buildGesamtzeile(raster.gesamtPunkte),
    buildNotenschluessel(raster.notenschluessel),
    ...buildFreitextfeld(),
  ];

  const document = new Document({
    sections: [
      {
        properties: { page: { margin: MARGIN } },
        headers: { default: buildPageHeader() },
        footers: { default: buildPageFooter() },
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
}

function buildRasterHeader(raster: Pick<KorrekturrasterDokument, 'meta'>): (Paragraph | Table)[] {
  const fachLabel = raster.meta.fach.charAt(0).toUpperCase() + raster.meta.fach.slice(1);
  const stufeLabel = raster.meta.stufe === 'oberstufe' ? 'Oberstufe' : 'Unterstufe';

  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        run(`Korrekturraster — ${fachLabel} — ${raster.meta.thema}`, {
          font: FONT, size: SZ.h1, bold: true,
        }),
      ],
    }),
    new Paragraph({
      children: [
        run(
          `${stufeLabel} · Klasse ${raster.meta.klasse} · ${formatDatum(raster.meta.datum)}`,
          { font: FONT, size: SZ.body, color: COLOR.gray },
        ),
      ],
      spacing: { after: 200 },
    }),
    // Kopfzeile: Klasse / Name / Datum
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
              width: { size: 15, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [run('Klasse:', { font: FONT, size: SZ.body })] })],
            }),
            new TableCell({
              borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: NO_BORDER, right: THIN_BORDER },
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [run('', { font: FONT, size: SZ.body })] })],
            }),
            new TableCell({
              borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: NO_BORDER, right: THIN_BORDER },
              width: { size: 12, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [run('Name:', { font: FONT, size: SZ.body })] })],
            }),
            new TableCell({
              borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: NO_BORDER, right: THIN_BORDER },
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [run('', { font: FONT, size: SZ.body })] })],
            }),
            new TableCell({
              borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: NO_BORDER, right: THIN_BORDER },
              width: { size: 12, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [run('Datum:', { font: FONT, size: SZ.body })] })],
            }),
            new TableCell({
              borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: NO_BORDER, right: THIN_BORDER },
              width: { size: 18, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [run('', { font: FONT, size: SZ.body })] })],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
  ];
}

function buildRasterBlock(block: RasterBlock): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];

  result.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        run(`${block.aufgabeLabel}  (${block.maxPunkte} ${block.maxPunkte === 1 ? 'Punkt' : 'Punkte'})`, {
          font: FONT, size: SZ.h2, bold: true,
        }),
      ],
      spacing: { before: 240, after: 100 },
    }),
  );

  // Kriterien-Tabelle
  const headerRow = new TableRow({
    children: ['Kriterium', 'Beschreibung', 'Max.', 'Erreicht', 'Anmerkung'].map(
      (text, i) =>
        new TableCell({
          borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
          width: { size: [30, 40, 12, 10, 8][i] ?? 30, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              children: [run(text, { font: FONT, size: SZ.body, bold: true })],
            }),
          ],
        }),
    ),
  });

  const dataRows = block.kriterien.map(
    (k) =>
      new TableRow({
        children: [
          new TableCell({
            borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [run(k.kriterium, { font: FONT, size: SZ.body })] })],
          }),
          new TableCell({
            borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [run(k.beschreibung, { font: FONT, size: SZ.body })] })],
          }),
          new TableCell({
            borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
            width: { size: 12, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run(String(k.maxPunkte), { font: FONT, size: SZ.body })] })],
          }),
          new TableCell({
            borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [run('', { font: FONT, size: SZ.body })] })],
          }),
          new TableCell({
            borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
            width: { size: 8, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [run('', { font: FONT, size: SZ.body })] })],
          }),
        ],
      }),
  );

  result.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    }),
  );

  return result;
}

function buildGesamtzeile(gesamtPunkte: number): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
      insideHorizontal: NO_BORDER, insideVertical: NO_BORDER,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: THIN_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
            width: { size: 12, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [run('Gesamt:', { font: FONT, size: SZ.body, bold: true })] })],
          }),
          new TableCell({
            borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run('', { font: FONT, size: SZ.body })] })],
          }),
          new TableCell({
            borders: { top: { style: BorderStyle.NIL, size: 0, color: 'FFFFFF' }, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [run(`/ ${gesamtPunkte} Punkte`, { font: FONT, size: SZ.body, bold: true })] })],
          }),
          new TableCell({
            borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
            width: { size: 48, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [] })],
          }),
        ],
      }),
    ],
  });
}

function buildNotenschluessel(noten: Notenstufe[]): Table {
  const headerRow = new TableRow({
    children: ['Note', 'Bezeichnung', 'Punktebereich'].map(
      (text) =>
        new TableCell({
          borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [run(text, { font: FONT, size: SZ.body, bold: true })],
            }),
          ],
        }),
    ),
  });

  const dataRows = noten.map(
    (n) =>
      new TableRow({
        children: [
          new TableCell({
            borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run(String(n.note), { font: FONT, size: SZ.body })] })],
          }),
          new TableCell({
            borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
            children: [new Paragraph({ children: [run(n.bezeichnung, { font: FONT, size: SZ.body })] })],
          }),
          new TableCell({
            borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run(`${n.minPunkte}–${n.maxPunkte}`, { font: FONT, size: SZ.body })] })],
          }),
        ],
      }),
  );

  return new Table({
    width: { size: 60, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

function buildFreitextfeld(): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [
    new Paragraph({
      children: [run('Allgemeine Anmerkungen:', { font: FONT, size: SZ.body, bold: true })],
      spacing: { before: 240, after: 80 },
    }),
  ];

  for (let i = 0; i < 4; i++) {
    result.push(writingLine(i < 3));
  }

  return result;
}

// ---------------------------------------------------------------------------
// Document builder
// ---------------------------------------------------------------------------

type Mode = 'schueler' | 'loesung';

async function buildDocxPacked<T>(
  packer: (doc: Document) => Promise<T>,
  doc: DocumentV1,
  mode: Mode,
): Promise<T> {
  const quelltextMap = new Map<string, QuellText>(
    doc.quelltexte.map((q) => [q.id, q]),
  );

  const children: (Paragraph | Table)[] = [
    ...buildDocumentHeader(doc, mode),
    buildSchuelerkopf(doc.meta),
    ...buildPunkteUebersicht(doc.bloecke),
    ...buildQuelltexte(doc.quelltexte),
    ...doc.bloecke.flatMap((block, i) =>
      buildBlock(block, i + 1, mode, quelltextMap),
    ),
  ];

  const document = new Document({
    sections: [
      {
        properties: { page: { margin: MARGIN } },
        headers: { default: buildPageHeader() },
        footers: { default: buildPageFooter() },
        children,
      },
    ],
  });

  return packer(document);
}

// ---------------------------------------------------------------------------
// Page header / footer
// ---------------------------------------------------------------------------

function buildPageHeader(): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          run('', { font: FONT, size: SZ.body, color: COLOR.gray }),
        ],
        spacing: { after: 0 },
      }),
    ],
  });
}

function buildPageFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          run('Seite ', { font: FONT, size: SZ.body, color: COLOR.gray }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: FONT, size: SZ.body, color: COLOR.gray,
          }),
        ],
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Document title area
// ---------------------------------------------------------------------------

function buildDocumentHeader(doc: DocumentV1, mode: Mode): Paragraph[] {
  const { meta } = doc;
  const fachLabel = meta.fach.charAt(0).toUpperCase() + meta.fach.slice(1);
  const stufeLabel = meta.stufe === 'oberstufe' ? 'Oberstufe' : 'Unterstufe';
  const modeLabel = mode === 'loesung' ? ' – Lösungsfassung' : '';

  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        run(`${fachLabel} – ${meta.thema}${modeLabel}`, {
          font: FONT, size: SZ.h1, bold: true,
        }),
      ],
    }),
    new Paragraph({
      children: [
        run(
          `${stufeLabel} · Klasse ${meta.klasse} · ${formatDatum(meta.datum)}` +
            (meta.notizen ? `  |  ${meta.notizen}` : ''),
          { font: FONT, size: SZ.body, color: COLOR.gray },
        ),
      ],
      spacing: { after: 200 },
    }),
  ];
}

// ---------------------------------------------------------------------------
// Schülerkopf (Name / Klasse / Datum) — DESIGN.md §7
// ---------------------------------------------------------------------------

function buildSchuelerkopf(meta: DocumentV1['meta']): Table {
  const cellBorder = {
    top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER,
  };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorder,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  run('Name: ', { font: FONT, size: SZ.body, bold: true }),
                  blankLine(28),
                  run('     Klasse: ', { font: FONT, size: SZ.body, bold: true }),
                  run(meta.klasse, { font: FONT, size: SZ.body }),
                  run('     Datum: ', { font: FONT, size: SZ.body, bold: true }),
                  run(formatDatum(meta.datum), { font: FONT, size: SZ.body }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Aufgabenübersicht (Punkte je Aufgabe, Gesamtsumme, Note/Unterschrift)
// ---------------------------------------------------------------------------

function buildPunkteUebersicht(bloecke: Block[]): (Paragraph | Table)[] {
  if (bloecke.length === 0) return [];

  const cellBorder = {
    top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER,
  };
  const gesamt = bloecke.reduce((sum, b) => sum + b.punkte, 0);

  const headerCell = (text: string, width: number, align?: typeof AlignmentType[keyof typeof AlignmentType]) =>
    new TableCell({
      borders: cellBorder,
      width: { size: width, type: WidthType.PERCENTAGE },
      shading: { fill: 'D9D9D9' },
      margins: { top: 40, bottom: 40, left: 100, right: 100 },
      children: [new Paragraph({ ...(align ? { alignment: align } : {}), children: [run(text, { font: FONT, size: SZ.body, bold: true })] })],
    });

  const cell = (children: TextRun[], width: number, align?: typeof AlignmentType[keyof typeof AlignmentType], bold = false) =>
    new TableCell({
      borders: cellBorder,
      width: { size: width, type: WidthType.PERCENTAGE },
      margins: { top: 40, bottom: 40, left: 100, right: 100 },
      ...(bold ? { shading: { fill: 'F2F2F2' } } : {}),
      children: [new Paragraph({ ...(align ? { alignment: align } : {}), children })],
    });

  const rows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('Nr.', 10),
        headerCell('Aufgabe', 65),
        headerCell('Punkte', 25, AlignmentType.RIGHT),
      ],
    }),
  ];

  bloecke.forEach((b, i) => {
    rows.push(
      new TableRow({
        children: [
          cell([run(String(i + 1), { font: FONT, size: SZ.body })], 10),
          cell([run(BLOCK_LABELS[b.typ], { font: FONT, size: SZ.body })], 65),
          cell([blankLine(6), run(` / ${b.punkte}`, { font: FONT, size: SZ.body })], 25, AlignmentType.RIGHT),
        ],
      }),
    );
  });

  rows.push(
    new TableRow({
      children: [
        cell([run('', { font: FONT, size: SZ.body })], 10, undefined, true),
        cell([run('GESAMT', { font: FONT, size: SZ.body, bold: true })], 65, undefined, true),
        cell([blankLine(6), run(` / ${gesamt}`, { font: FONT, size: SZ.body, bold: true })], 25, AlignmentType.RIGHT, true),
      ],
    }),
  );

  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      keepNext: true,
      children: [run('Aufgabenübersicht', { font: FONT, size: SZ.h3, bold: true })],
      spacing: { before: 160, after: 80 },
    }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
    new Paragraph({
      children: [
        run('Note: ', { font: FONT, size: SZ.body, bold: true }),
        blankLine(20),
        run('     Unterschrift: ', { font: FONT, size: SZ.body, bold: true }),
        blankLine(24),
      ],
      spacing: { before: 120, after: 80 },
    }),
  ];
}

// ---------------------------------------------------------------------------
// Quelltexte section
// ---------------------------------------------------------------------------

// Wandelt einen Quelltext (mit \n-Zeilen und \n\n-Absätzen/Strophen) in echte
// Absatz-Paragraphen um. docx ignoriert \n innerhalb einer TextRun — Zeilenumbrüche
// brauchen TextRun({ break: 1 }), Strophen-/Absatzabstand kommt über eigene Paragraphen.
function quelltextAbsaetze(inhalt: string): Paragraph[] {
  const absaetze = inhalt
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((a) => a.replace(/\s+$/g, ''))
    .filter((a) => a.trim().length > 0);

  // Fallback: kein verwertbarer Inhalt → ein leerer Absatz, damit die Struktur stimmt.
  if (absaetze.length === 0) {
    return [new Paragraph({ children: [run('', { font: FONT, size: SZ.body })] })];
  }

  return absaetze.map((absatz) => {
    const zeilen = absatz.split('\n');
    const children = zeilen.map(
      (zeile, i) =>
        new TextRun({
          text: zeile,
          font: FONT,
          size: SZ.body,
          ...(i > 0 ? { break: 1 } : {}),
        }),
    );
    return new Paragraph({
      children,
      spacing: { after: 160 },
      indent: { left: 360 },
      border: {
        left: { style: BorderStyle.SINGLE, size: 8, color: COLOR.lightGray },
      },
    });
  });
}

function buildQuelltexte(quelltexte: QuellText[]): (Paragraph | Table)[] {
  if (quelltexte.length === 0) return [];

  const result: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        run(quelltexte.length === 1 ? 'Quelltext' : 'Quelltexte', {
          font: FONT, size: SZ.h2, bold: true,
        }),
      ],
      spacing: { before: 200, after: 120 },
    }),
  ];

  for (const [i, qt] of quelltexte.entries()) {
    result.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        keepNext: true,
        children: [
          run(`Text ${i + 1}: ${qt.titel || `Quelltext ${i + 1}`}`, { font: FONT, size: SZ.h3, bold: true }),
        ],
        spacing: { before: 120, after: qt.herkunft.ref ? 20 : 80 },
      }),
    );
    // Quellenangabe nur, wenn es eine echte Referenz gibt (nicht bei Direkteingabe).
    if (qt.herkunft.ref) {
      result.push(
        new Paragraph({
          keepNext: true,
          children: [run(`nach: ${qt.herkunft.ref}`, { font: FONT, size: SZ.body, italics: true, color: COLOR.gray })],
          spacing: { after: 80 },
        }),
      );
    }
    result.push(...quelltextAbsaetze(qt.inhalt));
  }

  return result;
}

// ---------------------------------------------------------------------------
// Block dispatcher
// ---------------------------------------------------------------------------

const BLOCK_LABELS: Record<Block['typ'], string> = {
  lueckentext: 'Lückentext',
  matching: 'Zuordnung',
  multipleChoice: 'Multiple Choice',
  offeneVerstaendnisfrage: 'Verständnisfragen',
  offeneSchreibaufgabe: 'Schreibaufgabe',
  markieraufgabe: 'Markieraufgabe',
  wordScramble: 'Wörter ordnen',
  kategorisierung: 'Kategorisierung',
  tabelle: 'Tabelle',
  stiluebung: 'Stilübung',
  songanalyse: 'Songanalyse',
  kreuzwortraetsel: 'Kreuzworträtsel',
  wortgitter: 'Wortgitter',
};

function buildBlock(
  block: Block,
  index: number,
  mode: Mode,
  quelltextMap: Map<string, QuellText>,
): (Paragraph | Table)[] {
  const label = BLOCK_LABELS[block.typ];
  const result: (Paragraph | Table)[] = [
    // Gerahmtes Abschnitts-Banner: Titel links, Punkte-Eintragefeld rechtsbündig (___ / X).
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      keepNext: true,
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
      border: {
        top:    { style: BorderStyle.SINGLE, size: 6, color: COLOR.black },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR.black },
      },
      spacing: { before: 280, after: 120 },
      children: [
        run(`Aufgabe ${index}  –  ${label}`, {
          font: FONT, size: SZ.h2, bold: true,
        }),
        new TextRun({ children: [new Tab()], font: FONT, size: SZ.body }),
        blankLine(5),
        run(` / ${block.punkte}`, { font: FONT, size: SZ.body }),
      ],
    }),
    new Paragraph({
      keepNext: true,
      children: [run(block.arbeitsanweisung, { font: FONT, size: SZ.body, bold: true })],
      spacing: { after: 100 },
    }),
  ];

  if (block.clue) {
    result.push(
      new Paragraph({
        keepNext: true,
        children: [
          run(`(${block.clue})`, { font: FONT, size: SZ.body, italics: true, color: COLOR.gray }),
        ],
        spacing: { after: 80 },
      }),
    );
  }

  switch (block.typ) {
    case 'lueckentext':
      result.push(...buildLueckentext(block, mode));
      break;
    case 'matching':
      result.push(...buildMatching(block, mode));
      break;
    case 'multipleChoice':
      result.push(...buildMultipleChoice(block, mode));
      break;
    case 'offeneVerstaendnisfrage':
      result.push(...buildOffeneVerstaendnisfrage(block, mode));
      break;
    case 'offeneSchreibaufgabe':
      result.push(...buildOffeneSchreibaufgabe(block, mode));
      break;
    case 'markieraufgabe':
      result.push(...buildMarkieraufgabe(block, mode, quelltextMap));
      break;
    case 'wordScramble':
      result.push(...buildWordScramble(block, mode));
      break;
    case 'kategorisierung':
      result.push(...buildKategorisierung(block, mode));
      break;
    case 'tabelle':
      result.push(...buildTabelle(block, mode));
      break;
    case 'stiluebung':
      result.push(...buildStiluebung(block, mode));
      break;
    case 'songanalyse':
      result.push(...buildSonganalyse(block, mode));
      break;
    case 'kreuzwortraetsel':
      result.push(...buildKreuzwortraetsel(block, mode));
      break;
    case 'wortgitter':
      result.push(...buildWortgitter(block, mode));
      break;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Block: lueckentext
// ---------------------------------------------------------------------------

function buildLueckentext(
  block: Extract<Block, { typ: 'lueckentext' }>,
  mode: Mode,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];

  // Wenn der LLM einen Text mit Luecken geliefert hat, zeige diesen an.
  // Ansonsten Fallback auf nummerierte Luecken.
  const hasText = block.text && block.text.length > 0;

  if (hasText) {
    // Text mit Luecken anzeigen — die Luecken sind als (1), (2) im Text
    const text = block.text!;
    if (mode === 'schueler') {
      result.push(
        new Paragraph({
          children: [run(text, { font: FONT, size: SZ.body })],
          spacing: { after: 120 },
        }),
      );
    } else {
      // Loesungs-Modus: Ersetze (1), (2) durch die tatsaechlichen Woerter
      let solutionText = text;
      for (const l of block.loesung.luecken) {
        solutionText = solutionText.replace(`(${l.nr})`, `(${l.nr}) ${l.wort}`);
      }
      result.push(
        new Paragraph({
          indent: { left: 360 },
          children: [run(solutionText, { font: FONT, size: SZ.body, italics: true })],
          spacing: { after: 120 },
        }),
      );
    }
  }

  if (mode === 'schueler') {
    // Numbered blanks in rows (Fallback wenn kein text vorhanden, oder zusaetzlich)
    const blanks = Array.from({ length: block.config.anzahlLuecken }, (_, i) => i + 1);
    const rows: TableRow[] = chunkArray(blanks, 4).map(
      (rowNums) =>
        new TableRow({
          children: rowNums.map((nr) =>
            new TableCell({
              borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
              children: [
                new Paragraph({
                  children: [
                    run(`(${nr})  `, { font: FONT, size: SZ.body }),
                    blankLine(80),
                  ],
                  spacing: { after: 120 },
                }),
              ],
            }),
          ),
        }),
    );

    result.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
          insideHorizontal: NO_BORDER, insideVertical: NO_BORDER,
        },
        rows,
      }),
    );

    // Word bank for Unterstufe
    if (block.config.wortbank) {
      const loesungsWoerter = block.loesung.luecken.map((l) => l.wort);
      const distraktoren = block.config.distraktorWoerter ?? [];
      const bank = distraktoren.length > 0
        ? baueWortbank(loesungsWoerter, distraktoren, block.id)
        : loesungsWoerter;
      result.push(
        new Paragraph({
          children: [
            run('Wortbank:  ', { font: FONT, size: SZ.body, bold: true }),
            run(bank.join('  |  '), { font: FONT, size: SZ.body }),
          ],
          spacing: { before: 80, after: 80 },
        }),
      );
    }
  } else if (!hasText) {
    // Solution mode without text: numbered answers in italics
    const pairs = block.loesung.luecken
      .map((l) => `(${l.nr}) ${l.wort}`)
      .join('     ');
    result.push(
      new Paragraph({
        indent: { left: 360 },
        children: [run(pairs, { font: FONT, size: SZ.body, italics: true })],
        spacing: { after: 120 },
      }),
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// Block: matching
// ---------------------------------------------------------------------------

function buildMatching(
  block: Extract<Block, { typ: 'matching' }>,
  mode: Mode,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];

  // Items table + options table side by side
  const optionsTable = new Table({
    width: { size: 48, type: WidthType.PERCENTAGE },
    borders: {
      top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
      insideHorizontal: NO_BORDER, insideVertical: NO_BORDER,
    },
    rows: block.config.optionen.map(
      (opt) =>
        new TableRow({
          children: [
            new TableCell({
              borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
              children: [
                new Paragraph({
                  children: [
                    run(`${opt.key}  `, { font: FONT, size: SZ.body, bold: true }),
                    run(opt.text, { font: FONT, size: SZ.body }),
                  ],
                  spacing: { after: 60 },
                }),
              ],
            }),
          ],
        }),
    ),
  });

  const answerRows = block.config.items.map((item) => {
    const solutionKey = block.loesung.zuordnung[String(item.nr)];
    return new TableRow({
      children: [
        new TableCell({
          borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
          width: { size: 70, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              children: [
                run(`${item.nr}.  `, { font: FONT, size: SZ.body, bold: true }),
                run(item.prompt, { font: FONT, size: SZ.body }),
              ],
              spacing: { after: 60 },
            }),
          ],
        }),
        new TableCell({
          borders: {
            top: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
            bottom: THIN_BORDER,
          },
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              children:
                mode === 'loesung' && solutionKey
                  ? [run(`→  ${solutionKey}`, { font: FONT, size: SZ.body, italics: true })]
                  : [run('→  ', { font: FONT, size: SZ.body })],
              spacing: { after: 60 },
            }),
          ],
        }),
      ],
    });
  });

  result.push(
    new Paragraph({
      keepNext: true,
      children: [run('Optionen:', { font: FONT, size: SZ.body, bold: true })],
      spacing: { after: 80 },
    }),
    optionsTable,
    new Paragraph({
      keepNext: true,
      children: [run('Deine Zuordnung:', { font: FONT, size: SZ.body, bold: true })],
      spacing: { before: 160, after: 80 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
        insideHorizontal: NO_BORDER, insideVertical: NO_BORDER,
      },
      rows: answerRows,
    }),
  );

  return result;
}

// ---------------------------------------------------------------------------
// Block: multipleChoice
// ---------------------------------------------------------------------------

function buildMultipleChoice(
  block: Extract<Block, { typ: 'multipleChoice' }>,
  mode: Mode,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];

  for (const frage of block.config.fragen) {
    const correctKeys = block.loesung.antworten[String(frage.nr)] ?? [];
    result.push(
      new Paragraph({
        keepNext: true,
        children: [
          run(`${frage.nr}.  `, { font: FONT, size: SZ.body, bold: true }),
          run(frage.frage, { font: FONT, size: SZ.body }),
          frage.mehrfach
            ? run('  (Mehrfachantwort möglich)', { font: FONT, size: SZ.body, italics: true, color: COLOR.gray })
            : new TextRun(''),
        ],
        spacing: { before: 80, after: 60 },
      }),
    );

    for (const opt of frage.optionen) {
      const isCorrect = correctKeys.includes(opt.key);
      const marker = mode === 'loesung' && isCorrect ? '☑' : '☐';
      result.push(
        new Paragraph({
          keepNext: true,
          indent: { left: 360 },
          children: [
            run(`${marker}  ${opt.key}  `, {
              font: FONT, size: SZ.body, bold: mode === 'loesung' && isCorrect,
            }),
            run(opt.text, {
              font: FONT, size: SZ.body,
              italics: mode === 'loesung' && isCorrect,
              bold: mode === 'loesung' && isCorrect,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Block: offeneVerstaendnisfrage
// ---------------------------------------------------------------------------

function buildOffeneVerstaendnisfrage(
  block: Extract<Block, { typ: 'offeneVerstaendnisfrage' }>,
  mode: Mode,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];

  for (const frage of block.config.fragen) {
    const musterantwort = block.loesung.antworten[String(frage.nr)];
    result.push(
      new Paragraph({
        keepNext: true,
        children: [
          run(`${frage.nr}.  `, { font: FONT, size: SZ.body, bold: true }),
          run(frage.frage, { font: FONT, size: SZ.body }),
        ],
        spacing: { before: 80, after: 60 },
      }),
    );

    if (mode === 'schueler') {
      for (let i = 0; i < frage.zeilen; i++) {
        result.push(writingLine(i < frage.zeilen - 1));
      }
    } else {
      result.push(
        new Paragraph({
          indent: { left: 360 },
          children: [run(musterantwort ?? '', { font: FONT, size: SZ.body, italics: true })],
          spacing: { after: 120 },
        }),
      );
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Block: offeneSchreibaufgabe
// ---------------------------------------------------------------------------

function buildOffeneSchreibaufgabe(
  block: Extract<Block, { typ: 'offeneSchreibaufgabe' }>,
  mode: Mode,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];
  const cfg = block.config;

  result.push(
    new Paragraph({
      keepNext: true,
      children: [
        run('Situation:  ', { font: FONT, size: SZ.body, bold: true }),
        run(cfg.situation, { font: FONT, size: SZ.body }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      keepNext: true,
      children: [
        run('Textsorte:  ', { font: FONT, size: SZ.body, bold: true }),
        run(cfg.textsorte, { font: FONT, size: SZ.body }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      keepNext: true,
      children: [
        run('Umfang:  ', { font: FONT, size: SZ.body, bold: true }),
        run(`${cfg.umfangWorte.min}–${cfg.umfangWorte.max} Wörter`, { font: FONT, size: SZ.body }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      keepNext: true,
      children: [run('Aspekte:', { font: FONT, size: SZ.body, bold: true })],
      spacing: { after: 40 },
    }),
  );

  for (const [i, aspekt] of cfg.aspekte.entries()) {
    result.push(
      new Paragraph({
        keepNext: true,
        indent: { left: 360 },
        children: [
          run(`${i + 1}.  `, { font: FONT, size: SZ.body }),
          run(aspekt, { font: FONT, size: SZ.body }),
        ],
        spacing: { after: 40 },
      }),
    );
  }

  if (mode === 'schueler') {
    const lineCount = Math.ceil(cfg.umfangWorte.max / 10);
    for (let i = 0; i < lineCount; i++) {
      result.push(writingLine(i < lineCount - 1));
    }
  } else {
    result.push(
      new Paragraph({
        indent: { left: 360 },
        children: [run(block.loesung.musterloesung, { font: FONT, size: SZ.body, italics: true })],
        spacing: { before: 120, after: 120 },
      }),
    );

    const eh = block.loesung.erwartungshorizont;
    result.push(
      new Paragraph({
        keepNext: true,
        children: [run('Erwartungshorizont:', { font: FONT, size: SZ.body, bold: true })],
        spacing: { before: 120, after: 60 },
      }),
      buildEH(eh),
    );
  }

  return result;
}

function buildEH(
  eh: { inhalt: string; struktur: string; ausdruck: string; sprachrichtigkeit: string },
): Table {
  const rows = (
    [
      ['Inhalt', eh.inhalt],
      ['Struktur', eh.struktur],
      ['Ausdruck', eh.ausdruck],
      ['Sprachrichtigkeit', eh.sprachrichtigkeit],
    ] as [string, string][]
  ).map(
    ([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: THIN_BORDER, bottom: THIN_BORDER,
              left: THIN_BORDER, right: THIN_BORDER,
            },
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [run(label, { font: FONT, size: SZ.body, bold: true })],
              }),
            ],
          }),
          new TableCell({
            borders: {
              top: THIN_BORDER, bottom: THIN_BORDER,
              left: THIN_BORDER, right: THIN_BORDER,
            },
            width: { size: 75, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [run(value, { font: FONT, size: SZ.body, italics: true })],
              }),
            ],
          }),
        ],
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

// ---------------------------------------------------------------------------
// Block: markieraufgabe
// ---------------------------------------------------------------------------

function buildMarkieraufgabe(
  block: Extract<Block, { typ: 'markieraufgabe' }>,
  mode: Mode,
  quelltextMap: Map<string, QuellText>,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];
  const quelle = quelltextMap.get(block.config.quelleId);

  if (quelle) {
    result.push(
      new Paragraph({
        keepNext: true,
        children: mehrzeiligRuns(quelle.inhalt, { font: FONT, size: SZ.body }),
        spacing: { after: 120 },
        border: {
          left: { style: BorderStyle.SINGLE, size: 8, color: COLOR.lightGray },
        },
        indent: { left: 360 },
      }),
    );
  }

  if (mode === 'loesung') {
    result.push(
      new Paragraph({
        keepNext: true,
        children: [run('Zu markierende Stellen:', { font: FONT, size: SZ.body, bold: true })],
        spacing: { before: 80, after: 40 },
      }),
    );
    for (const stelle of block.loesung.stellen) {
      result.push(
        new Paragraph({
          indent: { left: 360 },
          children: [run(`– ${stelle}`, { font: FONT, size: SZ.body, italics: true })],
          spacing: { after: 40 },
        }),
      );
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Block: wordScramble
// ---------------------------------------------------------------------------

function buildWordScramble(
  block: Extract<Block, { typ: 'wordScramble' }>,
  mode: Mode,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];
  const woerter = block.config.wort.split(/\s+/).filter((w) => w.length > 0);

  if (mode === 'schueler') {
    // Deterministisch (seed = block.id): Schüler- und Lösungsblatt bleiben konsistent.
    const gemischt = shuffle(woerter, block.id);
    result.push(
      new Paragraph({
        children: [
          run('Begriffe (durcheinander):  ', { font: FONT, size: SZ.body, bold: true }),
          run(gemischt.join('  |  '), { font: FONT, size: SZ.body }),
        ],
        spacing: { after: 120 },
      }),
    );
    result.push(
      new Paragraph({
        children: [run('Satz (richtige Reihenfolge):', { font: FONT, size: SZ.body, bold: true })],
        spacing: { after: 60 },
      }),
    );
    for (let i = 0; i < block.config.anzahlWoerter; i++) {
      result.push(writingLine(true));
    }
  } else {
    result.push(
      new Paragraph({
        children: [
          run('Korrekte Anordnung:  ', { font: FONT, size: SZ.body, bold: true }),
          run(block.loesung.korrektAnordnung.join(' '), { font: FONT, size: SZ.body, italics: true }),
        ],
        spacing: { after: 80 },
      }),
    );
    result.push(
      new Paragraph({
        children: [
          run('Reihenfolge:  ', { font: FONT, size: SZ.body, bold: true }),
          run(block.config.loesungsreihenfolge.join(' → '), { font: FONT, size: SZ.body, italics: true }),
        ],
        spacing: { after: 80 },
      }),
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// Block: kategorisierung
// ---------------------------------------------------------------------------

function buildKategorisierung(
  block: Extract<Block, { typ: 'kategorisierung' }>,
  mode: Mode,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];

  const cellBorder = {
    top: THIN_BORDER, bottom: THIN_BORDER,
    left: THIN_BORDER, right: THIN_BORDER,
  };

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: cellBorder,
        width: { size: 50, type: WidthType.PERCENTAGE },
        shading: { fill: 'D9D9D9' },
        children: [new Paragraph({ children: [run('Begriff', { font: FONT, size: SZ.body, bold: true })] })],
      }),
      new TableCell({
        borders: cellBorder,
        width: { size: 50, type: WidthType.PERCENTAGE },
        shading: { fill: 'D9D9D9' },
        children: [new Paragraph({ children: [run('Kategorie', { font: FONT, size: SZ.body, bold: true })] })],
      }),
    ],
  });

  const rows: TableRow[] = [headerRow];
  for (const item of block.config.items) {
    const kategorieName = mode === 'loesung' ? (block.loesung.zuordnung[String(item.nr)] ?? []).join(', ') : '';
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorder,
            children: [new Paragraph({ children: [run(item.text, { font: FONT, size: SZ.body })] })],
          }),
          new TableCell({
            borders: cellBorder,
            children: [new Paragraph({ children: [run(kategorieName, { font: FONT, size: SZ.body, italics: mode === 'loesung' })] })],
          }),
        ],
      }),
    );
  }

  result.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    }),
  );

  if (mode === 'schueler') {
    result.push(
      new Paragraph({
        children: [run('Verfügbare Kategorien:  ' + block.config.kategorien.map((k) => k.name).join(', '), { font: FONT, size: SZ.body, italics: true, color: COLOR.gray })],
        spacing: { before: 80, after: 40 },
      }),
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// Block: tabelle
// ---------------------------------------------------------------------------

function buildTabelle(
  block: Extract<Block, { typ: 'tabelle' }>,
  mode: Mode,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];

  const cellBorder = {
    top: THIN_BORDER, bottom: THIN_BORDER,
    left: THIN_BORDER, right: THIN_BORDER,
  };

  const headerRow = new TableRow({
    tableHeader: true,
    children: block.config.spalten.map((s) =>
      new TableCell({
        borders: cellBorder,
        width: { size: s.breiteProzent, type: WidthType.PERCENTAGE },
        shading: { fill: 'D9D9D9' },
        children: [new Paragraph({ children: [run(s.titel, { font: FONT, size: SZ.body, bold: true })] })],
      }),
    ),
  });

  const rows: TableRow[] = [headerRow];
  for (const zeile of block.config.zeilen) {
    rows.push(
      new TableRow({
        children: zeile.zellen.map((zelle, spaltenIndex) => {
          let text = '';
          let istLuecke = false;
          if ('text' in zelle) {
            text = zelle.text;
          } else {
            // Lücke: im Schüler leer (Unterstrich-Hinweis), in der Lösung der korrekte Wert.
            istLuecke = true;
            text = mode === 'loesung'
              ? (block.loesung.zellen[`${zeile.nr},${spaltenIndex}`] ?? '')
              : '__________';
          }
          return new TableCell({
            borders: cellBorder,
            children: [new Paragraph({ children: [run(text, { font: FONT, size: SZ.body, italics: istLuecke && mode === 'loesung' })] })],
          });
        }),
      }),
    );
  }

  result.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    }),
  );

  return result;
}

// ---------------------------------------------------------------------------
// Block: stiluebung
// ---------------------------------------------------------------------------

function buildStiluebung(
  block: Extract<Block, { typ: 'stiluebung' }>,
  mode: Mode,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];

  result.push(
    new Paragraph({
      keepNext: true,
      children: [
        run('Ausgangstext:', { font: FONT, size: SZ.body, bold: true }),
      ],
      spacing: { before: 80, after: 40 },
    }),
  );
  result.push(
    new Paragraph({
      keepNext: true,
      children: mehrzeiligRuns(block.config.ausgangstext, { font: FONT, size: SZ.body, italics: true, color: COLOR.gray }),
      border: { left: { style: BorderStyle.SINGLE, size: 8, color: COLOR.lightGray } },
      indent: { left: 360 },
      spacing: { after: 120 },
    }),
  );

  result.push(
    new Paragraph({
      children: [
        run('Ziel: ', { font: FONT, size: SZ.body, bold: true }),
        run(`${block.config.transformation} → ${block.config.zielniveau}`, { font: FONT, size: SZ.body }),
      ],
      spacing: { after: 100 },
    }),
  );

  if (mode === 'schueler') {
    result.push(
      new Paragraph({
        children: [run('Deine Umformulierung:', { font: FONT, size: SZ.body, bold: true })],
        spacing: { after: 60 },
      }),
    );
    for (let i = 0; i < 6; i++) {
      result.push(writingLine(true));
    }
  } else {
    result.push(
      new Paragraph({
        children: [
          run('Musterlösung:  ', { font: FONT, size: SZ.body, bold: true }),
          run(block.loesung.umformulierung, { font: FONT, size: SZ.body, italics: true }),
        ],
        spacing: { after: 80 },
      }),
    );
    result.push(
      new Paragraph({
        children: [
          run('Begründung:  ', { font: FONT, size: SZ.body, bold: true }),
          run(block.loesung.begruendung, { font: FONT, size: SZ.body, italics: true }),
        ],
        spacing: { after: 80 },
      }),
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// Block: songanalyse
// ---------------------------------------------------------------------------

function buildSonganalyse(
  block: Extract<Block, { typ: 'songanalyse' }>,
  mode: Mode,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];

  result.push(
    new Paragraph({
      keepNext: true,
      children: [
        run(`${block.config.interpret} – ${block.config.titel}`, { font: FONT, size: SZ.h3, bold: true }),
        ...(block.config.genre ? [run(`  (${block.config.genre})`, { font: FONT, size: SZ.body, italics: true, color: COLOR.gray })] : []),
      ],
      spacing: { after: 80 },
    }),
  );

  result.push(
    new Paragraph({
      keepNext: true,
      children: [run('Songtext:', { font: FONT, size: SZ.body, bold: true })],
      spacing: { after: 40 },
    }),
  );
  result.push(
    new Paragraph({
      keepNext: true,
      children: mehrzeiligRuns(block.config.lyrics, { font: FONT, size: SZ.body, italics: true, color: COLOR.gray }),
      border: { left: { style: BorderStyle.SINGLE, size: 8, color: COLOR.lightGray } },
      indent: { left: 360 },
      spacing: { after: 120 },
    }),
  );

  result.push(
    new Paragraph({
      children: [
        run('Aufgabe:  ', { font: FONT, size: SZ.body, bold: true }),
        run(block.config.aufgabe, { font: FONT, size: SZ.body }),
      ],
      spacing: { after: 100 },
    }),
  );

  if (mode === 'schueler') {
    for (let i = 0; i < 8; i++) {
      result.push(writingLine(true));
    }
  } else {
    result.push(
      new Paragraph({
        children: [
          run('Ergebnis:  ', { font: FONT, size: SZ.body, bold: true }),
          run(block.loesung.ergebnis, { font: FONT, size: SZ.body, italics: true }),
        ],
        spacing: { after: 80 },
      }),
    );
    for (const ap of block.loesung.analysepunkte) {
      result.push(
        new Paragraph({
          children: [
            run(`• ${ap.aspekt}:  `, { font: FONT, size: SZ.body, bold: true }),
            run(ap.befund, { font: FONT, size: SZ.body, italics: true }),
            ...(ap.zitat ? [run(`  („${ap.zitat}")`, { font: FONT, size: SZ.body, italics: true, color: COLOR.gray })] : []),
          ],
          spacing: { after: 40 },
        }),
      );
    }
    if (block.loesung.zitate.length > 0) {
      result.push(
        new Paragraph({
          children: [
            run('Wichtige Zitate:  ', { font: FONT, size: SZ.body, bold: true }),
            run(block.loesung.zitate.map((z) => `„${z}"`).join('; '), { font: FONT, size: SZ.body, italics: true }),
          ],
          spacing: { before: 80, after: 60 },
        }),
      );
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Block: kreuzwortraetsel
// ---------------------------------------------------------------------------

function buildKreuzwortraetsel(
  block: Extract<Block, { typ: 'kreuzwortraetsel' }>,
  mode: Mode,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];
  const gitter = baueKreuzwortgitter(block.config.eintraege);
  if (gitter.zeilen === 0) return result;

  const CELL = 460; // twips (~0.8 cm) je Zelle
  const cellBorder = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };
  const leerBorder = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };

  const rows: TableRow[] = [];
  for (let r = 0; r < gitter.zeilen; r++) {
    const cells: TableCell[] = [];
    for (let c = 0; c < gitter.spalten; c++) {
      const letter = gitter.belegung[r]?.[c] ?? null;
      const num = gitter.nummern[r]?.[c] ?? null;
      if (letter === null) {
        cells.push(new TableCell({
          width: { size: CELL, type: WidthType.DXA },
          borders: leerBorder,
          children: [new Paragraph({ children: [] })],
        }));
        continue;
      }
      const kinder: TextRun[] = [];
      if (num !== null) {
        kinder.push(new TextRun({ text: String(num), font: FONT, size: 12, superScript: true }));
      }
      // Schülerfassung: Feld leer (nur Nummer). Lösungsfassung: Buchstabe sichtbar.
      if (mode === 'loesung') {
        if (num !== null) kinder.push(new TextRun({ text: ' ', font: FONT, size: SZ.body }));
        kinder.push(run(letter, { font: FONT, size: SZ.body, bold: true }));
      }
      cells.push(new TableCell({
        width: { size: CELL, type: WidthType.DXA },
        borders: cellBorder,
        margins: { top: 20, bottom: 20, left: 40, right: 40 },
        children: [new Paragraph({ children: kinder })],
      }));
    }
    rows.push(new TableRow({ height: { value: CELL, rule: HeightRule.ATLEAST }, children: cells }));
  }

  result.push(new Table({
    rows,
    columnWidths: Array<number>(gitter.spalten).fill(CELL),
    layout: TableLayoutType.FIXED,
  }));

  // Hinweis-Listen unter dem Gitter.
  const waag = gitter.platzierungen.filter((p) => p.richtung === 'waagrecht');
  const senk = gitter.platzierungen.filter((p) => p.richtung === 'senkrecht');

  const hinweisListe = (titel: string, eintraege: typeof gitter.platzierungen) => {
    if (eintraege.length === 0) return;
    result.push(new Paragraph({
      keepNext: true,
      children: [run(titel, { font: FONT, size: SZ.body, bold: true })],
      spacing: { before: 120, after: 40 },
    }));
    for (const p of eintraege) {
      result.push(new Paragraph({
        indent: { left: 240 },
        children: [run(`${p.nr}. ${p.hinweis}`, { font: FONT, size: SZ.body })],
        spacing: { after: 20 },
      }));
    }
  };
  hinweisListe('Waagrecht:', waag);
  hinweisListe('Senkrecht:', senk);

  return result;
}

// ---------------------------------------------------------------------------
// Block: wortgitter
// ---------------------------------------------------------------------------

function buildWortgitter(
  block: Extract<Block, { typ: 'wortgitter' }>,
  mode: Mode,
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];
  const gitter = baueWortgitter(block.config.woerter);
  if (gitter.zeilen === 0) return result;

  // Zellen, die zu einem versteckten Wort gehören (für die Lösungs-Hervorhebung).
  const loesungsZellen = new Set<string>();
  const delta: Record<string, [number, number]> = { waagrecht: [0, 1], senkrecht: [1, 0], diagonal: [1, 1] };
  for (const p of gitter.platzierungen) {
    const [dr, dc] = delta[p.richtung]!;
    for (let n = 0; n < p.wort.length; n++) loesungsZellen.add(`${p.zeile + dr * n},${p.spalte + dc * n}`);
  }

  const CELL = 420;
  const cellBorder = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };
  const rows: TableRow[] = [];
  for (let r = 0; r < gitter.zeilen; r++) {
    const cells: TableCell[] = [];
    for (let c = 0; c < gitter.spalten; c++) {
      const letter = gitter.belegung[r]?.[c] ?? '';
      const istLoesung = mode === 'loesung' && loesungsZellen.has(`${r},${c}`);
      cells.push(new TableCell({
        width: { size: CELL, type: WidthType.DXA },
        borders: cellBorder,
        ...(istLoesung ? { shading: { fill: 'D9D9D9' } } : {}),
        margins: { top: 20, bottom: 20, left: 20, right: 20 },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [run(letter, { font: FONT, size: SZ.body, bold: istLoesung })],
        })],
      }));
    }
    rows.push(new TableRow({ height: { value: CELL, rule: HeightRule.ATLEAST }, children: cells }));
  }
  result.push(new Table({
    rows,
    columnWidths: Array<number>(gitter.spalten).fill(CELL),
    layout: TableLayoutType.FIXED,
  }));

  // Wortliste zum Suchen.
  result.push(new Paragraph({
    keepNext: true,
    children: [run('Finde diese Wörter:', { font: FONT, size: SZ.body, bold: true })],
    spacing: { before: 120, after: 40 },
  }));
  result.push(new Paragraph({
    children: [run(gitter.woerter.join('   ·   '), { font: FONT, size: SZ.body })],
    spacing: { after: 40 },
  }));

  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RunOpts {
  font: string;
  size: number;
  bold?: boolean;
  italics?: boolean;
  color?: string;
}

function run(text: string, opts: RunOpts): TextRun {
  return new TextRun({
    text,
    font: opts.font,
    size: opts.size,
    bold: opts.bold ?? false,
    italics: opts.italics ?? false,
    ...(opts.color !== undefined ? { color: opts.color } : {}),
  });
}

// Wie run(), aber erhält Zeilenumbrüche (\n) als echte docx-Umbrüche (break:1)
// statt sie zu verschlucken. Für eingebettete mehrzeilige Texte (Lyrics, Ausgangstext).
function mehrzeiligRuns(text: string, opts: RunOpts): TextRun[] {
  const zeilen = text.replace(/\r\n/g, '\n').split('\n');
  return zeilen.map(
    (zeile, i) =>
      new TextRun({
        text: zeile,
        font: opts.font,
        size: opts.size,
        bold: opts.bold ?? false,
        italics: opts.italics ?? false,
        ...(opts.color !== undefined ? { color: opts.color } : {}),
        ...(i > 0 ? { break: 1 } : {}),
      }),
  );
}

function blankLine(widthChars = 60): TextRun {
  return new TextRun({
    text: ' '.repeat(widthChars),
    font: FONT,
    size: SZ.body,
    underline: { type: UnderlineType.SINGLE, color: COLOR.black },
  });
}

function writingLine(keepNext = false): Paragraph {
  return new Paragraph({
    keepNext,
    children: [run(' ', { font: FONT, size: SZ.body })],
    spacing: {
      line: LINE_9MM,
      lineRule: LineRuleType.EXACT,
      after: 0,
    },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR.lightGray },
    },
  });
}


function formatDatum(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
