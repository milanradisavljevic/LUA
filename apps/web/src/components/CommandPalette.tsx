import { useState, useEffect, useRef, useCallback } from 'react';
import type { AppAction } from '../lib/types';
import { useCommandParser } from '../hooks/useCommandParser';
import { useVoiceCommand } from '../hooks/useVoiceCommand';

interface Props {
  open: boolean;
  onClose: () => void;
  onActions: (actions: AppAction | AppAction[]) => void;
  onNavigate: (direction: 'next' | 'back') => void;
  onExport: () => void;
  blockCount: number;
}

export function CommandPalette({ open, onClose, onActions, onNavigate, onExport, blockCount }: Props) {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { parse, getSuggestions } = useCommandParser();

  const handleVoiceResult = useCallback((text: string) => {
    setInput(text.trim());
    executeCommand(text.trim());
  }, []);

  const voice = useVoiceCommand(handleVoiceResult);

  useEffect(() => {
    if (open) {
      setInput('');
      setFeedback(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const executeCommand = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (/^(zurück|back|zurueck)$/i.test(trimmed)) {
      onNavigate('back');
      setFeedback({ type: 'success', text: '← Zurück' });
      onClose();
      return;
    }

    if (/^(weiter|next|vor)$/i.test(trimmed)) {
      onNavigate('next');
      setFeedback({ type: 'success', text: '→ Weiter' });
      onClose();
      return;
    }

    if (/^(export(ieren)?|generieren|dokumente?\s+erstellen|download)$/i.test(trimmed)) {
      onExport();
      setFeedback({ type: 'success', text: '📄 Exportiere Dokumente…' });
      onClose();
      return;
    }

    if (/^(block\s+)?(löschen|loeschen|entfernen|delete|letzten\s+löschen)$/i.test(trimmed)) {
      if (blockCount > 0) {
        onActions({ type: 'REMOVE_BLOCK', id: '__last__' });
        setFeedback({ type: 'success', text: 'Letzten Block entfernt' });
      } else {
        setFeedback({ type: 'error', text: 'Keine Blöcke vorhanden' });
      }
      onClose();
      return;
    }

    if (/^(vorlage|template)\s+speichern\s+als\s+(.+)$/i.test(trimmed)) {
      const match = trimmed.match(/^(vorlage|template)\s+speichern\s+als\s+(.+)$/i);
      const name = match?.[2]?.trim();
      if (name) {
        try {
          const raw = localStorage.getItem('lehrunterlagen-templates');
          const templates = raw ? JSON.parse(raw) : [];
          const tpl = { name, meta: {}, bloecke: [], savedAt: new Date().toISOString() };
          templates.push(tpl);
          localStorage.setItem('lehrunterlagen-templates', JSON.stringify(templates));
        } catch { /* ignore */ }
      }
      setFeedback({ type: 'success', text: `Vorlage "${name}" gespeichert (via localStorage)` });
      onClose();
      return;
    }

    if (/^(vorlage|template)\s+laden\s*:?\s*(.+)$/i.test(trimmed)) {
      const match = trimmed.match(/^(vorlage|template)\s+laden\s*:?\s*(.+)$/i);
      const name = match?.[2]?.trim();
      setFeedback({ type: 'success', text: `"${name}" – bitte Vorlagen-Modal öffnen` });
      onClose();
      return;
    }

    const result = parse(trimmed);
    if (result.action) {
      onActions(result.action);
      setFeedback({ type: 'success', text: `✓ ${result.label}` });
      onClose();
    } else {
      setFeedback({
        type: 'error',
        text: 'Befehl nicht erkannt. Tippe "Hilfe" für verfügbare Befehle.',
      });
    }
  };

  const suggestions = input.trim() ? getSuggestions(input) : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '12vh', zIndex: 2000,
    }} onClick={onClose}>
      <div style={{
        width: 520, maxWidth: '90vw',
        background: 'white', borderRadius: 'var(--radius)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--color-gray-2)' }}>
          <input ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Befehl eingeben oder Mikrofon nutzen…"
            style={{
              flex: 1, border: 'none', borderRadius: 0, padding: '0.875rem 1rem',
              fontSize: '0.9375rem', outline: 'none',
            }} />
          <div style={{ display: 'flex', gap: '0.25rem', paddingRight: '0.5rem' }}>
            {voice.supported && (
              <button onClick={(e) => { e.stopPropagation(); voice.toggleListening(); }}
                title="Spracheingabe (deutsch)"
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none',
                  background: voice.listening ? '#d93025' : 'var(--color-gray-3)',
                  color: voice.listening ? 'white' : 'var(--color-gray-1)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1rem', transition: 'all 0.2s',
                }}>
                {voice.listening ? '🔴' : '🎤'}
              </button>
            )}
            <button onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: 'var(--color-gray-3)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-gray-1)', fontSize: '1rem',
              }}>
              ✕
            </button>
          </div>
        </div>

        {voice.listening && (
          <div style={{
            padding: '0.5rem 1rem', background: '#fff3cd',
            fontSize: '0.8125rem', color: '#856404',
          }}>
            🎤 Höre zu…{voice.interimTranscript && ` (${voice.interimTranscript})`}
          </div>
        )}

        {feedback && (
          <div style={{
            padding: '0.5rem 1rem',
            background: feedback.type === 'success' ? '#d4edda' : '#f8d7da',
            color: feedback.type === 'success' ? '#155724' : '#721c24',
            fontSize: '0.8125rem',
          }}>
            {feedback.text}
          </div>
        )}

        {suggestions.length > 0 && input.trim() && (
          <div style={{ maxHeight: 240, overflow: 'auto', padding: '0.5rem 0' }}>
            {suggestions.slice(0, 8).map((s) => (
              <button key={s.id}
                onClick={() => { setInput(s.label); executeCommand(s.label); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '0.5rem 1rem', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: '0.8125rem',
                  fontFamily: 'var(--font)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-gray-3)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <strong>{s.label}</strong>
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-gray-1)', marginTop: '0.125rem' }}>
                  {s.description}
                </p>
              </button>
            ))}
          </div>
        )}

        {!input.trim() && (
          <div style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--color-gray-1)' }}>
            <strong>Verfügbare Befehle:</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', marginTop: '0.375rem' }}>
              <span>Schritt 1–4</span>
              <span>Fach: Deutsch/Englisch</span>
              <span>Stufe: Oberstufe/Unterstufe</span>
              <span>Thema: &lt;Text&gt;</span>
              <span>Füge Lückentext hinzu</span>
              <span>Block löschen</span>
              <span>Punkte: 10</span>
              <span>Exportieren</span>
              <span>Vorlage speichern als …</span>
              <span>Zurück / Weiter</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
