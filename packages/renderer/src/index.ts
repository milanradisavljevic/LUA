import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LineRuleType,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  UnderlineType,
  convertMillimetersToTwip,
} from 'docx';
import type { DocumentV1, Block, QuellText } from '@lehrunterlagen/schema';

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
// Korrekturraster types (Renderer-seitig, kein Import aus qa)
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

export interface RasterNote {
  note: 1 | 2 | 3 | 4 | 5;
  bezeichnung: string;
  minProzent: number;
  maxProzent: number;
  minPunkte: number;
  maxPunkte: number;
}

export interface RasterInput {
  meta: {
    fach: string;
    stufe: string;
    thema: string;
    datum: string;
    klasse: string;
  };
  blloecke: RasterBlock[];
  gesamtPunkte: number;
  notenschluessel: RasterNote[];
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

export async function renderRaster(raster: RasterInput): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [
    ...buildRasterHeader(raster),
    ...raster.blloecke.flatMap((block) => buildRasterBlock(block)),
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

function buildRasterHeader(raster: RasterInput): (Paragraph | Table)[] {
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
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [run('Klasse: _______', { font: FONT, size: SZ.body })] })],
            }),
            new TableCell({
              borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [run('Name: _______________________', { font: FONT, size: SZ.body })] })],
            }),
            new TableCell({
              borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
              width: { size: 27, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [run('Datum: _______', { font: FONT, size: SZ.body })] })],
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

function buildGesamtzeile(gesamtPunkte: number): Paragraph {
  return new Paragraph({
    children: [
      run(`Gesamt:  _____ / ${gesamtPunkte} Punkte`, { font: FONT, size: SZ.body, bold: true }),
    ],
    spacing: { before: 200, after: 200 },
    border: { top: { style: BorderStyle.SINGLE, size: 8, color: COLOR.black } },
  });
}

function buildNotenschluessel(noten: RasterNote[]): Table {
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
          run('Klasse ___   Name ___________________________   Datum ___________', {
            font: FONT, size: SZ.body, color: COLOR.gray,
          }),
        ],
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
// Quelltexte section
// ---------------------------------------------------------------------------

function buildQuelltexte(quelltexte: QuellText[]): (Paragraph | Table)[] {
  if (quelltexte.length === 0) return [];

  const result: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [run('Quelltexte', { font: FONT, size: SZ.h2, bold: true })],
      spacing: { before: 200, after: 120 },
    }),
  ];

  for (const [i, qt] of quelltexte.entries()) {
    result.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [
          run(`Text ${i + 1}: ${qt.titel}`, { font: FONT, size: SZ.h3, bold: true }),
        ],
        spacing: { before: 120, after: 80 },
      }),
      new Paragraph({
        children: [run(qt.inhalt, { font: FONT, size: SZ.body })],
        spacing: { after: 160 },
      }),
    );
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
};

function buildBlock(
  block: Block,
  index: number,
  mode: Mode,
  quelltextMap: Map<string, QuellText>,
): (Paragraph | Table)[] {
  const label = BLOCK_LABELS[block.typ];
  const result: (Paragraph | Table)[] = [
    divider(),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      keepNext: true,
      children: [
        run(`Aufgabe ${index}  –  ${label}`, {
          font: FONT, size: SZ.h2, bold: true,
        }),
        run(`   (${block.punkte} ${block.punkte === 1 ? 'Punkt' : 'Punkte'})`, {
          font: FONT, size: SZ.body, color: COLOR.gray,
        }),
      ],
      spacing: { before: 240, after: 100 },
    }),
    new Paragraph({
      keepNext: true,
      children: [run(block.arbeitsanweisung, { font: FONT, size: SZ.body, bold: true })],
      spacing: { after: 80 },
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

  if (mode === 'schueler') {
    // Numbered blanks in rows
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
      const allWords = block.loesung.luecken.map((l) => l.wort);
      // Add distraktoren placeholders (in real use the LLM fills these)
      result.push(
        new Paragraph({
          children: [
            run('Wortbank:  ', { font: FONT, size: SZ.body, bold: true }),
            run(allWords.join('  |  '), { font: FONT, size: SZ.body }),
          ],
          spacing: { before: 80, after: 80 },
        }),
      );
    }
  } else {
    // Solution mode: numbered answers in italics
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
        children: [run(quelle.inhalt, { font: FONT, size: SZ.body })],
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

function divider(): Paragraph {
  return new Paragraph({
    children: [],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR.lightGray },
    },
    spacing: { before: 80, after: 80 },
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
