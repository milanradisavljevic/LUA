import type { DocumentV1, Meta, QuellText, Block } from '@lehrunterlagen/schema';

export type StepId = 'input' | 'baukasten' | 'llm' | 'generate';

export type LlmProvider = 'claude' | 'chatgpt' | 'kimi';

export interface AppState {
  step: StepId;
  meta: Meta;
  quelltexte: QuellText[];
  bloecke: Block[];
  llmProvider: LlmProvider | null;
  modelName: string;
}

export const STEPS: { id: StepId; label: string }[] = [
  { id: 'input', label: 'Quelltexte' },
  { id: 'baukasten', label: 'Aufgabenblöcke' },
  { id: 'llm', label: 'KI-Modell' },
  { id: 'generate', label: 'Generieren' },
];

export type AppAction =
  | { type: 'SET_STEP'; step: StepId }
  | { type: 'SET_META'; meta: Partial<Meta> }
  | { type: 'ADD_QUELLTEXT'; quelltext: QuellText }
  | { type: 'REMOVE_QUELLTEXT'; id: string }
  | { type: 'ADD_BLOCK'; block: Block }
  | { type: 'UPDATE_BLOCK'; id: string; block: Partial<Block> }
  | { type: 'REMOVE_BLOCK'; id: string }
  | { type: 'REORDER_BLOCKS'; bloecke: Block[] }
  | { type: 'SET_LLM_PROVIDER'; provider: LlmProvider | null }
  | { type: 'SET_MODEL_NAME'; name: string };
