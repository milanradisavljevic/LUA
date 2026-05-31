import { useState, useEffect, useCallback } from 'react';
import type { AppAction } from './lib/types';
import type { Meta, Block } from '@lehrunterlagen/schema';
import { useWizard } from './hooks/useWizard';
import { WizardStepper } from './components/WizardStepper';
import { Step1_Input } from './components/Step1_Input';
import { Step2_Baukasten } from './components/Step2_Baukasten';
import { Step3_LLMOptions } from './components/Step3_LLMOptions';
import { Step4_Generate } from './components/Step4_Generate';
import { TemplateManager } from './components/TemplateManager';
import { CommandPalette } from './components/CommandPalette';
import './App.css';

export default function App() {
  const { state, dispatch, goNext, goBack, currentIndex } = useWizard();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((p) => !p);
      }
      if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [paletteOpen]);

  const handlePaletteActions = useCallback((actions: AppAction | AppAction[]) => {
    const arr = Array.isArray(actions) ? actions : [actions];
    for (const action of arr) {
      if (action.type === 'REMOVE_BLOCK' && action.id === '__last__') {
        const blocks = state.bloecke;
        if (blocks.length > 0) {
          dispatch({ type: 'REMOVE_BLOCK', id: blocks[blocks.length - 1]!.id });
        }
      } else if (action.type === 'UPDATE_BLOCK' && action.id === '__last__') {
        const blocks = state.bloecke;
        if (blocks.length > 0) {
          dispatch({ type: 'UPDATE_BLOCK', id: blocks[blocks.length - 1]!.id, block: action.block });
        }
      } else if (action.type === 'SET_META' && typeof action.meta.notizen === 'string' && action.meta.notizen.startsWith('__TEMPLATE_')) {
        const parts = action.meta.notizen.split(':');
        if (parts[0] === '__TEMPLATE_SAVE' && parts[1]) {
          const name = parts.slice(1).join(':');
          try {
            const raw = localStorage.getItem('lehrunterlagen-templates');
            const templates = raw ? JSON.parse(raw) : [];
            const tpl = {
              name, meta: state.meta,
              bloecke: state.bloecke.map((b) => ({
                typ: b.typ, punkte: b.punkte,
                arbeitsanweisung: b.arbeitsanweisung, clue: b.clue, config: b.config,
              })),
              savedAt: new Date().toISOString(),
            };
            const merged = [...templates.filter((t: { name: string }) => t.name !== name), tpl];
            localStorage.setItem('lehrunterlagen-templates', JSON.stringify(merged));
          } catch { /* ignore */ }
        }
      } else {
        dispatch(action);
      }
    }
  }, [dispatch, state.bloecke, state.meta]);

  const handlePaletteExport = useCallback(() => {
    dispatch({ type: 'SET_STEP', step: 'generate' });
  }, [dispatch]);

  const handleLoadTemplate = (meta: Meta, bloecke: Block[]) => {
    dispatch({ type: 'SET_META', meta });
    for (const block of bloecke) {
      dispatch({ type: 'ADD_BLOCK', block });
    }
  };

  const renderStep = () => {
    switch (state.step) {
      case 'input':
        return <Step1_Input state={state} dispatch={dispatch} />;
      case 'baukasten':
        return <Step2_Baukasten state={state} dispatch={dispatch} />;
      case 'llm':
        return <Step3_LLMOptions state={state} dispatch={dispatch} />;
      case 'generate':
        return <Step4_Generate state={state} dispatch={dispatch} />;
    }
  };

  return (
    <div className="app">
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Lehrunterlagen-Tool</h1>
          <p className="app-subtitle">AHS Deutsch &amp; Englisch &middot; Unter- und Oberstufe</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={() => setPaletteOpen(true)}
            style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}
            title="Befehl eingeben (Ctrl+K)">
            ⌨ Befehle
          </button>
          <TemplateManager meta={state.meta} bloecke={state.bloecke} onLoad={handleLoadTemplate} />
        </div>
      </header>

      <WizardStepper currentStep={state.step} />

      <main className="app-content">
        {renderStep()}
      </main>

      <footer className="app-footer">
        {currentIndex > 0 && (
          <button className="btn-secondary" onClick={goBack}>
            Zurück
          </button>
        )}
        {currentIndex < 3 && (
          <button className="btn-primary" onClick={goNext} style={{ marginLeft: 'auto' }}>
            Weiter
          </button>
        )}
      </footer>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onActions={handlePaletteActions}
        onNavigate={(dir) => dir === 'next' ? goNext() : goBack()}
        onExport={handlePaletteExport}
        blockCount={state.bloecke.length}
      />
    </div>
  );
}
