import { useState, useEffect } from 'react';
import type { Block } from '@lehrunterlagen/schema';
import type { AppState, AppAction } from '../lib/types';
import { BlockPreview } from './BlockPreview';
import { BLOCK_TYPE_DEFS } from '../lib/constants';
import { useGenerate } from '../hooks/useGenerate';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const BLOCK_LABELS: Record<string, string> = Object.fromEntries(
  BLOCK_TYPE_DEFS.map((d) => [d.id, d.label]),
);

// YYYY-MM-DD → DD.MM.YYYY (wie im DOCX); andere Eingaben unverändert.
function formatDatum(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

function useWindowWidth() {
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
}

export function PreviewTwoColumn({ state, dispatch }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [regenId, setRegenId] = useState<string | null>(null);
  const windowWidth = useWindowWidth();
  const isNarrow = windowWidth < 768;
  const { regenerateBlock, generating, stage } = useGenerate(dispatch);

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
    fontFamily: 'var(--font)',
    fontSize: '10pt',
    color: '#595959',
    borderBottom: '1px solid #BFBFBF',
    paddingBottom: '0.375rem',
    marginBottom: '0.75rem',
    display: 'flex',
    justifyContent: 'space-between',
  };

  const resolveQuelleTitel = (id?: string) => {
    if (!id) return undefined;
    const qt = quelltexte.find((q) => q.id === id);
    return qt?.titel || id;
  };

  const gesamtPunkte = bloecke.reduce((sum, b) => sum + b.punkte, 0);

  // Schülerkopf (Name/Klasse/Datum) + Aufgabenübersicht — spiegelt das DOCX-Layout.
  const renderKopf = () => (
    <>
      <div style={{
        border: '1px solid #000', padding: '0.4rem 0.6rem', fontSize: '10pt',
        marginBottom: '0.75rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap',
      }}>
        <span><strong>Name:</strong> <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '8rem' }}>&nbsp;</span></span>
        <span><strong>Klasse:</strong> {meta.klasse || '—'}</span>
        <span><strong>Datum:</strong> {meta.datum ? formatDatum(meta.datum) : '—'}</span>
      </div>
      {bloecke.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontWeight: 600, fontSize: '11pt', marginBottom: '0.25rem' }}>Aufgabenübersicht</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
            <thead>
              <tr style={{ background: '#D9D9D9' }}>
                <th style={{ border: '1px solid #000', padding: '2px 6px', textAlign: 'left', width: '10%' }}>Nr.</th>
                <th style={{ border: '1px solid #000', padding: '2px 6px', textAlign: 'left' }}>Aufgabe</th>
                <th style={{ border: '1px solid #000', padding: '2px 6px', textAlign: 'right', width: '22%' }}>Punkte</th>
              </tr>
            </thead>
            <tbody>
              {bloecke.map((b, i) => (
                <tr key={b.id}>
                  <td style={{ border: '1px solid #000', padding: '2px 6px' }}>{i + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 6px' }}>{BLOCK_LABELS[b.typ] ?? b.typ}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 6px', textAlign: 'right' }}>____ / {b.punkte}</td>
                </tr>
              ))}
              <tr style={{ background: '#F2F2F2', fontWeight: 700 }}>
                <td style={{ border: '1px solid #000', padding: '2px 6px' }}></td>
                <td style={{ border: '1px solid #000', padding: '2px 6px' }}>GESAMT</td>
                <td style={{ border: '1px solid #000', padding: '2px 6px', textAlign: 'right' }}>____ / {gesamtPunkte}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: '10pt', marginTop: '0.4rem' }}>
            <strong>Note:</strong> ________   <strong>Unterschrift:</strong> ____________
          </p>
        </div>
      )}
    </>
  );

  const renderQuelltexte = () =>
    quelltexte.length > 0 ? (
      <div style={{ marginBottom: '1.5rem' }}>
        <strong style={{ fontSize: '12pt' }}>Quelltext{quelltexte.length > 1 ? 'e' : ''}</strong>
        {quelltexte.map((qt, i) => (
          <div key={qt.id} style={{ marginTop: '0.5rem' }}>
            <p style={{ fontWeight: 600, fontSize: '11pt' }}>Text {i + 1}: {qt.titel || `Quelltext ${i + 1}`}</p>
            {qt.herkunft?.ref && (
              <p style={{ fontSize: '9pt', fontStyle: 'italic', color: '#595959', margin: '0.1rem 0' }}>nach: {qt.herkunft.ref}</p>
            )}
            <p style={{
              fontSize: '10pt', lineHeight: 1.5, whiteSpace: 'pre-wrap',
              borderLeft: '3px solid #BFBFBF', paddingLeft: '0.6rem', marginTop: '0.25rem',
            }}>
              {qt.inhalt}
            </p>
          </div>
        ))}
      </div>
    ) : null;

  // Lernziel-Coverage berechnen
  const gewuenschteLernziele = meta.lernziele ?? [];
  const abgedeckteLernziele = new Set<string>();
  const lernzielProBlock = new Map<string, string[]>();
  for (const block of bloecke) {
    const blockLzs = block.lernziele ?? [];
    lernzielProBlock.set(block.id, blockLzs);
    for (const lz of blockLzs) abgedeckteLernziele.add(lz);
  }
  const fehlendeLernziele = gewuenschteLernziele.filter((lz) => !abgedeckteLernziele.has(lz));
  const zeigeCoverage = gewuenschteLernziele.length > 0 && doc; // Nur bei generiertem Dokument + vorhandenen Lernzielen

  return (
    <div>
      {!doc && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-1)', marginBottom: '0.75rem' }}>
          Skelett-Vorschau — nach dem Generieren erscheint hier der vollständige Inhalt.
        </p>
      )}

      {/* Lernziel-Coverage-Checkliste */}
      {zeigeCoverage && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          background: fehlendeLernziele.length > 0 ? '#fff3e0' : '#e8f5e9',
          borderRadius: 'var(--radius)',
          border: `1px solid ${fehlendeLernziele.length > 0 ? '#ffb74d' : '#81c784'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>{fehlendeLernziele.length > 0 ? '⚠️' : '✅'}</span>
            <strong style={{ fontSize: '0.875rem' }}>
              Lernziel-Abdeckung
            </strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-1)' }}>
              ({abgedeckteLernziele.size}/{gewuenschteLernziele.length} abgedeckt)
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {gewuenschteLernziele.map((lz) => {
              const istAbgedeckt = abgedeckteLernziele.has(lz);
              // Welche Blöcke decken dieses Lernziel ab?
              const deckendeBloecke = bloecke
                .filter((b) => (b.lernziele ?? []).includes(lz))
                .map((b) => BLOCK_LABELS[b.typ] ?? b.typ);
              return (
                <span
                  key={lz}
                  title={deckendeBloecke.length > 0 ? `Abgedeckt in: ${deckendeBloecke.join(', ')}` : 'Nicht abgedeckt'}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius)',
                    background: istAbgedeckt ? '#e8f5e9' : '#ffebee',
                    color: istAbgedeckt ? '#2e7d32' : '#c62828',
                    border: `1px solid ${istAbgedeckt ? '#81c784' : '#ef9a9a'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {istAbgedeckt ? '✓' : '○'} {lz}
                </span>
              );
            })}
          </div>

          {fehlendeLernziele.length > 0 && (
            <p style={{ fontSize: '0.75rem', color: '#e65100', margin: '0.5rem 0 0 0' }}>
              Nicht abgedeckt: {fehlendeLernziele.join(', ')} — Überprüfe die Aufgaben oder passe die Lernziele an.
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
        {/* Schülerfassung */}
        <div style={{ borderRight: isNarrow ? 'none' : '1px solid #BFBFBF', paddingRight: isNarrow ? '0' : '1.5rem', marginBottom: isNarrow ? '1.5rem' : '0' }}>
          <div style={headerStyle}>
            <strong>Schüler*innenfassung</strong>
            <span>{meta.klasse} · {meta.datum}</span>
          </div>
          <div style={{ fontFamily: 'var(--font)', fontSize: '11pt' }}>
            <h2 style={{ fontSize: '14pt', fontWeight: 700, marginBottom: '0.5rem' }}>
              {meta.thema || '(Thema)'}
            </h2>
            <p style={{ fontSize: '9pt', color: '#595959', marginBottom: '0.5rem' }}>
              {meta.fach === 'deutsch' ? 'Deutsch' : 'Englisch'} ·{' '}
              {meta.stufe === 'oberstufe' ? 'Oberstufe' : 'Unterstufe'}
              {meta.schwierigkeit ? ` · ${meta.schwierigkeit.charAt(0).toUpperCase() + meta.schwierigkeit.slice(1)}` : ''}
            </p>
            {meta.lernziele && meta.lernziele.length > 0 && (
              <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {meta.lernziele.map((lz) => (
                  <span key={lz} style={{
                    fontSize: '8pt',
                    background: '#f3e5f5',
                    color: '#6a1b9a',
                    padding: '0.125rem 0.5rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid #ce93d8',
                  }}>
                    {lz}
                  </span>
                ))}
              </div>
            )}
            {renderKopf()}
            {renderQuelltexte()}
            {bloecke.map((block) => (
              <div key={block.id}
                style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #BFBFBF', cursor: 'pointer' }}
                onClick={() => setEditingId(editingId === block.id ? null : block.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '9pt', color: '#595959' }}>
                  <span>{block.punkte} Punkte</span>
                  {block.quelleId && <span>Quelle: {resolveQuelleTitel(block.quelleId)}</span>}
                  {editingId === block.id && <span style={{ color: 'var(--color-accent)' }}>✎ Bearbeitung</span>}
                </div>
                <BlockPreview block={block} showSolution={false}
                  onUpdate={editingId === block.id ? handleUpdate : undefined} />
                {/* Block-Regenerieren — nur bei generiertem Dokument */}
                {doc && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {generating && regenId === block.id ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>
                        🔄 Wird regeneriert… {stage}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => setRegenId(regenId === block.id ? null : block.id)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--color-gray-2)',
                            background: 'white',
                            cursor: 'pointer',
                            color: 'var(--color-gray-1)',
                          }}
                        >
                          🔄 Neu generieren
                        </button>
                        {regenId === block.id && (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {['Kürzer', 'Schwieriger', 'Andere Formulierung'].map((hint) => (
                              <button
                                key={hint}
                                onClick={async () => {
                                  setRegenId(null);
                                  await regenerateBlock(state, block.id, hint);
                                }}
                                style={{
                                  fontSize: '0.6875rem',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: 'var(--radius)',
                                  border: '1px solid var(--color-accent)',
                                  background: '#f3e5f5',
                                  cursor: 'pointer',
                                  color: 'var(--color-accent)',
                                }}
                              >
                                {hint}
                              </button>
                            ))}
                            <button
                              onClick={async () => {
                                setRegenId(null);
                                await regenerateBlock(state, block.id);
                              }}
                              style={{
                                fontSize: '0.6875rem',
                                padding: '0.15rem 0.4rem',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--color-gray-2)',
                                background: 'white',
                                cursor: 'pointer',
                                color: 'var(--color-gray-1)',
                              }}
                            >
                              Standard
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
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
          <div style={{ fontFamily: 'var(--font)', fontSize: '11pt' }}>
            <h2 style={{ fontSize: '14pt', fontWeight: 700, marginBottom: '0.5rem' }}>
              {meta.thema || '(Thema)'}
            </h2>
            <p style={{ fontSize: '9pt', color: '#595959', marginBottom: '0.5rem' }}>
              {meta.fach === 'deutsch' ? 'Deutsch' : 'Englisch'} ·{' '}
              {meta.stufe === 'oberstufe' ? 'Oberstufe' : 'Unterstufe'} · Lösung
              {meta.schwierigkeit ? ` · ${meta.schwierigkeit.charAt(0).toUpperCase() + meta.schwierigkeit.slice(1)}` : ''}
            </p>
            {meta.lernziele && meta.lernziele.length > 0 && (
              <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {meta.lernziele.map((lz) => (
                  <span key={lz} style={{
                    fontSize: '8pt',
                    background: '#f3e5f5',
                    color: '#6a1b9a',
                    padding: '0.125rem 0.5rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid #ce93d8',
                  }}>
                    {lz}
                  </span>
                ))}
              </div>
            )}
            {renderKopf()}
            {renderQuelltexte()}
            {bloecke.map((block) => (
              <div key={block.id}
                style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #BFBFBF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '9pt', color: '#595959' }}>
                  <span>{block.punkte} Punkte</span>
                  {block.quelleId && <span>Quelle: {resolveQuelleTitel(block.quelleId)}</span>}
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
