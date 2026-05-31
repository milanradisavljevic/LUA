import { useState } from 'react';
import type { Block } from '@lehrunterlagen/schema';
import type { AppState, AppAction } from '../lib/types';
import { BlockPreview } from './BlockPreview';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export function PreviewTwoColumn({ state, dispatch }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  // Zeige generiertes Dokument wenn vorhanden, sonst Skelett
  const doc = state.generiertesDokument;
  const bloecke = doc ? doc.bloecke : state.bloecke;
  const quelltexte = doc ? doc.quelltexte : state.quelltexte;
  const meta = doc ? doc.meta : state.meta;

  const handleUpdate = (id: string, field: string, value: unknown) => {
    if (doc) {
      dispatch({ type: 'UPDATE_GENERIERTER_BLOCK', id, block: { [field]: value } as Partial<Block> });
    } else {
      dispatch({ type: 'UPDATE_BLOCK', id, block: { [field]: value } as Partial<Block> });
    }
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

  const renderQuelltexte = () =>
    quelltexte.length > 0 ? (
      <div style={{ marginBottom: '1.5rem' }}>
        <strong style={{ fontSize: '12pt' }}>Quelltext{quelltexte.length > 1 ? 'e' : ''}</strong>
        {quelltexte.map((qt, i) => (
          <div key={qt.id} style={{ marginTop: '0.5rem' }}>
            <p style={{ fontWeight: 600, fontSize: '11pt' }}>{qt.titel || `Quelltext ${i + 1}`}</p>
            <p style={{ fontSize: '10pt', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {qt.inhalt.slice(0, 500)}{qt.inhalt.length > 500 ? '…' : ''}
            </p>
          </div>
        ))}
      </div>
    ) : null;

  return (
    <div>
      {!doc && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-1)', marginBottom: '0.75rem' }}>
          Skelett-Vorschau — nach dem Generieren erscheint hier der vollständige Inhalt.
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Schülerfassung */}
        <div style={{ borderRight: '1px solid #BFBFBF', paddingRight: '1.5rem' }}>
          <div style={headerStyle}>
            <strong>Schüler*innenfassung</strong>
            <span>{meta.klasse} · {meta.datum}</span>
          </div>
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
            <h2 style={{ fontSize: '14pt', fontWeight: 700, marginBottom: '0.5rem' }}>
              {meta.thema || '(Thema)'}
            </h2>
            <p style={{ fontSize: '9pt', color: '#595959', marginBottom: '1rem' }}>
              {meta.fach === 'deutsch' ? 'Deutsch' : 'Englisch'} ·{' '}
              {meta.stufe === 'oberstufe' ? 'Oberstufe' : 'Unterstufe'}
            </p>
            {renderQuelltexte()}
            {bloecke.map((block) => (
              <div key={block.id}
                style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #BFBFBF', cursor: 'pointer' }}
                onClick={() => setEditingId(editingId === block.id ? null : block.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '9pt', color: '#595959' }}>
                  <span>{block.punkte} Punkte</span>
                  {block.quelleId && <span>Quelle: {block.quelleId}</span>}
                  {editingId === block.id && <span style={{ color: 'var(--color-accent)' }}>✎ Bearbeitung</span>}
                </div>
                <BlockPreview block={block} showSolution={false}
                  onUpdate={editingId === block.id ? handleUpdate : undefined} />
              </div>
            ))}
          </div>
        </div>

        {/* Lösungsfassung */}
        <div>
          <div style={headerStyle}>
            <strong>Lösungsfassung</strong>
            <span>zur {meta.fach === 'deutsch' ? 'Deutsch' : 'Englisch'}-Schularbeit</span>
          </div>
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
            <h2 style={{ fontSize: '14pt', fontWeight: 700, marginBottom: '0.5rem' }}>
              {meta.thema || '(Thema)'}
            </h2>
            <p style={{ fontSize: '9pt', color: '#595959', marginBottom: '1rem' }}>
              {meta.fach === 'deutsch' ? 'Deutsch' : 'Englisch'} ·{' '}
              {meta.stufe === 'oberstufe' ? 'Oberstufe' : 'Unterstufe'} · Lösung
            </p>
            {bloecke.map((block) => (
              <div key={block.id}
                style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #BFBFBF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '9pt', color: '#595959' }}>
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
