import type { Block } from '@lehrunterlagen/schema';
import { BlockPreviewLueckentext } from './BlockPreviewLueckentext';
import { BlockPreviewMatching } from './BlockPreviewMatching';
import { BlockPreviewMultipleChoice } from './BlockPreviewMultipleChoice';
import { BlockPreviewVerstaendnisfrage } from './BlockPreviewVerstaendnisfrage';
import { BlockPreviewSchreibaufgabe } from './BlockPreviewSchreibaufgabe';
import { BlockPreviewMarkieraufgabe } from './BlockPreviewMarkieraufgabe';

interface Props {
  block: Block;
  showSolution: boolean;
  onUpdate?: (id: string, field: string, value: unknown) => void;
}

export function BlockPreview({ block, showSolution, onUpdate }: Props) {
  const pass = (C: React.ComponentType<{
    block: Block; showSolution: boolean;
    onUpdate?: (id: string, field: string, value: unknown) => void;
  }>) => (
    <C block={block} showSolution={showSolution}
      {...(onUpdate ? { onUpdate } : {})} />
  );

  switch (block.typ) {
    case 'lueckentext':
      return pass(BlockPreviewLueckentext);
    case 'matching':
      return pass(BlockPreviewMatching);
    case 'multipleChoice':
      return pass(BlockPreviewMultipleChoice);
    case 'offeneVerstaendnisfrage':
      return pass(BlockPreviewVerstaendnisfrage);
    case 'offeneSchreibaufgabe':
      return pass(BlockPreviewSchreibaufgabe);
    case 'markieraufgabe':
      return pass(BlockPreviewMarkieraufgabe);
  }
}
