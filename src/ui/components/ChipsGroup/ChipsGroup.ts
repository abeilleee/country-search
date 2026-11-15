import { createDomElement } from '@/helpers/createDomElement';
import type { ElementOptions } from '@/types';
import styles from './ChipsGroup.module.css';

interface Props extends Partial<Pick<ElementOptions, 'parentElement' | 'classNames'>> {
  items: string[];
  label?: string;
}

export function createChipsGroup({ label, items, parentElement, classNames = [] }: Props) {
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
    createDomElement({
      tag: 'li',
      classNames: [styles.chip],
      textContent: item,
      parentElement: chips,
    });
  });

  return group;
}
