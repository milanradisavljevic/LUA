import { useState, useCallback } from 'react';
import type { AppState } from '../lib/types';

export function useExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportDocx = useCallback(async (state: AppState) => {
    if (!state.generiertesDokument) {
      setError('Bitte zuerst Inhalt generieren.');
      return false;
    }
    setExporting(true);
    setError(null);

    try {
      const { renderDocumentToBlobs } = await import('@lehrunterlagen/renderer');
      const { schueler, loesung } = await renderDocumentToBlobs(state.generiertesDokument);

      const thema = state.generiertesDokument.meta.thema.replace(/\s+/g, '_').slice(0, 40);
      const datum = state.generiertesDokument.meta.datum;

      downloadBlob(schueler, `${datum}_${thema}_Schuelerfassung.docx`);
      downloadBlob(loesung, `${datum}_${thema}_Loesung.docx`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler beim Export';
      setError(msg);
      return false;
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportDocx, exporting, error };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
