import { useState } from 'react';
import type { AppState, AppAction } from '../lib/types';
import { getBlockLabel } from '../lib/blockDefaults';
import { PreviewTwoColumn } from './PreviewTwoColumn';
import { useExport } from '../hooks/useExport';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export function Step4_Generate({ state, dispatch }: Props) {
  const { exportDocx, exporting, error } = useExport();
  const [showPreview, setShowPreview] = useState(false);
  const canGenerate = state.quelltexte.length > 0 && state.bloecke.length > 0;
  const canExport = canGenerate && state.bloecke.every((b) => b.arbeitsanweisung.length > 0);

  const handleExport = async () => {
    const ok = await exportDocx(state);
    if (ok) {
      setShowPreview(true);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.25rem' }}>Vorschau &amp; Export</h2>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '1rem', marginBottom: '1.5rem',
      }}>
        <div style={{
          padding: '1rem', border: '1px solid var(--color-gray-2)',
          borderRadius: 'var(--radius)',
        }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.8125rem' }}>Zusammenfassung</h3>
          <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '0.25rem 0.5rem', color: 'var(--color-gray-1)', width: 100 }}>Thema</td>
                <td style={{ padding: '0.25rem 0.5rem' }}>{state.meta.thema || '—'}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.25rem 0.5rem', color: 'var(--color-gray-1)' }}>Fach / Stufe</td>
                <td style={{ padding: '0.25rem 0.5rem' }}>
                  {state.meta.fach === 'deutsch' ? 'Deutsch' : 'Englisch'}
                  &nbsp;&middot; {state.meta.stufe === 'oberstufe' ? 'Oberstufe' : 'Unterstufe'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '0.25rem 0.5rem', color: 'var(--color-gray-1)' }}>Blöcke</td>
                <td style={{ padding: '0.25rem 0.5rem' }}>
                  {state.bloecke.map((b) => getBlockLabel(b.typ)).join(', ') || '—'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '0.25rem 0.5rem', color: 'var(--color-gray-1)' }}>Gesamtpunkte</td>
                <td style={{ padding: '0.25rem 0.5rem' }}>
                  <strong>{state.bloecke.reduce((s, b) => s + b.punkte, 0)}</strong>
                </td>
              </tr>
              {state.llmProvider && (
                <tr>
                  <td style={{ padding: '0.25rem 0.5rem', color: 'var(--color-gray-1)' }}>KI-Modell</td>
                  <td style={{ padding: '0.25rem 0.5rem' }}>{state.llmProvider} ({state.modelName})</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{
          padding: '1rem', border: '1px solid var(--color-gray-2)',
          borderRadius: 'var(--radius)', display: 'flex',
          flexDirection: 'column', justifyContent: 'center', gap: '0.75rem',
        }}>
          {canExport ? (
            <>
              <button className="btn-primary" onClick={handleExport} disabled={exporting}
                style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
                {exporting ? 'Generiere Dokumente…' : '📄 Beide Dokumente exportieren'}
              </button>
              {error && (
                <p style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{error}</p>
              )}
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-1)', textAlign: 'center' }}>
                Erzeugt Schülerfassung.docx + Lösung.docx im Hausstil
              </p>
            </>
          ) : (
            <p style={{ color: 'var(--color-gray-1)', textAlign: 'center', fontSize: '0.8125rem' }}>
              Bitte füge Quelltexte und Aufgabenblöcke mit Arbeitsanweisungen hinzu.
            </p>
          )}
        </div>
      </div>

      {state.bloecke.length > 0 && (
        <div style={{
          marginTop: '1rem',
          borderTop: '2px solid var(--color-gray-2)', paddingTop: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem' }}>Zweispaltige Vorschau</h3>
            <button className="btn-secondary" onClick={() => setShowPreview(!showPreview)}
              style={{ fontSize: '0.8125rem' }}>
              {showPreview ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
            </button>
          </div>
          {showPreview && (
            <PreviewTwoColumn state={state} dispatch={dispatch} />
          )}
        </div>
      )}
    </div>
  );
}
