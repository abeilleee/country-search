import { DEFAULT_DELAY_MS } from '@/constants';
import { createCountrySearch } from '@/store/store';
import type { CountryDto } from '@/types';

interface FetchCall {
  promise: Promise<Response>;
  resolve: (response: Response) => void;
  signal?: AbortSignal | null;
}

const country = (name: string): CountryDto => ({
  name,
  region: 'Europe',
  alpha2Code: 'XX',
  alpha3Code: 'XXX',
});

const jsonResponse = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as Response;

const mockFetch = (): FetchCall[] => {
  const calls: FetchCall[] = [];

  const mockFetch = vi.fn((_url: string, { signal }: RequestInit = {}) => {
    let resolve!: (response: Response) => void;
    let reject!: (reason?: unknown) => void;

    const promise = new Promise<Response>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const abort = () => {
      reject(signal?.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
    };

    if (signal?.aborted) {
      abort();
    } else {
      signal?.addEventListener('abort', abort, { once: true });
    }

    calls.push({ signal, promise, resolve });

    return promise;
  });

  vi.stubGlobal('fetch', mockFetch);

  return calls;
};

describe('createCountrySearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const firstQuery = 'sp';
  const secondQuery = 'spain';

  it('keeps only the latest result when the older response resolves later', async () => {
    const calls = mockFetch();
    const search = createCountrySearch();

    search.fetchCountries(firstQuery);
    await vi.advanceTimersByTimeAsync(DEFAULT_DELAY_MS);

    expect(calls).toHaveLength(1);

    const first = calls[0];
    const firstOutcome = first.promise.catch((error: unknown) => error);

    search.fetchCountries(secondQuery);
    await vi.advanceTimersByTimeAsync(DEFAULT_DELAY_MS);

    expect(calls).toHaveLength(2);

    const second = calls[1];

    second.resolve(jsonResponse([country(secondQuery)]));
    await vi.advanceTimersByTimeAsync(0);

    expect(search.getState().countries.map(({ name }) => name.toLowerCase())).toEqual([
      secondQuery,
    ]);

    first.resolve(jsonResponse([country('Old Spain')]));
    await vi.advanceTimersByTimeAsync(0);

    expect(search.getState().countries.map(({ name }) => name.toLowerCase())).toEqual([
      secondQuery,
    ]);
    expect(first.signal?.aborted).toBe(true);
    expect(await firstOutcome).toMatchObject({ name: 'AbortError' });
  });

  it('aborts the active request immediately when the query changes', async () => {
    const calls = mockFetch();
    const search = createCountrySearch();

    search.fetchCountries(firstQuery);
    await vi.advanceTimersByTimeAsync(DEFAULT_DELAY_MS);

    const first = calls[0];
    const firstOutcome = first.promise.catch((error: unknown) => error);

    search.fetchCountries(secondQuery);

    expect(first.signal?.aborted).toBe(true);
    expect(await firstOutcome).toMatchObject({ name: 'AbortError' });
  });
});
