import { useState, useCallback } from 'react';
import type { DocumentV1 } from '@lehrunterlagen/schema';
import type { AppState } from '../lib/types';

export function useExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportDocx = useCallback(async (state: AppState) => {
    setExporting(true);
    setError(null);

    try {
      const { renderDocument } = await import('@lehrunterlagen/renderer');

      const doc: DocumentV1 = {
        schemaVersion: '0.1.0',
        meta: state.meta,
        quelltexte: state.quelltexte,
        bloecke: state.bloecke,
      };

      const result = await renderDocument(doc);

      downloadBuffer(result.schueler.buffer as ArrayBuffer, 'Schuelerfassung.docx');
      downloadBuffer(result.loesung.buffer as ArrayBuffer, 'Loesung.docx');

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

function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
