import { useWizard } from './hooks/useWizard';
import { WizardStepper } from './components/WizardStepper';
import { Step1_Input } from './components/Step1_Input';
import { Step2_Baukasten } from './components/Step2_Baukasten';
import { Step3_LLMOptions } from './components/Step3_LLMOptions';
import { Step4_Generate } from './components/Step4_Generate';
import './App.css';

export default function App() {
  const { state, dispatch, goNext, goBack, currentIndex } = useWizard();

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
      <header className="app-header">
        <h1>Lehrunterlagen-Tool</h1>
        <p className="app-subtitle">AHS Deutsch &amp; Englisch &middot; Unter- und Oberstufe</p>
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
