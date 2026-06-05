import type { DocumentV1, Meta, QuellText, Block, Auftrag } from '@lehrunterlagen/schema';

export type StepId = 'absicht' | 'input' | 'baukasten' | 'llm' | 'generate';

export type LlmProvider = 'claude' | 'chatgpt' | 'kimi' | 'deepseek' | 'mistral' | 'qwen';

export interface AppState {
  step: StepId;
  auftrag: Auftrag | null;
  meta: Meta;
  quelltexte: QuellText[];
  bloecke: Block[];
  /** Vom LLM befülltes Dokument — null bis "Generieren" geklickt wurde. */
  generiertesDokument: DocumentV1 | null;
  llmProvider: LlmProvider | null;
  modelName: string;
  kreativitaet: number;
  ausgabeSprache: string;
}

export const STEPS: { id: StepId; label: string }[] = [
  { id: 'absicht', label: 'Absicht' },
  { id: 'input', label: 'Quelltexte' },
  { id: 'baukasten', label: 'Aufgabenblöcke' },
  { id: 'llm', label: 'KI-Modell' },
  { id: 'generate', label: 'Generieren' },
];

export type AppAction =
  | { type: 'SET_STEP'; step: StepId }
  | { type: 'SET_AUFTRAG'; auftrag: Auftrag | null }
  | { type: 'SET_META'; meta: Partial<Meta> }
  | { type: 'ADD_QUELLTEXT'; quelltext: QuellText }
  | { type: 'REMOVE_QUELLTEXT'; id: string }
  | { type: 'UPDATE_QUELLTEXT'; id: string; quelltext: Partial<QuellText> }
  | { type: 'ADD_BLOCK'; block: Block }
  | { type: 'UPDATE_BLOCK'; id: string; block: Partial<Block> }
  | { type: 'REMOVE_BLOCK'; id: string }
  | { type: 'REORDER_BLOCKS'; bloecke: Block[] }
  | { type: 'SET_LLM_PROVIDER'; provider: LlmProvider | null }
  | { type: 'SET_MODEL_NAME'; name: string }
  | { type: 'SET_KREATIVITAET'; value: number }
  | { type: 'SET_AUSGABE_SPRACHE'; value: string }
  | { type: 'SET_GENERIERTES_DOKUMENT'; dokument: DocumentV1 | null }
  | { type: 'UPDATE_GENERIERTER_BLOCK'; id: string; block: Partial<Block> };
