import type { Country } from '@/core/mapCountryResponse';
import { createDomElement } from '@/helpers/createDomElement';
import { createChipsGroup } from '@/ui/components/ChipsGroup';
import styles from './CountryDetails.module.css';

interface Props {
  country: Country;
  onClose: () => void;
}

export function createCountryDetails({ country, onClose }: Props) {
  const overlay = createDomElement({
    classNames: [styles.overlay],
    attributes: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'country-detail-title' },
  });

  const dialog = createDomElement({
    classNames: [styles.dialog, 'glass'],
    parentElement: overlay,
  });

  const closeButton = createDomElement({
    tag: 'button',
    classNames: [styles.close],
    attributes: { type: 'button', 'aria-label': 'Close' },
    parentElement: dialog,
  });

  // title and flag
  const header = createDomElement({ classNames: [styles.header], parentElement: dialog });

  createDomElement({
    tag: 'h2',
    classNames: [styles.title],
    textContent: country.name,
    attributes: { id: 'country-detail-title' },
    parentElement: header,
  });

  if (country.flags?.png || country.flags?.svg) {
    createDomElement({
      tag: 'img',
      classNames: [styles.flag],
      attributes: {
        src: country.flags.png ?? country.flags.svg ?? '',
        alt: `Flag of ${country.name}`,
      },
      parentElement: header,
    });
  }

  // labels grid
  const grid = createDomElement({ classNames: [styles.grid], parentElement: dialog });

  const simpleRows: Array<[string, string]> = [
    ['Region', country.region || '—'],
    ['Capital', country.capital || '—'],
    ['Population', country.population?.toLocaleString() ?? '—'],
    ['Area', country.area != null ? `${country.area.toLocaleString()} km²` : '—'],
  ];

  simpleRows.forEach(([label, value]) => {
    createField({ label, value, parentElement: grid });
  });

  createChipsGroup({
    label: 'Languages',
    items: country.languages.map((language) => language.name ?? '—'),
    classNames: [styles.group],
    parentElement: dialog,
  });

  createChipsGroup({
    label: 'Currencies',
    items: country.currencies.map((currency) =>
      [
        currency.name,
        currency.symbol && `(${currency.symbol})`,
        currency.code && `— ${currency.code}`,
      ]
        .filter(Boolean)
        .join(' '),
    ),
    classNames: [styles.group],
    parentElement: dialog,
  });

  if (country.borders.length) {
    createChipsGroup({
      label: 'Borders',
      items: country.borders,
      classNames: [styles.group],
      parentElement: dialog,
    });
  }

  const close = () => {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    onClose();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };

  closeButton.addEventListener('click', close);

  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', onKey);

  return overlay;
}

function createField({
  label,
  value,
  parentElement,
}: {
  label: string;
  value: string;
  parentElement: HTMLElement;
}) {
  const field = createDomElement({ classNames: [styles.field], parentElement });

  createDomElement({
    tag: 'dt',
    classNames: [styles.label],
    textContent: label,
    parentElement: field,
  });

  createDomElement({
    tag: 'dd',
    classNames: [styles.value],
    textContent: value,
    parentElement: field,
  });
}
