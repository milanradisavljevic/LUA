import { z } from 'zod';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

export const MetaSchema = z.object({
  stufe: z.enum(['oberstufe', 'unterstufe']),
  fach: z.enum(['deutsch', 'englisch']),
  thema: z.string().min(1),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum muss im Format YYYY-MM-DD sein'),
  klasse: z.string().min(1),
  notizen: z.string(),
});

export type Meta = z.infer<typeof MetaSchema>;

// ---------------------------------------------------------------------------
// QuellText
// ---------------------------------------------------------------------------

export const QuellTextSchema = z.object({
  id: z.string().min(1),
  titel: z.string().min(1),
  inhalt: z.string(),
  herkunft: z.object({
    typ: z.enum(['upload', 'url', 'drive']),
    ref: z.string().min(1),
  }),
});

export type QuellText = z.infer<typeof QuellTextSchema>;

// ---------------------------------------------------------------------------
// Shared block base fields
// ---------------------------------------------------------------------------

const BlockBaseSchema = z.object({
  id: z.string().min(1),
  punkte: z.number().int().positive(),
  quelleId: z.string().min(1).optional(),
  arbeitsanweisung: z.string().min(1),
  clue: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Block: lueckentext
// ---------------------------------------------------------------------------

export const LueckentextBlockSchema = BlockBaseSchema.extend({
  typ: z.literal('lueckentext'),
  config: z
    .object({
      anzahlLuecken: z.number().int().positive(),
      wortbank: z.boolean(),
      distraktoren: z.number().int().min(0),
    })
    .refine(
      (c) => !(c.wortbank && c.distraktoren < 1),
      { message: 'Wenn wortbank=true, muss distraktoren >= 1 sein' },
    ),
  loesung: z.object({
    luecken: z.array(
      z.object({ nr: z.number().int().positive(), wort: z.string().min(1) }),
    ),
  }),
});

export type LueckentextBlock = z.infer<typeof LueckentextBlockSchema>;

// ---------------------------------------------------------------------------
// Block: matching
// ---------------------------------------------------------------------------

export const MatchingBlockSchema = BlockBaseSchema.extend({
  typ: z.literal('matching'),
  config: z
    .object({
      items: z.array(z.object({ nr: z.number().int().positive(), prompt: z.string().min(1) })).min(1),
      optionen: z.array(z.object({ key: z.string().min(1), text: z.string().min(1) })),
    })
    .refine(
      (c) => c.optionen.length > c.items.length,
      { message: 'Es muss mehr Optionen als Items geben' },
    ),
  loesung: z.object({
    zuordnung: z.record(z.string(), z.string()),
  }),
});

export type MatchingBlock = z.infer<typeof MatchingBlockSchema>;

// ---------------------------------------------------------------------------
// Block: multipleChoice
// ---------------------------------------------------------------------------

export const MultipleChoiceBlockSchema = BlockBaseSchema.extend({
  typ: z.literal('multipleChoice'),
  config: z.object({
    fragen: z
      .array(
        z.object({
          nr: z.number().int().positive(),
          frage: z.string().min(1),
          optionen: z.array(z.object({ key: z.string().min(1), text: z.string().min(1) })).min(2),
          mehrfach: z.boolean(),
        }),
      )
      .min(1),
  }),
  loesung: z.object({
    antworten: z.record(z.string(), z.array(z.string().min(1))),
  }),
});

export type MultipleChoiceBlock = z.infer<typeof MultipleChoiceBlockSchema>;

// ---------------------------------------------------------------------------
// Block: offeneVerstaendnisfrage
// ---------------------------------------------------------------------------

export const OffeneVerstaendnisfrageBlockSchema = BlockBaseSchema.extend({
  typ: z.literal('offeneVerstaendnisfrage'),
  config: z.object({
    fragen: z
      .array(
        z.object({
          nr: z.number().int().positive(),
          frage: z.string().min(1),
          zeilen: z.number().int().positive(),
        }),
      )
      .min(1),
  }),
  loesung: z.object({
    antworten: z.record(z.string(), z.string().min(1)),
  }),
});

export type OffeneVerstaendnisfrageBlock = z.infer<typeof OffeneVerstaendnisfrageBlockSchema>;

// ---------------------------------------------------------------------------
// Block: offeneSchreibaufgabe
// ---------------------------------------------------------------------------

export const OffeneSchreibaufgabeBlockSchema = BlockBaseSchema.extend({
  typ: z.literal('offeneSchreibaufgabe'),
  config: z
    .object({
      situation: z.string().min(1),
      textsorte: z.string().min(1),
      umfangWorte: z.object({ min: z.number().int().positive(), max: z.number().int().positive() }),
      aspekte: z.array(z.string().min(1)).min(1),
    })
    .refine(
      (c) => c.umfangWorte.min <= c.umfangWorte.max,
      { message: 'umfangWorte.min darf nicht groesser als max sein' },
    ),
  loesung: z.object({
    musterloesung: z.string().min(1),
    erwartungshorizont: z.object({
      inhalt: z.string().min(1),
      struktur: z.string().min(1),
      ausdruck: z.string().min(1),
      sprachrichtigkeit: z.string().min(1),
    }),
  }),
});

export type OffeneSchreibaufgabeBlock = z.infer<typeof OffeneSchreibaufgabeBlockSchema>;

// ---------------------------------------------------------------------------
// Block: markieraufgabe
// ---------------------------------------------------------------------------

export const MarkieraufgabeBlockSchema = BlockBaseSchema.extend({
  typ: z.literal('markieraufgabe'),
  config: z.object({
    quelleId: z.string().min(1),
    anweisung: z.string().min(1),
  }),
  loesung: z.object({
    stellen: z.array(z.string().min(1)).min(1),
  }),
});

export type MarkieraufgabeBlock = z.infer<typeof MarkieraufgabeBlockSchema>;

// ---------------------------------------------------------------------------
// Discriminated union of all block types
// ---------------------------------------------------------------------------

export const BlockSchema = z.discriminatedUnion('typ', [
  LueckentextBlockSchema,
  MatchingBlockSchema,
  MultipleChoiceBlockSchema,
  OffeneVerstaendnisfrageBlockSchema,
  OffeneSchreibaufgabeBlockSchema,
  MarkieraufgabeBlockSchema,
]);

export type Block = z.infer<typeof BlockSchema>;

// ---------------------------------------------------------------------------
// Full Document
// ---------------------------------------------------------------------------

export const DocumentSchema = z
  .object({
    schemaVersion: z.literal('0.1.0'),
    meta: MetaSchema,
    quelltexte: z.array(QuellTextSchema).min(1),
    bloecke: z.array(BlockSchema).min(1),
  })
  .refine(
    (doc) => {
      // wortbank=true darf nur bei unterstufe vorkommen
      for (const block of doc.bloecke) {
        if (block.typ === 'lueckentext' && block.config.wortbank && doc.meta.stufe !== 'unterstufe') {
          return false;
        }
      }
      return true;
    },
    { message: 'wortbank=true ist nur bei stufe=unterstufe erlaubt' },
  );

export type DocumentV1 = z.infer<typeof DocumentSchema>;
