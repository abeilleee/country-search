import { BASE_URL, Endpoint, HttpStatus, TIMEOUT_MS } from '@/constants';
import type { ResponseBody } from '@/types';
import { HttpError } from './HttpError';

/**
 * Searches countries by name.
 *
 * Sends `GET {BASE_URL}/{Endpoint.Name}/{query}` and combines the caller's
 * `signal` with an internal timeout via `AbortSignal.any`, so the request is
 * aborted on user cancellation or timeout
 *
 *  * Response semantics:
 * - `200` → returns (array of countries)
 * - `404` → returns `[]`
 * - other non-2xx → throws `HttpError` with `status`
 * - `AbortError`, `TimeoutError`, network `TypeError` are propagated as-is
 *
 * @param query — search string
 * @param signal — optional `AbortSignal` for cancellation
 * @returns Array of countries, or `[]` when there are no matches
 * @throws {HttpError} On non-2xx status other than 404
 * @throws {DOMException} `AbortError` on cancellation, `TimeoutError` on timeout
 * @throws {TypeError} On network failure
 */
export async function searchCountries(query: string, signal?: AbortSignal) {
  const combined = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)])
    : AbortSignal.timeout(TIMEOUT_MS);

  const response = await fetch(`${BASE_URL}/${Endpoint.Name}/${encodeURIComponent(query)}`, {
    signal: combined,
  });

  if (!response.ok) {
    if (response.status === HttpStatus.NotFound) {
      return [];
    }

    throw new HttpError(response.status);
  }

  return (await response.json()) as ResponseBody;
}
