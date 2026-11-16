import { DEFAULT_DELAY_MS } from '@/constants';
import { createCountrySearch } from '@/store/store';
import { countryDto, jsonResponse, mockFetch } from './helpers/mockFetch';

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

    second.resolve(jsonResponse([countryDto(secondQuery)]));
    await vi.advanceTimersByTimeAsync(0);

    expect(search.getState().countries.map(({ name }) => name.toLowerCase())).toEqual([
      secondQuery,
    ]);

    first.resolve(jsonResponse([countryDto('Old Spain')]));
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
