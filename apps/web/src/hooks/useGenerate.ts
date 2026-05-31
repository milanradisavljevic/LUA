import { useState, useCallback } from 'react';
import type { Block } from '@lehrunterlagen/schema';
import type { GenerateInput, BlockRequest } from '@lehrunterlagen/llm';
import { generateDocument } from '@lehrunterlagen/llm';
import type { AppState, AppAction } from '../lib/types';

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

function blockToRequest(block: Block): BlockRequest {
  switch (block.typ) {
    case 'lueckentext':
      return { typ: 'lueckentext', punkte: block.punkte, quelleId: block.quelleId,
        anzahlLuecken: block.config.anzahlLuecken, wortbank: block.config.wortbank,
        distraktoren: block.config.distraktoren };
    case 'matching':
      return { typ: 'matching', punkte: block.punkte, quelleId: block.quelleId,
        anzahlItems: block.config.items.length };
    case 'multipleChoice':
      return { typ: 'multipleChoice', punkte: block.punkte, quelleId: block.quelleId,
        anzahlFragen: block.config.fragen.length,
        mehrfach: block.config.fragen.some((f) => f.mehrfach) };
    case 'offeneVerstaendnisfrage':
      return { typ: 'offeneVerstaendnisfrage', punkte: block.punkte, quelleId: block.quelleId,
        anzahlFragen: block.config.fragen.length };
    case 'offeneSchreibaufgabe':
      return { typ: 'offeneSchreibaufgabe', punkte: block.punkte, quelleId: block.quelleId,
        textsorte: block.config.textsorte, situation: block.config.situation,
        umfangWorte: block.config.umfangWorte, aspekte: block.config.aspekte };
    case 'markieraufgabe':
      return { typ: 'markieraufgabe', punkte: block.punkte, quelleId: block.config.quelleId,
        anweisung: block.config.anweisung };
  }
}

export function useGenerate(dispatch: React.Dispatch<AppAction>) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (state: AppState) => {
    setGenerating(true);
    setError(null);
    dispatch({ type: 'SET_GENERIERTES_DOKUMENT', dokument: null });

    try {
      const uiProvider = state.llmProvider ?? 'claude';
      const providerId = PROVIDER_MAP[uiProvider as keyof typeof PROVIDER_MAP];
      if (!providerId) throw new Error(`Unbekannter Anbieter: ${uiProvider}`);

      const apiModel = MODEL_MAP[state.modelName] ?? state.modelName;

      const input: GenerateInput = {
        meta: state.meta,
        quelltexte: state.quelltexte,
        bloecke: state.bloecke.map(blockToRequest),
      };

      const result = await generateDocument(input, {
        provider: providerId,
        model: apiModel,
        kreativitaet: state.kreativitaet,
      });

      if (!result.ok) throw new Error(`Generierung fehlgeschlagen: ${result.fehler}`);

      dispatch({ type: 'SET_GENERIERTES_DOKUMENT', dokument: result.document });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(msg);
      return false;
    } finally {
      setGenerating(false);
    }
  }, [dispatch]);

  return { generate, generating, error };
}
