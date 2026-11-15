import { createDomElement } from '@/helpers/createDomElement';
import type { ElementOptions } from '@/types';
import styles from './SearchInput.module.css';

interface Props extends Partial<Pick<ElementOptions, 'attributes' | 'parentElement'>> {
  onChange: (query: string) => void;
}

export function createSearchInput({ onChange, attributes = {}, parentElement }: Props) {
  const input = createDomElement<HTMLInputElement>({
    tag: 'input',
    classNames: [styles.input, 'glass'],
    attributes: { type: 'search', placeholder: 'Search countries...', ...attributes },
    parentElement,
  });

  input.addEventListener('input', () => {
    onChange(input.value);
  });

  return input;
}
