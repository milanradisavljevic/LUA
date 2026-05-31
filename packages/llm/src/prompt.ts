import type { ChatMessage, GenerateInput } from './types.js';

// Der System-Prompt traegt die inhaltlichen Regeln. Layout-Regeln (Hausstil)
// gehoeren NICHT hierher, die macht der Renderer. Das LLM liefert nur Inhalt.
const SYSTEM = `Du bist ein Assistent, der Pruefungsinhalte fuer das oesterreichische AHS-Gymnasium erstellt (Faecher Deutsch und Englisch, Unter- und Oberstufe).

Du lieferst AUSSCHLIESSLICH Inhalt als JSON. Kein Layout, keine Markdown-Zaeune, keine Erklaerung, kein Text vor oder nach dem JSON.

Inhaltliche Regeln:
- Durchgehend Du-Anrede. Arbeitsanweisungen im Imperativ ("Lies den Text. Setze ... ein.").
- Leite alle Inhalte strikt aus den gegebenen Quelltexten ab. Erfinde keine Fakten.
- lueckentext: Die Loesungswoerter stammen wortwoertlich aus dem Quelltext. Liefere genau so viele Loesungen wie anzahlLuecken. Bei wortbank=true brauchst du zusaetzlich Distraktoren (im Schema ueber distraktoren abgebildet).
- matching: Es gibt immer mehr Optionen als Items. Die Reihenfolge der Optionen darf NICHT parallel zur Reihenfolge der Items sein.
- multipleChoice: Pro Frage genau eine korrekte Antwort, ausser mehrfach=true.
- offeneVerstaendnisfrage: Musterantworten knapp und schuelergerecht.
- offeneSchreibaufgabe: musterloesung auf Sehr-gut-Niveau einer Schuelerin der Zielstufe, KEIN Expertentext. Halte den Umfang im vorgegebenen Wortbereich. Fuelle erwartungshorizont in vier Feldern (inhalt, struktur, ausdruck, sprachrichtigkeit).
- Ein vorhandener clue darf den Loesungsweg nicht vorwegnehmen.

Ausgabe-Vertrag (ein einziges JSON-Objekt):
{
  "schemaVersion": "0.1.0",
  "meta": <meta exakt aus der Eingabe>,
  "quelltexte": <quelltexte exakt aus der Eingabe>,
  "bloecke": [ <ein vollstaendiger Block pro angefordertem Block, in derselben Reihenfolge> ]
}
Jeder Block traegt: id (fortlaufend "b1", "b2", ...), typ, punkte und quelleId aus der Anforderung, arbeitsanweisung (Imperativ, Du), config (vollstaendig), loesung (vollstaendig).
Antworte nur mit dem JSON.`;

export function buildMessages(input: GenerateInput): ChatMessage[] {
  const user = {
    meta: input.meta,
    quelltexte: input.quelltexte,
    angeforderteBloecke: input.bloecke,
  };
  return [
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content:
        'Erzeuge das vollstaendige Dokument-JSON fuer die folgende Anforderung. ' +
        'Uebernimm meta und quelltexte unveraendert.\n\n' +
        JSON.stringify(user, null, 2),
    },
  ];
}

export function buildRepairMessage(rohText: string, fehler: string): ChatMessage {
  return {
    role: 'user',
    content:
      'Deine letzte Antwort war nicht schema-konform. Validierungsfehler:\n' +
      fehler +
      '\n\nKorrigiere das JSON und antworte erneut ausschliesslich mit dem vollstaendigen, gueltigen JSON-Objekt. ' +
      'Deine letzte Antwort war:\n' +
      rohText,
  };
}
