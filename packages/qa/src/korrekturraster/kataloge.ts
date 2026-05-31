export interface KriterienKatalog {
  kriterium: string;
  beschreibung: string;
  maxPunkte: number;
}

// ---------------------------------------------------------------------------
// Deutsch -- Zusammenfassung (Unterstufe, Oberstufe)
// ---------------------------------------------------------------------------

export const ZUSAMMENFASSUNG: KriterienKatalog[] = [
  { kriterium: 'Inhalt / Vollstaendigkeit', beschreibung: 'Alle wesentlichen Informationen vorhanden; keine Auslassungen, keine Erfindungen', maxPunkte: 10 },
  { kriterium: 'Eigene Formulierung', beschreibung: 'Keine wörtlichen Uebernahmen; Inhalt in eigenen Worten; Fachbegriffe korrekt uebernommen', maxPunkte: 6 },
  { kriterium: 'Struktur / Gliederung', beschreibung: 'Sinnvolle Einleitung, logisch geordneter Hauptteil; Abschnitte klar erkennbar', maxPunkte: 6 },
  { kriterium: 'Sprachliche Korrektheit', beschreibung: 'Grammatik, Rechtschreibung, Beistrichsetzung', maxPunkte: 6 },
  { kriterium: 'Textverknuepfung', beschreibung: 'Kohaesionsmittel (Konjunktionen, Pronomen, Verweiswoerter) verwendet', maxPunkte: 4 },
  { kriterium: 'Wortanzahl', beschreibung: 'Geforderte Wortanzahl eingehalten und angegeben', maxPunkte: 2 },
];

// ---------------------------------------------------------------------------
// Deutsch -- Erörterung / Stellungnahme (Oberstufe)
// ---------------------------------------------------------------------------

export const ERORTERUNG: KriterienKatalog[] = [
  { kriterium: 'Aufgabenerfuellung / Thema', beschreibung: 'Thema klar erkannt; Schreibziel (Textsortenmerkmal) eingehalten', maxPunkte: 6 },
  { kriterium: 'Argumentation', beschreibung: 'Argumente nachvollziehbar, belegt, differenziert; keine Scheinargumente', maxPunkte: 12 },
  { kriterium: 'Struktur', beschreibung: 'Einleitung -- Hauptteil -- Schluss erkennbar und funktional', maxPunkte: 6 },
  { kriterium: 'Ausdrucksvermoegen / Stilistik', beschreibung: 'Abwechslungsreicher Wortschatz; angemessenes Register', maxPunkte: 6 },
  { kriterium: 'Sprachliche Korrektheit', beschreibung: 'Grammatik, Rechtschreibung, Zeichensetzung', maxPunkte: 6 },
  { kriterium: 'Textverknuepfung', beschreibung: 'Logische Uebergaenge, Kohaesionsmittel', maxPunkte: 4 },
];

// ---------------------------------------------------------------------------
// Deutsch -- Textanalyse / Textinterpretation (Oberstufe)
// ---------------------------------------------------------------------------

export const TEXTANALYSE: KriterienKatalog[] = [
  { kriterium: 'Aufgabenerfuellung', beschreibung: 'Analysefokus korrekt; Textsorte korrekt benannt', maxPunkte: 4 },
  { kriterium: 'Inhaltserfassung', beschreibung: 'Kernaussagen richtig erkannt und beschrieben', maxPunkte: 8 },
  { kriterium: 'Analysetiefe', beschreibung: 'Sprachliche Mittel benannt, belegt, gedeutet', maxPunkte: 10 },
  { kriterium: 'Struktur', beschreibung: 'Sinnvoller Aufbau; klare Abschnittsgliederung', maxPunkte: 6 },
  { kriterium: 'Ausdruck / Stil', beschreibung: 'Sachlich-analytisches Register; Fachvokabular korrekt', maxPunkte: 6 },
  { kriterium: 'Sprachrichtigkeit', beschreibung: 'Grammatik, Rechtschreibung, Zeichensetzung', maxPunkte: 6 },
];

// ---------------------------------------------------------------------------
// Englisch -- Open Writing Task (Oberstufe, SRDP-kompatibel)
// ---------------------------------------------------------------------------

export const OPEN_WRITING: KriterienKatalog[] = [
  { kriterium: 'Task Achievement', beschreibung: 'Aufgabe vollstaendig erfuellt; Schreibziel erreicht; Adressatenbezug', maxPunkte: 10 },
  { kriterium: 'Organisation & Kohaerenz', beschreibung: 'Logischer Aufbau; Uebergaenge; Textsortenmerkmale eingehalten', maxPunkte: 8 },
  { kriterium: 'Lexical Range & Accuracy', beschreibung: 'Wortschatzbreite; korrekte Verwendung; Kollokationen', maxPunkte: 8 },
  { kriterium: 'Grammatical Range & Accuracy', beschreibung: 'Varietaet der Strukturen; wenige Fehler; Zeichensetzung', maxPunkte: 8 },
];

// ---------------------------------------------------------------------------
// Englisch -- Reading Comprehension / offene Fragen (Unter- und Oberstufe)
// ---------------------------------------------------------------------------

export function readingComprehension(anzahlFragen: number): KriterienKatalog[] {
  const katalog: KriterienKatalog[] = [];
  for (let i = 1; i <= anzahlFragen; i++) {
    katalog.push(
      { kriterium: `Frage ${i} — Aufgabenerfuellung`, beschreibung: 'Frage direkt beantwortet; keine irrelevanten Zusatzinfos', maxPunkte: 2 },
      { kriterium: `Frage ${i} — Sprache`, beschreibung: 'Grammatikalisch korrekt; verstaendlich', maxPunkte: 1 },
    );
  }
  return katalog;
}
