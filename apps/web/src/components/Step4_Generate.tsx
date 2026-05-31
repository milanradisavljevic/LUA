import type { AppState, AppAction } from '../lib/types';
import { getBlockLabel } from '../lib/blockDefaults';
import { PreviewTwoColumn } from './PreviewTwoColumn';
import { useGenerate } from '../hooks/useGenerate';
import { useExport } from '../hooks/useExport';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export function Step4_Generate({ state, dispatch }: Props) {
  const { generate, generating, error: generateError } = useGenerate(dispatch);
  const { exportDocx, exporting, error: exportError } = useExport();

  const canGenerate = state.quelltexte.length > 0 && state.bloecke.length > 0 && !!state.llmProvider;
  const canExport = !!state.generiertesDokument;
  const error = generateError ?? exportError;

  const totalPunkte = state.bloecke.reduce((s, b) => s + b.punkte, 0);

  return (
    <div>
      <h2 style={{ marginBottom: '1.25rem' }}>Generieren &amp; Export</h2>

      {/* Zusammenfassung + Aktionen */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '1rem', marginBottom: '1.5rem',
      }}>
        {/* Zusammenfassung */}
        <div style={{
          padding: '1rem', border: '1px solid var(--color-gray-2)',
          borderRadius: 'var(--radius)',
        }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.8125rem' }}>Zusammenfassung</h3>
          <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Thema', state.meta.thema || '—'],
                ['Fach / Stufe', `${state.meta.fach === 'deutsch' ? 'Deutsch' : 'Englisch'} · ${state.meta.stufe === 'oberstufe' ? 'Oberstufe' : 'Unterstufe'}`],
                ['Blöcke', state.bloecke.map((b) => getBlockLabel(b.typ)).join(', ') || '—'],
                ['Gesamtpunkte', String(totalPunkte)],
                ['KI-Modell', state.llmProvider ? `${state.llmProvider} (${state.modelName})` : '—'],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td style={{ padding: '0.25rem 0.5rem', color: 'var(--color-gray-1)', width: 110 }}>{label}</td>
                  <td style={{ padding: '0.25rem 0.5rem' }}><strong>{value}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Aktionen */}
        <div style={{
          padding: '1rem', border: '1px solid var(--color-gray-2)',
          borderRadius: 'var(--radius)', display: 'flex',
          flexDirection: 'column', gap: '0.75rem', justifyContent: 'center',
        }}>
          {/* Schritt 1: Generieren */}
          <button
            className="btn-primary"
            onClick={() => generate(state)}
            disabled={!canGenerate || generating || exporting}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.9375rem' }}
          >
            {generating ? '⏳ Inhalt wird generiert…' : '✨ Inhalt generieren'}
          </button>

          {/* Schritt 2: Exportieren */}
          <button
            className="btn-secondary"
            onClick={() => exportDocx(state)}
            disabled={!canExport || exporting || generating}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.9375rem',
              opacity: canExport ? 1 : 0.45 }}
          >
            {exporting ? 'Exportiere…' : '📄 Beide Dokumente exportieren'}
          </button>

          {canExport && (
            <p style={{ fontSize: '0.7rem', color: 'var(--color-gray-1)', textAlign: 'center', margin: 0 }}>
              Erzeugt Schülerfassung.docx + Lösung.docx im Hausstil
            </p>
          )}

          {error && (
            <p style={{ color: 'var(--color-error)', fontSize: '0.75rem', margin: 0 }}>{error}</p>
          )}

          {!canGenerate && (
            <p style={{ color: 'var(--color-gray-1)', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>
              Quelltexte, Aufgabenblöcke und KI-Modell erforderlich.
            </p>
          )}
        </div>
      </div>

      {/* Zweispaltige Vorschau */}
      {state.bloecke.length > 0 && (
        <div style={{ borderTop: '2px solid var(--color-gray-2)', paddingTop: '1rem' }}>
          <h3 style={{ fontSize: '0.9375rem', marginBottom: '0.75rem' }}>
            Vorschau
            {state.generiertesDokument && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)',
                marginLeft: '0.75rem', fontWeight: 400 }}>
                ✓ mit generiertem Inhalt
              </span>
            )}
          </h3>
          <PreviewTwoColumn state={state} dispatch={dispatch} />
        </div>
      )}
    </div>
  );
}
