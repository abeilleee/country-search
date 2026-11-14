export interface CountryDto {
  name: string;
  topLevelDomain?: string[];
  alpha2Code: string;
  alpha3Code: string;
  callingCodes?: string[];
  capital?: string;
  altSpellings?: string[];
  subregion?: string;
  region: string;
  population?: number;
  latlng?: number[];
  demonym?: string;
  area?: number;
  timezones?: string[];
  /**
   * ISO 3166-1 alpha-3 codes of neighbouring countries.
   */
  borders?: string[];
  nativeName?: string;
  numericCode?: string;
  flags?: FlagsDto;
  currencies?: CurrencyDto[];
  languages?: LanguageDto[];
  /**
   * Unicode flag emoji, derived from the ISO 3166-1 alpha-2 code.
   */
  flag?: string;
  maps?: MapsDto;
  /**
   * People per km² (population ÷ area), or null when area is unknown.
   */
  populationDensity?: number;
}

export interface FlagsDto {
  /**
   * @format `uri`
   */
  svg?: string;

  /**
   * @format `uri`
   */
  png?: string;
}

export interface CurrencyDto {
  code?: string;
  name?: string;
  symbol?: string;
}

export interface LanguageDto {
  iso639_1?: string;
  iso639_2?: string;
  name?: string;
  nativeName?: string;
}

/**
 * Links to the country's location on popular map services.
 */
export interface MapsDto {
  /**
   * @format `uri`
   */
  googleMaps?: string;

  /**
   * @format `uri`
   */
  openStreetMaps?: string;
}

export interface ElementOptions {
  tag?: string;
  classNames?: string[];
  textContent?: string;
  parentElement?: HTMLElement;
  children?: HTMLElement[];
  attributes?: Record<string, string>;
}

export type ResponseBody = CountryDto[];
