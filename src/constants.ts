export const DEFAULT_DELAY_MS = 300;
export const TIMEOUT_MS = 5000;
export const BASE_URL = 'https://countries.dev';

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
