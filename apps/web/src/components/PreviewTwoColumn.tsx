import { useState } from 'react';
import type { Block } from '@lehrunterlagen/schema';
import type { AppState, AppAction } from '../lib/types';
import { BlockPreview } from './BlockPreview';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

function PreviewBlockWrapper({ block, showSolution, editing, onUpdate }: {
  block: Block; showSolution: boolean; editing: boolean;
  onUpdate?: (id: string, field: string, value: unknown) => void;
}) {
  return editing && onUpdate ? (
    <BlockPreview block={block} showSolution={showSolution} onUpdate={onUpdate} />
  ) : (
    <BlockPreview block={block} showSolution={showSolution} />
  );
}

export function PreviewTwoColumn({ state, dispatch }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleUpdate = (id: string, field: string, value: unknown) => {
    dispatch({ type: 'UPDATE_BLOCK', id, block: { [field]: value } as Partial<Block> });
  };

  const headerStyle: React.CSSProperties = {
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt',
    color: '#595959',
    borderBottom: '1px solid #BFBFBF',
    paddingBottom: '0.375rem',
    marginBottom: '0.75rem',
    display: 'flex',
    justifyContent: 'space-between',
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ borderRight: '1px solid #BFBFBF', paddingRight: '1.5rem' }}>
          <div style={headerStyle}>
            <strong>Schüler*innenfassung</strong>
            <span>{state.meta.klasse} &middot; {state.meta.datum}</span>
          </div>

          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
            <h2 style={{ fontSize: '14pt', fontWeight: 700, marginBottom: '0.5rem' }}>
              {state.meta.thema || '(Thema)'}
            </h2>
            <p style={{ fontSize: '9pt', color: '#595959', marginBottom: '1rem' }}>
              {state.meta.fach === 'deutsch' ? 'Deutsch' : 'Englisch'} &middot;{' '}
              {state.meta.stufe === 'oberstufe' ? 'Oberstufe' : 'Unterstufe'}
            </p>

            {state.quelltexte.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ fontSize: '12pt' }}>Quelltext{state.quelltexte.length > 1 ? 'e' : ''}</strong>
                {state.quelltexte.map((qt, i) => (
                  <div key={qt.id} style={{ marginTop: '0.5rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '11pt' }}>
                      {qt.titel || `Quelltext ${i + 1}`}
                    </p>
                    <p style={{ fontSize: '10pt', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {qt.inhalt.slice(0, 500)}{qt.inhalt.length > 500 ? '…' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {state.bloecke.map((block) => (
              <div key={block.id} style={{
                marginBottom: '1.25rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #BFBFBF',
              }}
              onClick={() => setEditingId(editingId === block.id ? null : block.id)}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: '0.375rem', fontSize: '9pt', color: '#595959',
                }}>
                  <span>{block.punkte} Punkte</span>
                  {block.quelleId && <span>Quelle: {block.quelleId}</span>}
                </div>
                <PreviewBlockWrapper block={block} showSolution={false}
                  editing={editingId === block.id} onUpdate={handleUpdate} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={headerStyle}>
            <strong>Lösungsfassung</strong>
            <span>zur {state.meta.fach === 'deutsch' ? 'Deutsch' : 'Englisch'}-Schularbeit</span>
          </div>

          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
            <h2 style={{ fontSize: '14pt', fontWeight: 700, marginBottom: '0.5rem' }}>
              {state.meta.thema || '(Thema)'}
            </h2>
            <p style={{ fontSize: '9pt', color: '#595959', marginBottom: '1rem' }}>
              {state.meta.fach === 'deutsch' ? 'Deutsch' : 'Englisch'} &middot;{' '}
              {state.meta.stufe === 'oberstufe' ? 'Oberstufe' : 'Unterstufe'}
              &middot; Lösung
            </p>

            {state.bloecke.map((block) => (
              <div key={block.id} style={{
                marginBottom: '1.25rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #BFBFBF',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: '0.375rem', fontSize: '9pt', color: '#595959',
                }}>
                  <span>{block.punkte} Punkte</span>
                  {block.quelleId && <span>Quelle: {block.quelleId}</span>}
                </div>
                <BlockPreview block={block} showSolution={true} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
