export const DEFAULT_DELAY_MS = 300;
export const TIMEOUT_MS = 5000;
export const BASE_URL = 'https://countries.dev';
export const HISTORY_KEY = 'abeilleee-country-search:history';
export const HISTORY_LIMIT = 5;

export const enum Endpoint {
  Name = 'name',
}

export enum HttpStatus {
  Success = 200,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  RequestTimeout = 408,
  TooManyRequests = 429,
  InternalServerError = 500,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
}

export enum SearchFailure {
  Aborted = 'aborted',
  Timeout = 'timeout',
  Http = 'http',
  Network = 'network',
  Unknown = 'unknown',
}
