import { createDomElement } from '@/helpers/createDomElement';
import type { ElementOptions } from '@/types';
import styles from './Message.module.css';

type MessageVariant = 'info' | 'error';

interface MessageAction {
  label: string;
  onClick: () => void;
}

interface Props extends Partial<Pick<ElementOptions, 'parentElement'>> {
  title: string;
  variant?: MessageVariant;
  description?: string;
  action?: MessageAction;
}

export function createMessage({
  variant = 'info',
  title,
  description,
  action,
  parentElement,
}: Props) {
  const message = createDomElement({
    classNames: [styles.message, styles[variant]],
    parentElement,
  });

  createDomElement({
    tag: 'p',
    classNames: [styles.title],
    textContent: title,
    parentElement: message,
  });

  if (description) {
    createDomElement({
      tag: 'p',
      classNames: [styles.description],
      textContent: description,
      parentElement: message,
    });
  }

  if (action) {
    const button = createDomElement({
      tag: 'button',
      classNames: [styles.action],
      textContent: action.label,
      attributes: { type: 'button' },
      parentElement: message,
    });

    button.addEventListener('click', action.onClick);
  }

  return message;
}
