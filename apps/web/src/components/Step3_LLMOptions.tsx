import { useState } from 'react';
import type { AppState, AppAction } from '../lib/types';
import { LLM_PROVIDERS } from '../lib/constants';
import { getModelInfo } from '../lib/models';
import { PROVIDER_LOGOS } from './ProviderLogos';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export function Step3_LLMOptions({ state, dispatch }: Props) {
  const selectedProvider = LLM_PROVIDERS.find((p) => p.id === state.llmProvider);
  const models = selectedProvider?.models ?? [];
  const modelInfo = getModelInfo(state.modelName);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div>
      <h2 style={{ marginBottom: '1.25rem' }}>KI-Modell auswählen</h2>

      {/* Anbieter-Karten nebeneinander */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {LLM_PROVIDERS.map((provider) => {
          const isSelected = state.llmProvider === provider.id;
          const Logo = PROVIDER_LOGOS[provider.id];
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              {Logo && <Logo size={28} />}
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                  {provider.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-1)' }}>
                  {provider.models.join(', ')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modell-Auswahl + Info */}
      {state.llmProvider && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <label htmlFor="model" style={{ margin: 0 }}>Modell</label>
            <button
              type="button"
              onClick={() => setShowInfo((s) => !s)}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-gray-2)',
                background: 'white',
                cursor: 'pointer',
                color: 'var(--color-accent)',
              }}
            >
              {showInfo ? 'Info ausblenden' : 'ℹ️ Modell-Info'}
            </button>
          </div>
          <select id="model" value={state.modelName}
            onChange={(e) => dispatch({ type: 'SET_MODEL_NAME', name: e.target.value })}>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Modell-Info-Panel */}
          {showInfo && modelInfo && (
            <div style={{
              marginTop: '0.75rem',
              padding: '1rem',
              background: 'var(--color-gray-3)',
              borderRadius: 'var(--radius)',
              fontSize: '0.8125rem',
              border: '1px solid var(--color-gray-2)',
            }}>
<div style={{ display: 'grid', gap: '0.5rem' }}>
                 <div>
                   <strong>Stärken:</strong>{' '}
                   {modelInfo.staerken.join(' · ')}
                 </div>
                 <div>
                   <strong>Region:</strong>{' '}
                   {modelInfo.region}
                 </div>
                 <div>
                   <strong>Datenschutz:</strong>{' '}
                   <span style={{
                     color: modelInfo.datenschutz.startsWith('⚠️')
                       ? 'var(--color-error)'
                       : modelInfo.datenschutz.includes('DSGVO')
                         ? 'var(--color-success)'
                         : '#c4a000',
                   }}>
                     {modelInfo.datenschutz.includes('DSGVO-konform') && '🟢 '}
                     {modelInfo.datenschutz.includes('keine DSGVO-Garantie') && '🟡 '}
                     {modelInfo.datenschutz.startsWith('⚠️') && '🔴 '}
                     {modelInfo.datenschutz}
                   </span>
                 </div>
                 {(modelInfo.kostenInputProMioToken > 0 || modelInfo.kostenOutputProMioToken > 0) && (
                   <div>
                     <strong>Kosten (ca.):</strong>{' '}
                     Input ${modelInfo.kostenInputProMioToken}/Mio Token · Output ${modelInfo.kostenOutputProMioToken}/Mio Token
                     <span style={{ fontSize: '0.6875rem', color: 'var(--color-gray-1)', marginLeft: '0.5rem' }}>
                       (Stand 2026-06-01)
                     </span>
                   </div>
                 )}
                 {modelInfo.kostenInputProMioToken === 0 && modelInfo.kostenOutputProMioToken === 0 && (
                   <div style={{ color: 'var(--color-gray-1)', fontStyle: 'italic' }}>
                     Preise noch nicht verifiziert — werden bei Bedarf ergänzt.
                   </div>
                 )}
               </div>
            </div>
          )}
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
