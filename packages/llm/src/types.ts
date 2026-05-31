import type { DocumentV1, Meta, QuellText, Block } from '@lehrunterlagen/schema';

// Anbieter-Kennung. In Phase 2 ist nur 'anthropic' implementiert,
// 'openai' und 'kimi' folgen in Phase 5 (siehe TASKS.md 5.1, 5.2).
export type ProviderId = 'anthropic' | 'openai' | 'kimi';

export interface ProviderConfig {
  provider: ProviderId;
  /** API-Modellname, z. B. 'claude-sonnet-4-6'. Faellt auf Anbieter-Default zurueck. */
  model?: string;
  /** Wird sonst aus der Umgebungsvariable des Anbieters gelesen. Nie hartkodieren. */
  apiKey?: string;
  /** 0..1, wird auf temperature gemappt. Default 0.4. */
  kreativitaet?: number;
}

// Vom Nutzer im Baukasten gewaehlte Vorgaben pro Block.
// Inhalt und Loesung erzeugt das LLM, diese Felder gibt die Lehrkraft vor.
export type BlockRequest =
  | { typ: 'lueckentext'; punkte: number; quelleId?: string; anzahlLuecken: number; wortbank: boolean; distraktoren: number }
  | { typ: 'matching'; punkte: number; quelleId?: string; anzahlItems: number }
  | { typ: 'multipleChoice'; punkte: number; quelleId?: string; anzahlFragen: number; mehrfach: boolean }
  | { typ: 'offeneVerstaendnisfrage'; punkte: number; quelleId?: string; anzahlFragen: number }
  | {
      typ: 'offeneSchreibaufgabe';
      punkte: number;
      quelleId?: string;
      textsorte: string;
      situation?: string;
      umfangWorte: { min: number; max: number };
      aspekte: string[];
    }
  | { typ: 'markieraufgabe'; punkte: number; quelleId: string; anweisung: string };

export type BlockTyp = Block['typ'];

export interface GenerateInput {
  meta: Meta;
  quelltexte: QuellText[];
  bloecke: BlockRequest[];
}

export interface GenerateOk {
  ok: true;
  document: DocumentV1;
  rohText: string;
  versuche: number;
}

export interface GenerateError {
  ok: false;
  fehler: string;
  rohText?: string;
  versuche: number;
}

export type GenerateResult = GenerateOk | GenerateError;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Provider {
  id: ProviderId;
  complete(messages: ChatMessage[], cfg: ProviderConfig, input?: GenerateInput): Promise<string>;
}
