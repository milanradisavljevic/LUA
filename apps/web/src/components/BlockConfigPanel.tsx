import { useMemo } from 'react';
import type { Block, Meta } from '@lehrunterlagen/schema';
import { isWortbankEnabled } from '../lib/constants';

interface Props {
  block: Block;
  stufe: Meta['stufe'];
  onConfigChange: (config: Record<string, unknown>) => void;
}

function ConfigField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <label>{label}</label>
      {children}
      {error && <p style={{ color: '#d93025', fontSize: '0.6875rem', marginTop: '0.125rem' }}>{error}</p>}
    </div>
  );
}

export function BlockConfigPanel({ block, stufe, onConfigChange }: Props) {
  const config = block.config as Record<string, unknown>;
  const set = (key: string, value: unknown) => {
    onConfigChange({ ...config, [key]: value });
  };

  if (block.typ === 'lueckentext') {
    const wortbank = !!config.wortbank;
    const distraktoren = (config.distraktoren as number) ?? 0;
    const wortbankAllowed = isWortbankEnabled(stufe);
    const errors = useMemo(() => {
      const e: Record<string, string> = {};
      if (wortbank && distraktoren < 1) e.distraktoren = 'Wenn Wortbank aktiv ist, muss es mindestens 1 Distraktor geben.';
      return e;
    }, [wortbank, distraktoren]);

    return (
      <div style={{ borderTop: '1px solid var(--color-gray-2)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '0.8125rem' }}>Lückentext-Konfiguration</h3>
        <ConfigField label="Anzahl Lücken">
          <input type="number" min={1} value={config.anzahlLuecken as number ?? 6}
            onChange={(e) => set('anzahlLuecken', parseInt(e.target.value) || 1)} />
        </ConfigField>
        <ConfigField label="Wortbank">
          <select value={wortbank ? 'true' : 'false'}
            disabled={!wortbankAllowed}
            onChange={(e) => {
              const wb = e.target.value === 'true';
              set('wortbank', wb);
              if (!wb) set('distraktoren', 0);
            }}
            style={{ opacity: !wortbankAllowed ? 0.5 : 1 }}>
            <option value="false">Aus</option>
            <option value="true">An</option>
          </select>
          {!wortbankAllowed && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-1)' }}>
              {' '}(nur in der Unterstufe)
            </span>
          )}
        </ConfigField>
        {wortbank && (
          <ConfigField label="Distraktoren" error={errors.distraktoren}>
            <input type="number" min={0} value={distraktoren}
              onChange={(e) => set('distraktoren', parseInt(e.target.value) || 0)} />
          </ConfigField>
        )}
      </div>
    );
  }

  if (block.typ === 'matching') {
    const items = (config.items as Array<{ nr: number; prompt: string }>) ?? [];
    const optionen = (config.optionen as Array<{ key: string; text: string }>) ?? [];
    const errors = useMemo(() => {
      const e: Record<string, string> = {};
      if (optionen.length <= items.length) {
        e.optionen = `Es muss mehr Optionen als Items geben (${items.length} Items, ${optionen.length} Optionen).`;
      }
      return e;
    }, [items.length, optionen.length]);

    return (
      <div style={{ borderTop: '1px solid var(--color-gray-2)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '0.8125rem' }}>Matching-Konfiguration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label>Items (links)</label>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ lineHeight: '36px', fontSize: '0.75rem', minWidth: 20 }}>{item.nr}.</span>
                <input type="text" value={item.prompt} placeholder="Begriff"
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[i] = { ...item, prompt: e.target.value };
                    set('items', newItems);
                  }} />
              </div>
            ))}
            <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              onClick={() => set('items', [...items, { nr: items.length + 1, prompt: '' }])}>
              + Item
            </button>
          </div>
          <div>
            <label>Optionen (rechts)</label>
            {optionen.map((opt, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ lineHeight: '36px', fontSize: '0.75rem', minWidth: 20 }}>{opt.key}</span>
                <input type="text" value={opt.text} placeholder="Definition"
                  onChange={(e) => {
                    const newOpts = [...optionen];
                    newOpts[i] = { ...opt, text: e.target.value };
                    set('optionen', newOpts);
                  }} />
              </div>
            ))}
            <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              onClick={() => {
                const nextKey = String.fromCharCode(65 + optionen.length);
                set('optionen', [...optionen, { key: nextKey, text: '' }]);
              }}>
              + Option
            </button>
          </div>
        </div>
        {errors.optionen && (
          <p style={{ color: '#d93025', fontSize: '0.6875rem', marginTop: '0.25rem' }}>{errors.optionen}</p>
        )}
      </div>
    );
  }

  if (block.typ === 'multipleChoice') {
    const fragen = (config.fragen as Array<{
      nr: number; frage: string;
      optionen: Array<{ key: string; text: string }>;
      mehrfach: boolean;
    }>) ?? [];

    return (
      <div style={{ borderTop: '1px solid var(--color-gray-2)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '0.8125rem' }}>Multiple-Choice-Konfiguration</h3>
        {fragen.map((frage, fi) => (
          <div key={fi} style={{
            padding: '0.75rem', border: '1px solid var(--color-gray-2)',
            borderRadius: 'var(--radius)', marginBottom: '0.75rem',
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.75rem' }}>Frage {frage.nr}</strong>
              <label style={{ margin: 0, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input type="checkbox" checked={frage.mehrfach}
                  onChange={(e) => {
                    const newFragen = [...fragen];
                    newFragen[fi] = { ...frage, mehrfach: e.target.checked };
                    set('fragen', newFragen);
                  }} />
                Mehrfachauswahl
              </label>
            </div>
            <input type="text" value={frage.frage} placeholder="Frage"
              onChange={(e) => {
                const newFragen = [...fragen];
                newFragen[fi] = { ...frage, frage: e.target.value };
                set('fragen', newFragen);
              }}
              style={{ marginBottom: '0.5rem' }} />
            {frage.optionen.map((opt, oi) => (
              <div key={oi} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <span style={{ lineHeight: '32px', fontSize: '0.75rem', minWidth: 20 }}>{opt.key}</span>
                <input type="text" value={opt.text} placeholder="Antwortmöglichkeit"
                  onChange={(e) => {
                    const newFragen = [...fragen];
                    const newOpts = [...frage.optionen];
                    newOpts[oi] = { ...opt, text: e.target.value };
                    newFragen[fi] = { ...frage, optionen: newOpts };
                    set('fragen', newFragen);
                  }} />
              </div>
            ))}
            {fi < fragen.length - 1 && (
              <button className="btn-danger" style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem', marginTop: '0.25rem' }}
                onClick={() => set('fragen', fragen.filter((_: unknown, j: number) => j !== fi))}>
                Frage entfernen
              </button>
            )}
          </div>
        ))}
        <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
          onClick={() => set('fragen', [...fragen, { nr: fragen.length + 1, frage: '', optionen: [{ key: 'A', text: '' }, { key: 'B', text: '' }], mehrfach: false }])}>
          + Frage
        </button>
      </div>
    );
  }

  if (block.typ === 'offeneVerstaendnisfrage') {
    const fragen = (config.fragen as Array<{ nr: number; frage: string; zeilen: number }>) ?? [];

    return (
      <div style={{ borderTop: '1px solid var(--color-gray-2)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '0.8125rem' }}>Verständnisfragen</h3>
        {fragen.map((frage, fi) => (
          <div key={fi} style={{
            padding: '0.75rem', border: '1px solid var(--color-gray-2)',
            borderRadius: 'var(--radius)', marginBottom: '0.75rem',
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <input type="text" value={frage.frage} placeholder="Frage"
                  onChange={(e) => {
                    const newFragen = [...fragen];
                    newFragen[fi] = { ...frage, frage: e.target.value };
                    set('fragen', newFragen);
                  }} />
              </div>
              <div style={{ width: 80 }}>
                <label style={{ fontSize: '0.6875rem' }}>Zeilen</label>
                <input type="number" min={1} value={frage.zeilen}
                  onChange={(e) => {
                    const newFragen = [...fragen];
                    newFragen[fi] = { ...frage, zeilen: parseInt(e.target.value) || 4 };
                    set('fragen', newFragen);
                  }} />
              </div>
            </div>
            {fi < fragen.length - 1 && (
              <button className="btn-danger" style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem', marginTop: '0.25rem' }}
                onClick={() => set('fragen', fragen.filter((_: unknown, j: number) => j !== fi))}>
                Frage entfernen
              </button>
            )}
          </div>
        ))}
        <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
          onClick={() => set('fragen', [...fragen, { nr: fragen.length + 1, frage: '', zeilen: 4 }])}>
          + Frage
        </button>
      </div>
    );
  }

  if (block.typ === 'offeneSchreibaufgabe') {
    const umfang = config.umfangWorte as { min: number; max: number } ?? { min: 200, max: 300 };
    const aspekte = (config.aspekte as string[]) ?? [];
    const errors = useMemo(() => {
      const e: Record<string, string> = {};
      if (umfang.min > umfang.max) e.umfang = 'Min darf nicht größer als Max sein.';
      return e;
    }, [umfang.min, umfang.max]);

    return (
      <div style={{ borderTop: '1px solid var(--color-gray-2)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '0.8125rem' }}>Schreibaufgabe-Konfiguration</h3>
        <ConfigField label="Situation">
          <textarea rows={2} value={config.situation as string ?? ''} placeholder="Ausgangssituation beschreiben"
            onChange={(e) => set('situation', e.target.value)} />
        </ConfigField>
        <ConfigField label="Textsorte">
          <input type="text" value={config.textsorte as string ?? ''} placeholder="z. B. Kommentar, Erörterung"
            onChange={(e) => set('textsorte', e.target.value)} />
        </ConfigField>
        <ConfigField label="Umfang (Wörter)" error={errors.umfang}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="number" min={1} value={umfang.min} placeholder="Min"
              onChange={(e) => set('umfangWorte', { ...umfang, min: parseInt(e.target.value) || 1 })} />
            <span style={{ lineHeight: '36px' }}>–</span>
            <input type="number" min={1} value={umfang.max} placeholder="Max"
              onChange={(e) => set('umfangWorte', { ...umfang, max: parseInt(e.target.value) || 1 })} />
          </div>
        </ConfigField>
        <ConfigField label="Aspekte">
          {aspekte.map((asp, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.375rem' }}>
              <input type="text" value={asp} placeholder={`Aspekt ${i + 1}`}
                onChange={(e) => {
                  const newAsp = [...aspekte];
                  newAsp[i] = e.target.value;
                  set('aspekte', newAsp);
                }} />
              {aspekte.length > 1 && (
                <button className="btn-danger" style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem' }}
                  onClick={() => set('aspekte', aspekte.filter((_: unknown, j: number) => j !== i))}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginTop: '0.25rem' }}
            onClick={() => set('aspekte', [...aspekte, ''])}>
            + Aspekt
          </button>
        </ConfigField>
      </div>
    );
  }

  if (block.typ === 'markieraufgabe') {
    return (
      <div style={{ borderTop: '1px solid var(--color-gray-2)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '0.8125rem' }}>Markieraufgabe</h3>
        <ConfigField label="Anweisung zum Markieren">
          <textarea rows={2} value={config.anweisung as string ?? ''}
            placeholder="z. B. Markiere alle Stilmittel im Gedicht."
            onChange={(e) => set('anweisung', e.target.value)} />
        </ConfigField>
      </div>
    );
  }

  return null;
}
