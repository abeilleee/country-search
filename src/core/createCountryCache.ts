import { type Country, mapCountryResponse } from './mapCountryResponse';
import { searchCountries } from './searchCountries';

export interface CountryCache {
  get: (query: string, signal?: AbortSignal) => Promise<Country[]>;
}

interface PendingRequest {
  /** Shared fetch promise */
  promise: Promise<Country[]>;
  /** Aborts the shared promise when no waiters remain */
  controller: AbortController;
  /** Active callers still awaiting this request */
  waiters: number;
}

const normalize = (query: string): string => query.trim().toLowerCase();
const abortError = (): DOMException => new DOMException('The operation was aborted.', 'AbortError');

/**
 * Subscribes a caller to an in-flight (pending) request
 *
 * Cancelling the caller's signal rejects only THIS caller - the shared fetch
 * keeps running for others. The fetch is aborted only when the last waiter
 * detaches (nobody needs the result anymore).
 */
function attachCaller(
  key: string,
  request: PendingRequest,
  pending: Map<string, PendingRequest>,
  signal?: AbortSignal,
): Promise<Country[]> {
  if (signal?.aborted) {
    return Promise.reject(signal.reason ?? abortError());
  }

  request.waiters += 1;

  return new Promise<Country[]>((resolve, reject) => {
    // Ensures this caller completes exactly once: abort or shared-promise settlement, whichever happens first
    let settled = false;

    const cleanup = (): void => {
      signal?.removeEventListener('abort', onAbort);
    };

    const detach = (): void => {
      request.waiters -= 1;

      if (request.waiters === 0) {
        request.controller.abort();
        pending.delete(key);
      }
    };

    const onAbort = (): void => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      detach();
      reject(signal?.reason ?? abortError());
    };

    signal?.addEventListener('abort', onAbort, { once: true });

    // Shared result: resolve this caller, do not abort the fetch
    request.promise.then(
      (countries) => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        request.waiters -= 1;
        resolve(countries);
      },
      (error) => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        request.waiters -= 1;
        reject(error);
      },
    );
  });
}

export function createCountryCache(): CountryCache {
  const cache = new Map<string, Country[]>();
  const pending = new Map<string, PendingRequest>();

  return {
    get(query: string, signal?: AbortSignal): Promise<Country[]> {
      const key = normalize(query);

      if (signal?.aborted) {
        return Promise.reject(signal.reason ?? abortError());
      }

      const cached = cache.get(key);

      if (cached) {
        return Promise.resolve(cached);
      }

      // Dedup: reuse the in-flight promise, attach caller with its own signal
      const existing = pending.get(key);

      if (existing) {
        return attachCaller(key, existing, pending, signal);
      }

      // New request: run fetch with the INTERNAL controller (not the caller'signal)
      const controller = new AbortController();

      const request: PendingRequest = {
        controller,
        waiters: 0,
        promise: searchCountries(query, controller.signal)
          .then((raw) => {
            const countries = raw.map(mapCountryResponse);
            cache.set(key, countries);
            pending.delete(key);

            return countries;
          })
          .catch((error) => {
            pending.delete(key);
            throw error;
          }),
      };

      pending.set(key, request);
      return attachCaller(key, request, pending, signal);
    },
  };
}

export const countryCache = createCountryCache();
