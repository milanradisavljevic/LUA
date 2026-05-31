interface Props {
  totalPoints: number;
  blockCount: number;
}

export function PointSummary({ totalPoints, blockCount }: Props) {
  return (
    <div style={{
      display: 'flex', gap: '1.5rem', padding: '0.75rem 1rem',
      background: 'var(--color-gray-3)', borderRadius: 'var(--radius)',
      marginBottom: '1rem', fontSize: '0.8125rem',
    }}>
      <span>
        <strong>{blockCount}</strong> Aufgabenblock{blockCount !== 1 ? 'öcke' : ''}
      </span>
      <span>
        <strong>{totalPoints}</strong> Gesamtpunkte
      </span>
    </div>
  );
}
