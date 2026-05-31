import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Block } from '@lehrunterlagen/schema';
import type { AppState, AppAction } from '../lib/types';
import { BLOCK_TYPE_DEFS, STUFE_RULES } from '../lib/constants';
import { createDefaultBlock } from '../lib/blockDefaults';
import { useBlocks } from '../hooks/useBlocks';
import { BlockCard } from './BlockCard';
import { PointSummary } from './PointSummary';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export function Step2_Baukasten({ state, dispatch }: Props) {
  const { addBlock, reorderBlocks } = useBlocks(dispatch);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const allowedTypes = STUFE_RULES[state.meta.stufe].allowedBlockTypes;
  const availableBlocks = BLOCK_TYPE_DEFS.filter((bt) =>
    (allowedTypes as readonly string[]).includes(bt.id),
  );

  const handleAddBlock = (typ: Block['typ']) => {
    const block = createDefaultBlock(typ, state.meta);
    addBlock(block);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = state.bloecke.findIndex((b) => b.id === active.id);
    const newIndex = state.bloecke.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...state.bloecke];
    const [moved] = reordered.splice(oldIndex, 1);
    if (moved) reordered.splice(newIndex, 0, moved);
    reorderBlocks(reordered);
  };

  const totalPoints = state.bloecke.reduce((sum, b) => sum + b.punkte, 0);

  return (
    <div>
      <h2 style={{ marginBottom: '1.25rem' }}>Aufgabenblöcke zusammenstellen</h2>

      {/* Kartengalerie */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ marginBottom: '0.75rem', display: 'block' }}>Blocktyp hinzufügen</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {availableBlocks.map((bt) => (
            <button
              key={bt.id}
              onClick={() => handleAddBlock(bt.id)}
              className="btn-secondary"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem',
                textAlign: 'center',
                borderLeft: `4px solid ${bt.color}`,
                background: 'white',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{bt.icon}</span>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{bt.label}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-1)' }}>{bt.description}</span>
              {bt.id === 'lueckentext' && !STUFE_RULES[state.meta.stufe].wortbankAllowed && (
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-gray-1)' }}>
                  (Wortbank nur Unterstufe)
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <PointSummary totalPoints={totalPoints} blockCount={state.bloecke.length} />

      {state.bloecke.length === 0 ? (
        <p style={{ color: 'var(--color-gray-1)', textAlign: 'center', padding: '3rem 0' }}>
          Noch keine Aufgabenblöcke. Wähle oben einen Blocktyp und füge ihn hinzu.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={state.bloecke.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {state.bloecke.map((block, index) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  dispatch={dispatch}
                  stufe={state.meta.stufe}
                  index={index + 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
