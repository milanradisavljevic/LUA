import type { Meta, Block } from '@lehrunterlagen/schema';
import { isWortbankEnabled } from './constants';

let _counter = 0;
function nextId(): string {
  _counter++;
  return `b${_counter}`;
}

export function createDefaultBlock(typ: Block['typ'], meta?: Meta): Block {
  const id = nextId();
  const base = { id, punkte: 6, arbeitsanweisung: '', quelleId: undefined, clue: undefined };

  switch (typ) {
    case 'lueckentext':
      return {
        ...base,
        typ: 'lueckentext',
        config: {
          anzahlLuecken: 6,
          wortbank: meta ? isWortbankEnabled(meta.stufe) : false,
          distraktoren: 0,
        },
        loesung: { luecken: [] },
      } as Block;
    case 'matching':
      return {
        ...base,
        typ: 'matching',
        config: {
          items: [{ nr: 1, prompt: '' }, { nr: 2, prompt: '' }],
          optionen: [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }],
        },
        loesung: { zuordnung: {} },
      } as Block;
    case 'multipleChoice':
      return {
        ...base,
        typ: 'multipleChoice',
        config: {
          fragen: [{
            nr: 1, frage: '',
            optionen: [{ key: 'A', text: '' }, { key: 'B', text: '' }],
            mehrfach: false,
          }],
        },
        loesung: { antworten: {} },
      } as Block;
    case 'offeneVerstaendnisfrage':
      return {
        ...base,
        typ: 'offeneVerstaendnisfrage',
        config: {
          fragen: [{ nr: 1, frage: '', zeilen: 4 }],
        },
        loesung: { antworten: {} },
      } as Block;
    case 'offeneSchreibaufgabe':
      return {
        ...base,
        typ: 'offeneSchreibaufgabe',
        punkte: 30,
        config: {
          situation: '',
          textsorte: '',
          umfangWorte: { min: 200, max: 300 },
          aspekte: [''],
        },
        loesung: { musterloesung: '', erwartungshorizont: { inhalt: '', struktur: '', ausdruck: '', sprachrichtigkeit: '' } },
      } as Block;
    case 'markieraufgabe':
      return {
        ...base,
        typ: 'markieraufgabe',
        config: { quelleId: '', anweisung: '' },
        loesung: { stellen: [] },
      } as Block;
  }
}

const BLOCK_LABELS: Record<Block['typ'], string> = {
  lueckentext: 'Lückentext',
  matching: 'Matching',
  multipleChoice: 'Multiple Choice',
  offeneVerstaendnisfrage: 'Verständnisfrage',
  offeneSchreibaufgabe: 'Schreibaufgabe',
  markieraufgabe: 'Markieraufgabe',
};

export function getBlockLabel(typ: Block['typ']): string {
  return BLOCK_LABELS[typ];
}
