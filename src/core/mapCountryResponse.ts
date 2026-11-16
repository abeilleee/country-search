import type { CountryDto, CurrencyDto, FlagsDto, LanguageDto } from '@/types';

const toLanguage = (dto: LanguageDto) => {
  return {
    name: dto.name ?? null,
    nativeName: dto.nativeName ?? dto.name ?? null,
  };
};

const toCurrency = (dto: CurrencyDto) => {
  return {
    code: dto.code ?? null,
    name: dto.name ?? null,
    symbol: dto.symbol ?? null,
  };
};

const toFlags = (dto: FlagsDto) => {
  return {
    png: dto.png ?? null,
    svg: dto.svg ?? null,
  };
};

/**
 * Maps a raw country response (`CountryDto`) into the normalized UI shape (`Country`)
 *
 * @param raw `CountryDto`
 * @returns object `Country`
 */
export function mapCountryResponse(raw: CountryDto) {
  return {
    name: raw.name,
    region: raw.region,
    capital: raw.capital ?? null,
    population: raw.population ?? null,
    area: raw.area ?? null,
    languages: (raw.languages ?? []).map(toLanguage),
    currencies: (raw.currencies ?? []).map(toCurrency),
    flags: toFlags(raw.flags ?? {}),
    borders: [...(raw.borders ?? [])],
  };
}

export type Language = ReturnType<typeof toLanguage>;
export type Currency = ReturnType<typeof toCurrency>;
export type Flag = ReturnType<typeof toFlags>;
export type Country = ReturnType<typeof mapCountryResponse>;
