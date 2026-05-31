import { useWizard } from './hooks/useWizard';
import { WizardStepper } from './components/WizardStepper';
import { Step1_Input } from './components/Step1_Input';
import { Step2_Baukasten } from './components/Step2_Baukasten';
import { Step3_LLMOptions } from './components/Step3_LLMOptions';
import { Step4_Generate } from './components/Step4_Generate';
import { TemplateManager } from './components/TemplateManager';
import type { Meta, Block } from '@lehrunterlagen/schema';
import './App.css';

export default function App() {
  const { state, dispatch, goNext, goBack, currentIndex } = useWizard();

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
        <TemplateManager meta={state.meta} bloecke={state.bloecke} onLoad={handleLoadTemplate} />
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
    </div>
  );
}
