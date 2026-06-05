import type { Meta } from '@lehrunterlagen/schema';

export const BLOCK_TYPE_DEFS = [
  { id: 'lueckentext' as const, label: 'Lückentext', description: 'Lücken im Text ergänzen', icon: '✏️', color: '#e57373' },
  { id: 'matching' as const, label: 'Matching', description: 'Begriffe richtig zuordnen', icon: '⇄', color: '#64b5f6' },
  { id: 'multipleChoice' as const, label: 'Multiple Choice', description: 'Richtige Antwort ankreuzen', icon: '◉', color: '#81c784' },
  { id: 'offeneVerstaendnisfrage' as const, label: 'Verständnisfrage', description: 'Fragen zum Text beantworten', icon: '?', color: '#ffb74d' },
  { id: 'offeneSchreibaufgabe' as const, label: 'Schreibaufgabe', description: 'Aufsatz oder Kommentar verfassen', icon: '📝', color: '#ba68c8' },
  { id: 'markieraufgabe' as const, label: 'Markieraufgabe', description: 'Textstellen markieren', icon: '✦', color: '#4db6ac' },
  { id: 'wordScramble' as const, label: 'Wörter ordnen', description: 'Wörter in die richtige Reihenfolge bringen', icon: '🔀', color: '#9575cd' },
  { id: 'kategorisierung' as const, label: 'Kategorisierung', description: 'Begriffe Kategorien zuordnen', icon: '🗂', color: '#7986cb' },
  { id: 'tabelle' as const, label: 'Tabelle', description: 'Werte in eine Tabelle eintragen', icon: '⊞', color: '#5c6bc0' },
  { id: 'stiluebung' as const, label: 'Stilübung', description: 'Text in einem anderen Stil umformulieren', icon: '✒️', color: '#f06292' },
  { id: 'songanalyse' as const, label: 'Songanalyse', description: 'Songtext interpretieren', icon: '🎵', color: '#4dd0e1' },
  { id: 'kreuzwortraetsel' as const, label: 'Kreuzworträtsel', description: 'Wörter über Hinweise ins Gitter eintragen', icon: '🧩', color: '#a1887f' },
];

export const STUFE_RULES = {
  oberstufe: {
    allowedBlockTypes: [
      'lueckentext', 'matching', 'multipleChoice',
      'offeneVerstaendnisfrage', 'offeneSchreibaufgabe', 'markieraufgabe',
      'wordScramble', 'kategorisierung', 'tabelle', 'stiluebung', 'songanalyse',
    ] as const,
    wortbankAllowed: false,
  },
  unterstufe: {
    allowedBlockTypes: [
      'lueckentext', 'matching', 'multipleChoice',
      'offeneVerstaendnisfrage', 'markieraufgabe',
      'wordScramble', 'kategorisierung', 'tabelle',
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
    typ: 'schularbeit',
    schwierigkeit: 'mittel',
    lernziele: undefined,
  };
}

export const LLM_PROVIDERS = [
  { id: 'claude' as const, label: 'Claude (Anthropic)', models: ['Opus 4.8', 'Opus 4.7', 'Sonnet 4.6', 'Haiku 4.5'] },
  { id: 'chatgpt' as const, label: 'ChatGPT (OpenAI)', models: ['GPT-5.4', 'GPT-5.4 mini', 'GPT-5.4 nano'] },
  { id: 'deepseek' as const, label: 'DeepSeek', models: ['DeepSeek V4 Flash', 'DeepSeek V4 Pro'] },
  { id: 'mistral' as const, label: 'Mistral', models: ['Mistral Medium 3.5', 'Mistral Small 4'] },
  { id: 'qwen' as const, label: 'Qwen (Alibaba)', models: ['Qwen 3.7 Max', 'Qwen 3.6 Plus'] },
  { id: 'kimi' as const, label: 'Kimi (Moonshot)', models: ['Moonshot V1 8K', 'Kimi K2.6'] },
];