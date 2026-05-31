import type { StepId } from '../lib/types';
import { STEPS } from '../lib/types';

interface Props {
  currentStep: StepId;
}

export function WizardStepper({ currentStep }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav className="wizard-stepper" style={{
      display: 'flex',
      gap: '0.25rem',
      marginBottom: '1.5rem',
      padding: '0 0.25rem',
    }}>
      {STEPS.map((step, i) => {
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;
        return (
          <div key={step.id} style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 0.75rem',
            borderRadius: 'var(--radius)',
            background: isActive ? 'var(--color-accent)' : isDone ? '#e8f0fe' : 'transparent',
            color: isActive ? 'white' : isDone ? 'var(--color-accent)' : 'var(--color-gray-1)',
            fontWeight: isActive || isDone ? 600 : 400,
            fontSize: '0.8125rem',
            border: isActive ? 'none' : `1px solid ${isDone ? 'var(--color-accent)' : 'var(--color-gray-2)'}`,
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6875rem', fontWeight: 700,
              background: isActive ? 'rgba(255,255,255,0.25)' : isDone ? 'var(--color-accent)' : 'var(--color-gray-2)',
              color: isActive || isDone ? 'white' : 'white',
            }}>
              {isDone ? '✓' : i + 1}
            </span>
            <span>{step.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
