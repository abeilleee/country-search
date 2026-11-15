import { createDomElement } from '@/helpers/createDomElement';
import type { ElementOptions } from '@/types';
import { createButton } from '@/ui/components/Button';
import { createChipsGroup } from '@/ui/components/ChipsGroup';
import styles from './SearchHistory.module.css';

interface Props extends Partial<Pick<ElementOptions, 'parentElement'>> {
  items: string[];
  onSelect: (query: string) => void;
  onClear: () => void;
}

export function createSearchHistoryPanel({ items, onSelect, onClear, parentElement }: Props) {
  const panel = createDomElement({ classNames: [styles.panel], parentElement });

  createButton({
    classNames: [styles.clear],
    text: 'Clear',
    onClick: onClear,
    parentElement: panel,
  });

  createChipsGroup({ items, onClick: onSelect, parentElement: panel });

  return panel;
}
