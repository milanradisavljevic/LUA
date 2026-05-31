import type { DocumentV1, Meta, QuellText } from '@lehrunterlagen/schema';
import { renderDocument, renderRaster } from '@lehrunterlagen/renderer';
import { generateDocument, type BlockRequest, type ProviderConfig } from '@lehrunterlagen/llm';
import { buildRaster } from './korrekturraster/builder';

export interface GlueInput {
  meta: Meta;
  quelltexte: QuellText[];
  bloecke: BlockRequest[];
}

export interface GlueOk {
  ok: true;
  schueler: Buffer;
  loesung: Buffer;
  raster: Buffer;
  document: DocumentV1;
  versuche: number;
}

export interface GlueError {
  ok: false;
  fehler: string;
  versuche: number;
}

export type GlueResult = GlueOk | GlueError;

/**
 * End-to-end-Pipeline: Quelltexte + Baukasten-Vorgaben -> LLM -> Validierung -> 3x .docx
 */
export async function runPipeline(
  input: GlueInput,
  cfg: ProviderConfig,
): Promise<GlueResult> {
  let gen;
  try {
    gen = await generateDocument(input, cfg);
  } catch (e) {
    return { ok: false, fehler: (e as Error).message, versuche: 0 };
  }

  if (!gen.ok) {
    return { ok: false, fehler: gen.fehler, versuche: gen.versuche };
  }

  const rasterData = buildRaster(gen.document);
  const [docResult, rasterBuf] = await Promise.all([
    renderDocument(gen.document),
    renderRaster(rasterData),
  ]);

  return {
    ok: true,
    schueler: docResult.schueler,
    loesung: docResult.loesung,
    raster: rasterBuf,
    document: gen.document,
    versuche: gen.versuche,
  };
}
