import { createDomElement } from '@/helpers/createDomElement';
import type { ElementOptions } from '@/types';
import styles from './Spinner.module.css';

interface Props extends Partial<Pick<ElementOptions, 'parentElement'>> {
  label?: string;
}

export function createSpinner({ label = 'Loading', parentElement }: Props) {
  const wrapper = createDomElement({
    tag: 'span',
    classNames: [styles.wrapper],
    parentElement,
  });

  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-live', 'polite');

  createDomElement({
    tag: 'span',
    classNames: [styles.spinner],
    attributes: { 'aria-hidden': 'true' },
    parentElement: wrapper,
  });

  createDomElement({
    tag: 'span',
    classNames: [styles.label],
    textContent: label,
    parentElement: wrapper,
  });

  return wrapper;
}
