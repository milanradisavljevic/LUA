import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Block, Meta } from '@lehrunterlagen/schema';
import type { AppAction } from '../lib/types';
import { getBlockLabel, BLOCK_ARBEITSANWEISUNG_PLACEHOLDER } from '../lib/blockDefaults';
import { BLOCK_TYPE_DEFS } from '../lib/constants';
import { BlockConfigPanel } from './BlockConfigPanel';

interface Props {
  block: Block;
  dispatch: React.Dispatch<AppAction>;
  stufe: Meta['stufe'];
  index?: number;
}

export function BlockCard({ block, dispatch, stufe, index }: Props) {
  const typeDef = BLOCK_TYPE_DEFS.find((bt) => bt.id === block.typ);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    padding: '1rem',
    border: '1px solid var(--color-gray-2)',
    borderRadius: 'var(--radius)',
    background: 'white',
  };

  const handleRemove = () => dispatch({ type: 'REMOVE_BLOCK', id: block.id });

  const handleChange = (field: string, value: unknown) => {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, block: { [field]: value } as Partial<Block> });
  };

  const handleConfigChange = (config: Record<string, unknown>) => {
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, block: { config } as unknown as Partial<Block> });
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button {...attributes} {...listeners}
          aria-label={`Block „${getBlockLabel(block.typ)}" verschieben`}
          style={{
            cursor: 'grab', background: 'none', border: 'none', padding: '0.25rem',
            color: 'var(--color-gray-1)', fontSize: '1rem', lineHeight: 1,
          }}
          title="Verschieben">
          <span aria-hidden="true">⠿</span>
        </button>
        {index !== undefined && (
          <span style={{
            background: typeDef?.color ?? 'var(--color-accent)',
            color: 'white',
            padding: '0.125rem 0.5rem', borderRadius: '3px',
            fontSize: '0.75rem', fontWeight: 600,
            minWidth: 24, textAlign: 'center',
          }}>
            {index}
          </span>
        )}
        <span style={{
          background: '#e8f0fe', color: 'var(--color-accent)',
          padding: '0.125rem 0.5rem', borderRadius: '3px',
          fontSize: '0.75rem', fontWeight: 600,
        }}>
          {getBlockLabel(block.typ)}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Punkte</label>
          <input type="number" min={1} value={block.punkte}
            aria-label="Punkte für diesen Block"
            onChange={(e) => handleChange('punkte', parseInt(e.target.value) || 0)}
            style={{ width: 64, padding: '0.25rem 0.5rem' }} />
        </div>
        <button className="btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          onClick={handleRemove}
          aria-label={`Block „${getBlockLabel(block.typ)}" entfernen`}
          title="Entfernen">
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label>Arbeitsanweisung</label>
        <input type="text" value={block.arbeitsanweisung}
          placeholder={BLOCK_ARBEITSANWEISUNG_PLACEHOLDER[block.typ]}
          onChange={(e) => handleChange('arbeitsanweisung', e.target.value)} />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label>Clue (optional, kursiv)</label>
        <input type="text" value={block.clue ?? ''}
          placeholder="Hinweis in Klammern (kursiv)"
          onChange={(e) => handleChange('clue', e.target.value || undefined)} />
      </div>

      <BlockConfigPanel block={block} stufe={stufe} onConfigChange={handleConfigChange} />
    </div>
  );
}
