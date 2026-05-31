import { useState, useCallback } from 'react';
import type { DocumentV1, Block } from '@lehrunterlagen/schema';
import type { GenerateInput, BlockRequest } from '@lehrunterlagen/llm';
import { generateDocument } from '@lehrunterlagen/llm';
import type { AppState } from '../lib/types';

// ---------------------------------------------------------------------------
// Mappings: UI-Kennung -> Adapter-Kennung
// ---------------------------------------------------------------------------

const PROVIDER_MAP = {
  claude: 'anthropic',
  chatgpt: 'openai',
  kimi: 'kimi',
} as const;

const MODEL_MAP: Record<string, string> = {
  'Opus 4.8': 'claude-opus-4-8',
  'Opus 4.7': 'claude-opus-4-7',
  'Sonnet 4.6': 'claude-sonnet-4-6',
  'Haiku 4.5': 'claude-haiku-4-5-20251001',
  'GPT-4o': 'gpt-4o',
  'GPT-4': 'gpt-4',
  'GPT-3.5': 'gpt-3.5-turbo',
  'kimi-latest': 'kimi-latest',
};

// ---------------------------------------------------------------------------
// Block -> BlockRequest (Skelett mit Vorgaben, ohne Loesung)
// ---------------------------------------------------------------------------

function blockToRequest(block: Block): BlockRequest {
  switch (block.typ) {
    case 'lueckentext':
      return {
        typ: 'lueckentext',
        punkte: block.punkte,
        quelleId: block.quelleId,
        anzahlLuecken: block.config.anzahlLuecken,
        wortbank: block.config.wortbank,
        distraktoren: block.config.distraktoren,
      };
    case 'matching':
      return {
        typ: 'matching',
        punkte: block.punkte,
        quelleId: block.quelleId,
        anzahlItems: block.config.items.length,
      };
    case 'multipleChoice':
      return {
        typ: 'multipleChoice',
        punkte: block.punkte,
        quelleId: block.quelleId,
        anzahlFragen: block.config.fragen.length,
        mehrfach: block.config.fragen.some((f) => f.mehrfach),
      };
    case 'offeneVerstaendnisfrage':
      return {
        typ: 'offeneVerstaendnisfrage',
        punkte: block.punkte,
        quelleId: block.quelleId,
        anzahlFragen: block.config.fragen.length,
      };
    case 'offeneSchreibaufgabe':
      return {
        typ: 'offeneSchreibaufgabe',
        punkte: block.punkte,
        quelleId: block.quelleId,
        textsorte: block.config.textsorte,
        situation: block.config.situation,
        umfangWorte: block.config.umfangWorte,
        aspekte: block.config.aspekte,
      };
    case 'markieraufgabe':
      return {
        typ: 'markieraufgabe',
        punkte: block.punkte,
        quelleId: block.config.quelleId,
        anweisung: block.config.anweisung,
      };
  }
}

// ---------------------------------------------------------------------------
// Export-Hook
// ---------------------------------------------------------------------------

export function useExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportDocx = useCallback(async (state: AppState) => {
    setExporting(true);
    setError(null);

    try {
      // 1. Skelett-Bloecke in BlockRequests konvertieren
      const blockRequests = state.bloecke.map(blockToRequest);

      const input: GenerateInput = {
        meta: state.meta,
        quelltexte: state.quelltexte,
        bloecke: blockRequests,
      };

      // 2. Anbieter und Modell mappen
      const uiProvider = state.llmProvider ?? 'claude';
      const providerId = PROVIDER_MAP[uiProvider as keyof typeof PROVIDER_MAP];
      if (!providerId) {
        throw new Error(`Unbekannter Anbieter: ${uiProvider}`);
      }

      const apiModel = MODEL_MAP[state.modelName] ?? state.modelName;

      // 3. LLM aufrufen: Inhalt und Loesung generieren
      const result = await generateDocument(input, {
        provider: providerId,
        model: apiModel,
        kreativitaet: state.kreativitaet,
      });

      if (!result.ok) {
        throw new Error(`Generierung fehlgeschlagen: ${result.fehler}`);
      }

      const document: DocumentV1 = result.document;

      // 4. Renderer aufrufen: DocumentV1 -> 2x .docx
      const { renderDocument } = await import('@lehrunterlagen/renderer');
      const rendered = await renderDocument(document);

      downloadBuffer(rendered.schueler.buffer as ArrayBuffer, 'Schuelerfassung.docx');
      downloadBuffer(rendered.loesung.buffer as ArrayBuffer, 'Loesung.docx');

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler beim Export';
      setError(msg);
      return false;
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportDocx, exporting, error };
}

function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
