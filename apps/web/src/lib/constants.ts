import type { Meta, Block } from '@lehrunterlagen/schema';
import type { LucideIcon } from 'lucide-react';
import {
  Pencil, ArrowLeftRight, CircleDot, HelpCircle, PenLine, Highlighter,
  Shuffle, FolderTree, Table, Feather, Music, Puzzle, Grid3x3,
} from 'lucide-react';

export const BLOCK_TYPE_DEFS: {
  id: Block['typ']; label: string; description: string; Icon: LucideIcon; color: string;
}[] = [
  { id: 'lueckentext', label: 'Lückentext', description: 'Lücken im Text ergänzen', Icon: Pencil, color: '#e57373' },
  { id: 'matching', label: 'Matching', description: 'Begriffe richtig zuordnen', Icon: ArrowLeftRight, color: '#64b5f6' },
  { id: 'multipleChoice', label: 'Multiple Choice', description: 'Richtige Antwort ankreuzen', Icon: CircleDot, color: '#81c784' },
  { id: 'offeneVerstaendnisfrage', label: 'Verständnisfrage', description: 'Fragen zum Text beantworten', Icon: HelpCircle, color: '#ffb74d' },
  { id: 'offeneSchreibaufgabe', label: 'Schreibaufgabe', description: 'Aufsatz oder Kommentar verfassen', Icon: PenLine, color: '#ba68c8' },
  { id: 'markieraufgabe', label: 'Markieraufgabe', description: 'Textstellen markieren', Icon: Highlighter, color: '#4db6ac' },
  { id: 'wordScramble', label: 'Wörter ordnen', description: 'Wörter in die richtige Reihenfolge bringen', Icon: Shuffle, color: '#9575cd' },
  { id: 'kategorisierung', label: 'Kategorisierung', description: 'Begriffe Kategorien zuordnen', Icon: FolderTree, color: '#7986cb' },
  { id: 'tabelle', label: 'Tabelle', description: 'Werte in eine Tabelle eintragen', Icon: Table, color: '#5c6bc0' },
  { id: 'stiluebung', label: 'Stilübung', description: 'Text in einem anderen Stil umformulieren', Icon: Feather, color: '#f06292' },
  { id: 'songanalyse', label: 'Songanalyse', description: 'Songtext interpretieren', Icon: Music, color: '#4dd0e1' },
  { id: 'kreuzwortraetsel', label: 'Kreuzworträtsel', description: 'Wörter über Hinweise ins Gitter eintragen', Icon: Puzzle, color: '#a1887f' },
  { id: 'wortgitter', label: 'Wortgitter', description: 'Versteckte Wörter im Buchstabengitter finden', Icon: Grid3x3, color: '#90a4ae' },
];

export const STUFE_RULES = {
  oberstufe: {
    allowedBlockTypes: [
      'lueckentext', 'matching', 'multipleChoice',
      'offeneVerstaendnisfrage', 'offeneSchreibaufgabe', 'markieraufgabe',
      'wordScramble', 'kategorisierung', 'tabelle', 'stiluebung', 'songanalyse',
      'kreuzwortraetsel', 'wortgitter',
    ] as const,
    wortbankAllowed: false,
  },
  unterstufe: {
    allowedBlockTypes: [
      'lueckentext', 'matching', 'multipleChoice',
      'offeneVerstaendnisfrage', 'markieraufgabe',
      'wordScramble', 'kategorisierung', 'tabelle',
      'kreuzwortraetsel', 'wortgitter',
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