import { describe, it, expect } from 'vitest';
import { buildMessages } from './prompt.js';
import type { Meta } from '@lehrunterlagen/schema';

const baseMeta: Meta = {
  stufe: 'oberstufe',
  fach: 'deutsch',
  thema: 'Medienkonsum',
  datum: '2026-06-04',
  klasse: '7A',
  notizen: '',
};

const input = (meta: Partial<Meta> = {}) => ({
  meta: { ...baseMeta, ...meta },
  quelltexte: [
    {
      id: 'q1',
      titel: 'Test',
      inhalt: 'Ein langer Quelltext ueber Medienkonsum bei Jugendlichen.',
      herkunft: { typ: 'upload' as const, ref: 'test.pdf' },
    },
  ],
  bloecke: [{ typ: 'multipleChoice' as const, punkte: 4, quelleId: 'q1', anzahlFragen: 1, mehrfach: false }],
});

describe('buildMessages — Bloom-Steuerung (C1)', () => {
  it('System-Prompt enthaelt Bloom-Sektion mit allen drei Stufen', () => {
    const messages = buildMessages(input());
    const system = messages.find((m) => m.role === 'system');
    expect(system).toBeDefined();
    expect(system!.content).toContain('KOGNITIVES NIVEAU (Bloom-Steuerung)');
    expect(system!.content).toContain('leicht');
    expect(system!.content).toContain('mittel');
    expect(system!.content).toContain('schwer');
    expect(system!.content).toContain('Bloom-Stufen 1-2');
    expect(system!.content).toContain('Bloom-Stufen 3-4');
    expect(system!.content).toContain('Bloom-Stufen 5-6');
  });

  it('User-Message propagiert schwierigkeit="leicht" an das LLM', () => {
    const messages = buildMessages(input({ schwierigkeit: 'leicht' }));
    const user = messages.find((m) => m.role === 'user');
    expect(user).toBeDefined();
    expect(user!.content).toContain('Schwierigkeitsniveau: "leicht"');
  });

  it('User-Message propagiert schwierigkeit="mittel" an das LLM', () => {
    const messages = buildMessages(input({ schwierigkeit: 'mittel' }));
    const user = messages.find((m) => m.role === 'user');
    expect(user!.content).toContain('Schwierigkeitsniveau: "mittel"');
  });

  it('User-Message propagiert schwierigkeit="schwer" an das LLM', () => {
    const messages = buildMessages(input({ schwierigkeit: 'schwer' }));
    const user = messages.find((m) => m.role === 'user');
    expect(user!.content).toContain('Schwierigkeitsniveau: "schwer"');
  });

  it('Ohne schwierigkeit faellt das System auf Default "mittel" zurueck', () => {
    const messages = buildMessages(input());
    const user = messages.find((m) => m.role === 'user');
    expect(user!.content).toContain('Schwierigkeitsniveau: "mittel"');
  });

  it('User-Message enthaelt zusaetzlich die meta-/quelltext-JSON', () => {
    const messages = buildMessages(input({ schwierigkeit: 'schwer' }));
    const user = messages.find((m) => m.role === 'user');
    expect(user!.content).toContain('"thema": "Medienkonsum"');
    expect(user!.content).toContain('"schwierigkeit": "schwer"');
    expect(user!.content).toContain('Medienkonsum bei Jugendlichen');
  });

  it('Messages-Struktur: erst System, dann User', () => {
    const messages = buildMessages(input());
    expect(messages[0]?.role).toBe('system');
    expect(messages[1]?.role).toBe('user');
    expect(messages).toHaveLength(2);
  });

  it('System-Prompt verbietet weiterhin Markdown-Zaune und Erklaerungen', () => {
    const messages = buildMessages(input());
    const system = messages[0];
    expect(system?.content).toContain('Kein Layout, keine Markdown-Zaeune');
    expect(system?.content).toContain('Antworte AUSSCHLIESSLICH mit dem JSON-Array');
  });
});

describe('buildMessages — Notizen der Lehrkraft (A)', () => {
  it('System-Prompt dokumentiert die Notizen-Regel', () => {
    const messages = buildMessages(input());
    const system = messages.find((m) => m.role === 'system');
    expect(system!.content).toContain('NOTIZEN DER LEHRKRAFT');
    // Notizen duerfen Format/Sicherheit nicht ueberschreiben.
    expect(system!.content).toMatch(/duerfen niemals das Ausgabeformat/i);
  });

  it('User-Message enthaelt den Notizen-Hinweis, wenn meta.notizen gesetzt ist', () => {
    const messages = buildMessages(input({ notizen: 'Bitte den Klimawandel betonen.' }));
    const user = messages.find((m) => m.role === 'user');
    expect(user!.content).toContain('Notizen der Lehrkraft');
    expect(user!.content).toContain('Bitte den Klimawandel betonen.');
  });

  it('Ohne Notizen erscheint kein Notizen-Hinweis in der User-Message', () => {
    const messages = buildMessages(input({ notizen: '   ' }));
    const user = messages.find((m) => m.role === 'user');
    expect(user!.content).not.toContain('Beruecksichtige die Notizen der Lehrkraft bei den Inhalten');
  });
});
