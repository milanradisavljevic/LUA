import { useReducer, useCallback } from 'react';
import type { AppState, AppAction, StepId } from '../lib/types';
import { getDefaultMeta } from '../lib/constants';

const STEPS_ORDER: StepId[] = ['input', 'baukasten', 'llm', 'generate'];

function wizardReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_META':
      return { ...state, meta: { ...state.meta, ...action.meta } };
    case 'ADD_QUELLTEXT':
      return { ...state, quelltexte: [...state.quelltexte, action.quelltext] };
    case 'REMOVE_QUELLTEXT':
      return { ...state, quelltexte: state.quelltexte.filter((q) => q.id !== action.id) };
    case 'ADD_BLOCK':
      return { ...state, bloecke: [...state.bloecke, action.block] };
    case 'UPDATE_BLOCK':
      return {
        ...state,
        bloecke: state.bloecke.map((b) =>
          b.id === action.id ? { ...b, ...action.block } as typeof b : b,
        ),
      };
    case 'REMOVE_BLOCK':
      return { ...state, bloecke: state.bloecke.filter((b) => b.id !== action.id) };
    case 'REORDER_BLOCKS':
      return { ...state, bloecke: action.bloecke };
    case 'SET_LLM_PROVIDER':
      return { ...state, llmProvider: action.provider };
    case 'SET_MODEL_NAME':
      return { ...state, modelName: action.name };
    default:
      return state;
  }
}

const INITIAL_STATE: AppState = {
  step: 'input',
  meta: getDefaultMeta(),
  quelltexte: [],
  bloecke: [],
  llmProvider: 'claude',
  modelName: 'Haiku 4.5',
};

export function useWizard() {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);

  const currentIndex = STEPS_ORDER.indexOf(state.step);
  const canGoNext = currentIndex < STEPS_ORDER.length - 1;
  const canGoBack = currentIndex > 0;

  const goNext = useCallback(() => {
    if (canGoNext) {
      dispatch({ type: 'SET_STEP', step: STEPS_ORDER[currentIndex + 1]! });
    }
  }, [canGoNext, currentIndex]);

  const goBack = useCallback(() => {
    if (canGoBack) {
      dispatch({ type: 'SET_STEP', step: STEPS_ORDER[currentIndex - 1]! });
    }
  }, [canGoBack, currentIndex]);

  const goToStep = useCallback((step: StepId) => {
    dispatch({ type: 'SET_STEP', step });
  }, []);

  return { state, dispatch, goNext, goBack, goToStep, currentIndex };
}
