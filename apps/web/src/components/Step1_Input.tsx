import type { AppState, AppAction } from '../lib/types';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export function Step1_Input({ state, dispatch }: Props) {
  const handleMetaChange = (field: string, value: string) => {
    dispatch({ type: 'SET_META', meta: { [field]: value } });
  };

  const addPlaceholderText = () => {
    const id = `q${state.quelltexte.length + 1}`;
    dispatch({
      type: 'ADD_QUELLTEXT',
      quelltext: {
        id,
        titel: '',
        inhalt: '',
        herkunft: { typ: 'upload', ref: '' },
      },
    });
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.25rem' }}>Angaben zur Schularbeit</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label htmlFor="stufe">Schulstufe</label>
          <select id="stufe" value={state.meta.stufe}
            onChange={(e) => handleMetaChange('stufe', e.target.value)}>
            <option value="oberstufe">Oberstufe</option>
            <option value="unterstufe">Unterstufe</option>
          </select>
        </div>
        <div>
          <label htmlFor="fach">Fach</label>
          <select id="fach" value={state.meta.fach}
            onChange={(e) => handleMetaChange('fach', e.target.value)}>
            <option value="deutsch">Deutsch</option>
            <option value="englisch">Englisch</option>
          </select>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label htmlFor="thema">Thema</label>
          <input id="thema" type="text" value={state.meta.thema}
            onChange={(e) => handleMetaChange('thema', e.target.value)}
            placeholder="z. B. Medienkonsum und Jugendliche" />
        </div>
        <div>
          <label htmlFor="klasse">Klasse</label>
          <input id="klasse" type="text" value={state.meta.klasse}
            onChange={(e) => handleMetaChange('klasse', e.target.value)}
            placeholder="z. B. 7A" />
        </div>
        <div>
          <label htmlFor="datum">Datum</label>
          <input id="datum" type="date" value={state.meta.datum}
            onChange={(e) => handleMetaChange('datum', e.target.value)} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label htmlFor="notizen">Notizen (optional)</label>
          <textarea id="notizen" value={state.meta.notizen}
            onChange={(e) => handleMetaChange('notizen', e.target.value)}
            rows={2} />
        </div>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Quelltexte</h2>

      {state.quelltexte.map((qt, i) => (
        <div key={qt.id} style={{
          padding: '1rem', marginBottom: '0.75rem',
          border: '1px solid var(--color-gray-2)', borderRadius: 'var(--radius)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <strong style={{ fontSize: '0.8125rem' }}>Quelltext {i + 1}</strong>
            <button className="btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => dispatch({ type: 'REMOVE_QUELLTEXT', id: qt.id })}>
              Entfernen
            </button>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <label>Titel</label>
              <input type="text" value={qt.titel} placeholder="Titel des Quelltexts"
                onChange={(e) => {
                  const updated = { ...qt, titel: e.target.value };
                  dispatch({ type: 'REMOVE_QUELLTEXT', id: qt.id });
                  dispatch({ type: 'ADD_QUELLTEXT', quelltext: updated });
                }} />
            </div>
            <div>
              <label>Inhalt</label>
              <textarea rows={4} value={qt.inhalt} placeholder="Quelltext hier einfügen…"
                onChange={(e) => {
                  const updated = { ...qt, inhalt: e.target.value };
                  dispatch({ type: 'REMOVE_QUELLTEXT', id: qt.id });
                  dispatch({ type: 'ADD_QUELLTEXT', quelltext: updated });
                }} />
            </div>
          </div>
        </div>
      ))}

      <button className="btn-secondary" onClick={addPlaceholderText}
        style={{ marginTop: '0.5rem' }}>
        + Quelltext hinzufügen
      </button>
    </div>
  );
}
