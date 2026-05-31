import type {
  GenerateInput,
  GenerateResult,
  Provider,
  ProviderConfig,
  ProviderId,
} from './types.js';
import { buildMessages, buildRepairMessage } from './prompt.js';
import { parseAndValidate } from './validate.js';
import { anthropicProvider } from './provider-anthropic.js';

export * from './types.js';
export { buildMessages } from './prompt.js';
export { parseAndValidate, extractJson } from './validate.js';

// Anbieter-Registry. Phase 2: nur Anthropic. ChatGPT und Kimi folgen in Phase 5
// (TASKS.md 5.1, 5.2) und werden hier einfach ergaenzt.
const PROVIDERS: Partial<Record<ProviderId, Provider>> = {
  anthropic: anthropicProvider,
};

export function getProvider(id: ProviderId): Provider {
  const p = PROVIDERS[id];
  if (!p) {
    throw new Error(
      `Anbieter '${id}' ist noch nicht implementiert. In Phase 2 ist nur 'anthropic' verfuegbar.`,
    );
  }
  return p;
}

/**
 * Erzeugt aus Quelltexten und Baukasten-Vorgaben ein schema-konformes Dokument.
 * Validiert die Modellantwort gegen das Zod-Schema und versucht bei Fehlern
 * einmal eine Korrektur. Das Ergebnis ist garantiert schema-konform (ok=true)
 * und kann direkt an den Renderer uebergeben werden.
 */
export async function generateDocument(
  input: GenerateInput,
  cfg: ProviderConfig,
): Promise<GenerateResult> {
  const provider = getProvider(cfg.provider);
  const messages = buildMessages(input);

  let rohText = '';
  for (let versuch = 1; versuch <= 2; versuch++) {
    rohText = await provider.complete(messages, cfg);
    const validiert = parseAndValidate(rohText);

    if (validiert.ok && validiert.document) {
      return { ok: true, document: validiert.document, rohText, versuche: versuch };
    }

    if (versuch < 2) {
      // Eine Korrekturrunde: Fehler zurueckspielen.
      messages.push({ role: 'assistant', content: rohText });
      messages.push(buildRepairMessage(rohText, validiert.fehler ?? 'unbekannter Fehler'));
    } else {
      return { ok: false, fehler: validiert.fehler ?? 'unbekannter Fehler', rohText, versuche: versuch };
    }
  }

  return { ok: false, fehler: 'Generierung fehlgeschlagen', rohText, versuche: 2 };
}
