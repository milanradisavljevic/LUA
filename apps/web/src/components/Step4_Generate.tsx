import type { AppState, AppAction } from '../lib/types';
import { getBlockLabel } from '../lib/blockDefaults';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export function Step4_Generate({ state }: Props) {
  const canGenerate = state.quelltexte.length > 0 && state.bloecke.length > 0 && state.llmProvider;

  return (
    <div>
      <h2 style={{ marginBottom: '1.25rem' }}>Generieren &amp; Export</h2>

      <div style={{
        padding: '1rem', border: '1px solid var(--color-gray-2)',
        borderRadius: 'var(--radius)', marginBottom: '1.5rem',
      }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Zusammenfassung</h3>
        <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '0.375rem 0.5rem', color: 'var(--color-gray-1)', width: 140 }}>Fach / Stufe</td>
              <td style={{ padding: '0.375rem 0.5rem' }}>{state.meta.fach === 'deutsch' ? 'Deutsch' : 'Englisch'} &middot; {state.meta.stufe === 'oberstufe' ? 'Oberstufe' : 'Unterstufe'}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.375rem 0.5rem', color: 'var(--color-gray-1)' }}>Thema</td>
              <td style={{ padding: '0.375rem 0.5rem' }}>{state.meta.thema || '—'}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.375rem 0.5rem', color: 'var(--color-gray-1)' }}>Quelltexte</td>
              <td style={{ padding: '0.375rem 0.5rem' }}>{state.quelltexte.length}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.375rem 0.5rem', color: 'var(--color-gray-1)' }}>Aufgabenblöcke</td>
              <td style={{ padding: '0.375rem 0.5rem' }}>
                {state.bloecke.map((b) => getBlockLabel(b.typ)).join(', ') || '—'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '0.375rem 0.5rem', color: 'var(--color-gray-1)' }}>Gesamtpunkte</td>
              <td style={{ padding: '0.375rem 0.5rem' }}>{state.bloecke.reduce((s, b) => s + b.punkte, 0)}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.375rem 0.5rem', color: 'var(--color-gray-1)' }}>KI-Modell</td>
              <td style={{ padding: '0.375rem 0.5rem' }}>{state.llmProvider ? `${state.llmProvider} (${state.modelName})` : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {!canGenerate ? (
        <p style={{ color: 'var(--color-gray-1)', textAlign: 'center', padding: '2rem' }}>
          Bitte füge Quelltexte hinzu, erstelle Aufgabenblöcke und wähle ein KI-Modell aus,
          bevor du generierst.
        </p>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--color-gray-1)' }}>
            Die LLM-Integration ist in Phase 2 vorgesehen. Sobald der Renderer und die
            LLM-Adapter fertig sind, werden hier zwei Word-Dokumente generiert:
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn-primary" disabled style={{ padding: '0.75rem 2rem' }}>
              Schülerversion.docx
            </button>
            <button className="btn-primary" disabled style={{ padding: '0.75rem 2rem' }}>
              Lösung.docx
            </button>
          </div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-gray-1)' }}>
            (Schaltflächen erscheinen, sobald Renderer und LLM-Adapter verfügbar sind)
          </p>
        </div>
      )}
    </div>
  );
}
