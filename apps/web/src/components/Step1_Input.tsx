import { useRef } from 'react';
import type { AppState, AppAction } from '../lib/types';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

async function readFileAsText(file: File): Promise<string> {
  if (file.name.endsWith('.docx')) {
    // mammoth browser build — convert docx to plain text
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
  if (file.name.endsWith('.pdf')) {
    // pdfjs-dist — extract text from PDF
    const pdfjsLib = await import('pdfjs-dist');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    return fullText.trim();
  }
  // txt / html / fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? '');
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    reader.readAsText(file, 'utf-8');
  });
}

export function Step1_Input({ state, dispatch }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMetaChange = (field: string, value: string) => {
    dispatch({ type: 'SET_META', meta: { [field]: value } });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const inhalt = await readFileAsText(file);
      const titel = file.name.replace(/\.[^.]+$/, '');
      const id = `q${Date.now()}`;
      dispatch({
        type: 'ADD_QUELLTEXT',
        quelltext: { id, titel, inhalt, herkunft: { typ: 'upload', ref: file.name } },
      });
    } catch {
      alert('Datei konnte nicht gelesen werden. Bitte .txt, .docx, .pdf oder .html hochladen.');
    }
    // Input zurücksetzen damit dieselbe Datei nochmal hochgeladen werden kann
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addPlaceholderText = () => {
    const id = `q${state.quelltexte.length + 1}`;
    dispatch({
      type: 'ADD_QUELLTEXT',
      quelltext: {
        id,
        titel: '',
        inhalt: '',
        herkunft: { typ: 'eingabe', ref: '' },
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

      {state.quelltexte.length === 0 && (
        <div style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          color: 'var(--color-gray-1)',
          background: 'var(--color-gray-3)',
          borderRadius: 'var(--radius)',
          marginBottom: '1rem',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Noch keine Quelltexte</div>
          <div style={{ fontSize: '0.8125rem' }}>
            Lade eine Datei hoch (.txt, .docx, .pdf, .html) oder gib einen Text manuell ein.
          </div>
        </div>
      )}

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
                onChange={(e) => dispatch({ type: 'UPDATE_QUELLTEXT', id: qt.id, quelltext: { titel: e.target.value } })} />
            </div>
            <div>
              <label>Inhalt</label>
              <textarea rows={10} value={qt.inhalt} placeholder="Quelltext hier einfügen…"
                style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}
                onChange={(e) => dispatch({ type: 'UPDATE_QUELLTEXT', id: qt.id, quelltext: { inhalt: e.target.value } })} />
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-1)', marginTop: '0.25rem' }}>
                Zeilenumbrüche bleiben erhalten. <strong>Leerzeile = neue Strophe/Absatz.</strong>
              </p>
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={addPlaceholderText}>
          + Quelltext manuell eingeben
        </button>
        <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
          📂 Datei hochladen (.txt, .docx, .html)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.docx,.html,.htm"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
      </div>
      <p style={{ fontSize: '0.7rem', color: 'var(--color-gray-1)', marginTop: '0.375rem' }}>
        PDF: Bitte in Word oder LibreOffice als .docx oder .txt speichern.
        URL: Seite als HTML speichern und hochladen.
      </p>
    </div>
  );
}
