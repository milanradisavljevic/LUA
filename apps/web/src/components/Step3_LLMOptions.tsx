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

      {/* Anbieter-Karten nebeneinander */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {LLM_PROVIDERS.map((provider) => {
          const isSelected = state.llmProvider === provider.id;
          return (
            <div
              key={provider.id}
              onClick={() => {
                dispatch({ type: 'SET_LLM_PROVIDER', provider: provider.id });
                if (!provider.models.includes(state.modelName)) {
                  dispatch({ type: 'SET_MODEL_NAME', name: provider.models[0] ?? '' });
                }
              }}
              style={{
                padding: '1rem',
                border: `2px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-gray-2)'}`,
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                background: isSelected ? 'rgba(91,91,214,0.08)' : 'white',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                {provider.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-1)' }}>
                {provider.models.join(', ')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modell-Auswahl */}
      {state.llmProvider && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="model">Modell</label>
          <select id="model" value={state.modelName}
            onChange={(e) => dispatch({ type: 'SET_MODEL_NAME', name: e.target.value })}>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {/* Kreativitaetsregler */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="kreativitaet">
          Kreativität: {Math.round(state.kreativitaet * 100)}%
        </label>
        <input
          id="kreativitaet"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={state.kreativitaet}
          onChange={(e) => dispatch({ type: 'SET_KREATIVITAET', value: parseFloat(e.target.value) })}
          style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--color-accent)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-gray-1)', marginTop: '0.25rem' }}>
          <span>Präzise</span>
          <span>Kreativ</span>
        </div>
      </div>

      {/* Ausgabesprache */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="ausgabeSprache">Ausgabesprache</label>
        <select
          id="ausgabeSprache"
          value={state.ausgabeSprache}
          onChange={(e) => dispatch({ type: 'SET_AUSGABE_SPRACHE', value: e.target.value })}
        >
          <option value="de">Deutsch</option>
          <option value="en">Englisch</option>
        </select>
      </div>

      {/* Datenschutz-Hinweis */}
      <div style={{ padding: '1rem', background: 'var(--color-gray-3)', borderRadius: 'var(--radius)', fontSize: '0.8125rem' }}>
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
