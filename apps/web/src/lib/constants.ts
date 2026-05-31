import type { Meta } from '@lehrunterlagen/schema';

export const BLOCK_TYPE_DEFS = [
  { id: 'lueckentext' as const, label: 'Lückentext', description: 'Lücken im Text ergänzen' },
  { id: 'matching' as const, label: 'Matching', description: 'Begriffe richtig zuordnen' },
  { id: 'multipleChoice' as const, label: 'Multiple Choice', description: 'Richtige Antwort ankreuzen' },
  { id: 'offeneVerstaendnisfrage' as const, label: 'Verständnisfrage', description: 'Fragen zum Text beantworten' },
  { id: 'offeneSchreibaufgabe' as const, label: 'Schreibaufgabe', description: 'Aufsatz oder Kommentar verfassen' },
  { id: 'markieraufgabe' as const, label: 'Markieraufgabe', description: 'Textstellen markieren' },
];

export const STUFE_RULES = {
  oberstufe: {
    allowedBlockTypes: [
      'lueckentext', 'matching', 'multipleChoice',
      'offeneVerstaendnisfrage', 'offeneSchreibaufgabe', 'markieraufgabe',
    ] as const,
    wortbankAllowed: false,
  },
  unterstufe: {
    allowedBlockTypes: [
      'lueckentext', 'matching', 'multipleChoice',
      'offeneVerstaendnisfrage', 'markieraufgabe',
    ] as const,
    wortbankAllowed: true,
  },
} as const;

export function isWortbankEnabled(stufe: Meta['stufe']): boolean {
  return STUFE_RULES[stufe].wortbankAllowed;
}

export function getDefaultMeta(stufe?: Meta['stufe']): Meta {
  return {
    stufe: stufe ?? 'oberstufe',
    fach: 'deutsch',
    thema: '',
    datum: new Date().toISOString().slice(0, 10),
    klasse: '',
    notizen: '',
  };
}

export const LLM_PROVIDERS = [
  { id: 'claude' as const, label: 'Claude (Anthropic)', models: ['Opus 4.8', 'Opus 4.7', 'Sonnet 4.6', 'Haiku 4.5'] },
  { id: 'chatgpt' as const, label: 'ChatGPT (OpenAI)', models: ['GPT-4o', 'GPT-4', 'GPT-3.5'] },
  { id: 'kimi' as const, label: 'Kimi (Moonshot)', models: ['kimi-latest'] },
];
