import type { CountryDto, ResponseBody } from '@/types';
import apiResponse from './__fixtures__/api.json';
import { type Country, mapCountryResponse } from './mapCountryResponse';

const response = apiResponse satisfies ResponseBody;

const byName = (name: string): CountryDto => {
  const country = response.find((item) => item.name === name);

  if (!country) {
    throw new Error(`Missing JSON fixture for "${name}"`);
  }

  return country;
};

const spain = byName('Spain');
const switzerland = byName('Switzerland');
const panama = byName('Panama');
const antarctica = byName('Antarctica');
const zeroLand = byName('Zero Land');
const emptyLists = byName('Empty Lists');

const mappedSpain: Country = {
  name: 'Spain',
  region: 'Europe',
  area: 505992,
  capital: 'Madrid',
  population: 47351567,
  borders: ['AND', 'FRA', 'GIB', 'PRT', 'MAR'],
  languages: [
    {
      name: 'Spanish',
      nativeName: 'Español',
    },
  ],
  currencies: [
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
    },
  ],
  flags: {
    png: 'https://flagcdn.com/w320/es.png',
    svg: 'https://flagcdn.com/es.svg',
  },
};

describe('mapCountryResponse', () => {
  it('maps all basic fields and drops unknown API fields', () => {
    expect(mapCountryResponse(spain)).toEqual(mappedSpain);
  });

  it('does not leak raw-only fields into the result', () => {
    const result = mapCountryResponse(spain);

    expect(result).not.toHaveProperty('gini');
    expect(result).not.toHaveProperty('latlng');
    expect(result).not.toHaveProperty('alpha2Code');
    expect(result).not.toHaveProperty('cioc');
  });

  it('keeps zero values for optional numeric fields', () => {
    expect(mapCountryResponse(zeroLand)).toMatchObject({ area: 0, population: 0 });
  });

  it('fills missing optional fields with null and empty arrays', () => {
    expect(mapCountryResponse(antarctica)).toEqual({
      name: 'Antarctica',
      region: 'Antarctic',
      capital: null,
      population: null,
      area: null,
      languages: [],
      currencies: [],
      flags: { png: null, svg: null },
      borders: [],
    });
  });

  it('fills missing nested values with null', () => {
    const raw: CountryDto = {
      ...antarctica,
      languages: [{}],
      currencies: [{}],
      flags: {},
    };

    expect(mapCountryResponse(raw)).toMatchObject({
      languages: [{ name: null, nativeName: null }],
      currencies: [{ code: null, name: null, symbol: null }],
      flags: { png: null, svg: null },
    });
  });

  it('maps multiple languages and strips their ISO codes', () => {
    expect(mapCountryResponse(switzerland).languages).toEqual([
      { name: 'German', nativeName: 'Deutsch' },
      { name: 'French', nativeName: 'Français' },
      { name: 'Italian', nativeName: 'Italiano' },
      { name: 'Romansh', nativeName: 'Rumantsch' },
    ]);
  });

  it('maps multiple currencies in their original order', () => {
    expect(mapCountryResponse(panama).currencies).toEqual([
      { code: 'PAB', name: 'Panamanian balboa', symbol: 'B/.' },
      { code: 'USD', name: 'United States dollar', symbol: '$' },
    ]);
  });

  it('handles an empty languages array', () => {
    expect(mapCountryResponse(emptyLists).languages).toEqual([]);
  });

  it('handles an empty currencies array', () => {
    expect(mapCountryResponse(emptyLists).currencies).toEqual([]);
  });

  it('does not mutate the input object', () => {
    const snapshot = structuredClone(spain);

    mapCountryResponse(spain);

    expect(spain).toEqual(snapshot);
  });

  it('does not share references with the input', () => {
    const raw = structuredClone(spain);
    const result = mapCountryResponse(raw);

    expect(result.borders).not.toBe(raw.borders);
    expect(result.languages).not.toBe(raw.languages);
    expect(result.languages?.[0]).not.toBe(raw.languages?.[0]);
    expect(result.currencies).not.toBe(raw.currencies);
    expect(result.currencies?.[0]).not.toBe(raw.currencies?.[0]);
    expect(result.flags).not.toBe(raw.flags);
  });

  it('returns a new object on every call', () => {
    expect(mapCountryResponse(spain)).not.toBe(mapCountryResponse(spain));
  });
});
