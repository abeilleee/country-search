import { createDomElement } from '@/helpers/createDomElement';
import type { ElementOptions } from '@/types';

interface Props extends Partial<
  Pick<ElementOptions, 'parentElement' | 'classNames' | 'attributes'>
> {
  text?: string;
  onClick: () => void;
}

export function createButton({
  text,
  onClick,
  parentElement,
  classNames = [],
  attributes = {},
}: Props) {
  const button = createDomElement<HTMLButtonElement>({
    tag: 'button',
    classNames,
    textContent: text,
    attributes,
    parentElement,
  });

  button.addEventListener('click', onClick);

  return button;
}
