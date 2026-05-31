import type { AppState, AppAction } from '../lib/types';
import { LLM_PROVIDERS } from '../lib/constants';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export function Step3_LLMOptions({ state, dispatch }: Props) {
  const selectedProvider = LLM_PROVIDERS.find((p) => p.id === state.llmProvider);
  const models = selectedProvider?.models ?? [];

  return (
    <div>
      <h2 style={{ marginBottom: '1.25rem' }}>KI-Modell auswählen</h2>

      <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {LLM_PROVIDERS.map((provider) => (
          <label key={provider.id} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '1rem',
            border: `2px solid ${state.llmProvider === provider.id ? 'var(--color-accent)' : 'var(--color-gray-2)'}`,
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            background: state.llmProvider === provider.id ? '#e8f0fe' : 'white',
          }}>
            <input type="radio" name="llmProvider"
              checked={state.llmProvider === provider.id}
              onChange={() => {
                dispatch({ type: 'SET_LLM_PROVIDER', provider: provider.id });
                if (!provider.models.includes(state.modelName)) {
                  dispatch({ type: 'SET_MODEL_NAME', name: provider.models[0] ?? '' });
                }
              }}
              style={{ width: 'auto' }} />
            <div>
              <strong>{provider.label}</strong>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-1)', marginTop: '0.125rem' }}>
                Modelle: {provider.models.join(', ')}
              </p>
            </div>
          </label>
        ))}
      </div>

      {state.llmProvider && (
        <div>
          <label htmlFor="model">Modell</label>
          <select id="model" value={state.modelName}
            onChange={(e) => dispatch({ type: 'SET_MODEL_NAME', name: e.target.value })}>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--color-gray-3)', borderRadius: 'var(--radius)', fontSize: '0.8125rem' }}>
        <p style={{ color: 'var(--color-gray-1)' }}>
          <strong>Datenschutz-Hinweis:</strong> Die eingegebenen Quelltexte werden an den
          ausgewählten Anbieter übertragen. Kimi (Moonshot) ist ein chinesischer Anbieter –
          bitte nur für selbst verfasste, unkritische Inhalte verwenden.
          Es werden keine Schülerdaten verarbeitet.
        </p>
      </div>
    </div>
  );
}
