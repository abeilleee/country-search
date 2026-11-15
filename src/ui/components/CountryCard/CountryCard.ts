import type { Country } from '@/core/mapCountryResponse';
import { createDomElement } from '@/helpers/createDomElement';
import type { ElementOptions } from '@/types';
import styles from './CountryCard.module.css';

interface Props extends Partial<Pick<ElementOptions, 'parentElement'>> {
  country: Country;
}

export function createCountryCard({ country, parentElement }: Props) {
  const card = createDomElement({
    classNames: [styles.card, 'glass'],
    parentElement,
  });

  const upperBox = createDomElement({
    classNames: [styles.box],
    parentElement: card,
  });

  createDomElement({
    tag: 'h2',
    classNames: [styles.name],
    textContent: country.name,
    parentElement: upperBox,
  });

  if (country.flags?.svg || country.flags?.png) {
    createDomElement({
      tag: 'img',
      classNames: [styles.flag],
      attributes: {
        src: country.flags.svg ?? country.flags.png ?? '',
        alt: `Flag of ${country.name}`,
        loading: 'lazy',
      },
      parentElement: upperBox,
    });
  }

  const meta = createDomElement({
    tag: 'dl',
    classNames: [styles.meta],
    parentElement: card,
  });

  const rows: Array<[string, string]> = [
    ['Region', country.region || '—'],
    ['Capital', country.capital || '—'],
    ['Population', country.population?.toLocaleString() ?? '—'],
  ];

  rows.forEach(([label, value]) => {
    createDomElement({ tag: 'dt', textContent: label, parentElement: meta });
    createDomElement({ tag: 'dd', textContent: value, parentElement: meta });
  });

  return card;
}
