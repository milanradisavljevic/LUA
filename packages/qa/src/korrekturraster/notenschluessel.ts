import type { Notenstufe } from './types';

const STANDARD_SCHLUESSEL: Omit<Notenstufe, 'minPunkte' | 'maxPunkte'>[] = [
  { note: 1, bezeichnung: 'Sehr gut', minProzent: 87, maxProzent: 100 },
  { note: 2, bezeichnung: 'Gut', minProzent: 73, maxProzent: 86 },
  { note: 3, bezeichnung: 'Befriedigend', minProzent: 59, maxProzent: 72 },
  { note: 4, bezeichnung: 'Genuegend', minProzent: 45, maxProzent: 58 },
  { note: 5, bezeichnung: 'Nicht genuegend', minProzent: 0, maxProzent: 44 },
];

export function berechneNotenschluessel(gesamtPunkte: number): Notenstufe[] {
  return STANDARD_SCHLUESSEL.map((s) => ({
    ...s,
    minPunkte: Math.ceil(gesamtPunkte * s.minProzent / 100),
    maxPunkte: Math.floor(gesamtPunkte * s.maxProzent / 100),
  }));
}
