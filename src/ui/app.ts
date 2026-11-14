import { createDomElement } from '@/helpers/createDomElement';
import { createFooter } from '@/ui/components/Footer';
import { createHeader } from '@/ui/components/Header';

export function startApp() {
  document.body.classList.add('layout');

  const header = createHeader();
  const footer = createFooter();
  const main = createDomElement({
    tag: 'main',
    classNames: ['main', 'liquid'],
  });

  document.body.append(header, main, footer);
}
