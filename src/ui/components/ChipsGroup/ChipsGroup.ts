import { createDomElement } from '@/helpers/createDomElement';
import type { ElementOptions } from '@/types';
import { createButton } from '@/ui/components/Button';
import styles from './ChipsGroup.module.css';

interface Props extends Partial<Pick<ElementOptions, 'parentElement' | 'classNames'>> {
  items: string[];
  label?: string;
  onClick?: (item: string) => void;
}

export function createChipsGroup({ label, items, onClick, parentElement, classNames = [] }: Props) {
  const group = createDomElement({
    classNames: [styles.group, ...classNames],
    parentElement,
  });

  if (label) {
    createDomElement({
      tag: 'p',
      classNames: [styles.label],
      textContent: label,
      parentElement: group,
    });
  }

  const chips = createDomElement({
    tag: 'ul',
    classNames: [styles.chips],
    parentElement: group,
  });

  items.forEach((item) => {
    if (onClick) {
      const listItem = createDomElement({ tag: 'li', parentElement: chips });

      createButton({
        classNames: [styles.chip, styles.interactive],
        text: item,
        onClick: () => onClick(item),
        parentElement: listItem,
      });

      return;
    }

    createDomElement({
      tag: 'li',
      classNames: [styles.chip],
      textContent: item,
      parentElement: chips,
    });
  });

  return group;
}
