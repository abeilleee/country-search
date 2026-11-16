import { createCountryCache } from '@/core/createCountryCache';
import { countryDto, jsonResponse, mockFetch } from './helpers/mockFetch';

describe('createCountryCache', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns cached result for the same query without extra network request', async () => {
    const calls = mockFetch();
    const cache = createCountryCache();
    const first = cache.get('spain');

    expect(calls).toHaveLength(1);

    calls[0].resolve(jsonResponse([countryDto('Spain')]));
    await expect(first).resolves.toEqual([
      expect.objectContaining({ name: 'Spain', region: 'Europe' }),
    ]);

    const second = cache.get('spain');

    expect(calls).toHaveLength(1);
    await expect(second).resolves.toEqual([
      expect.objectContaining({ name: 'Spain', region: 'Europe' }),
    ]);
  });

  it('uses normalized query key for cache hits', async () => {
    const calls = mockFetch();
    const cache = createCountryCache();

    const first = cache.get('  Spain  ');
    calls[0].resolve(jsonResponse([countryDto('Spain')]));
    await first;

    const second = cache.get('spain');
    expect(calls).toHaveLength(1);
    await expect(second).resolves.toEqual([expect.objectContaining({ name: 'Spain' })]);
  });

  it('deduplicates concurrent identical in-flight requests', async () => {
    const calls = mockFetch();
    const cache = createCountryCache();

    const first = cache.get('spain');
    const second = cache.get('spain');

    expect(calls).toHaveLength(1);

    calls[0].resolve(jsonResponse([countryDto('Spain')]));

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult).toEqual([expect.objectContaining({ name: 'Spain' })]);
    expect(secondResult).toEqual([expect.objectContaining({ name: 'Spain' })]);
  });

  it('aborting one caller does not reject or cancel other callers sharing the in-flight request', async () => {
    const calls = mockFetch();
    const cache = createCountryCache();
    const controller = new AbortController();
    const cancelled = cache.get('spain', controller.signal);
    const active = cache.get('spain');

    expect(calls).toHaveLength(1);

    controller.abort();
    await expect(cancelled).rejects.toMatchObject({ name: 'AbortError' });
    expect(calls[0].signal?.aborted).toBe(false);

    calls[0].resolve(jsonResponse([countryDto('Spain')]));
    await expect(active).resolves.toEqual([expect.objectContaining({ name: 'Spain' })]);
  });

  it('aborts the shared in-flight request when the last caller cancels', async () => {
    const calls = mockFetch();
    const cache = createCountryCache();
    const firstController = new AbortController();
    const secondController = new AbortController();

    const first = cache.get('spain', firstController.signal);
    const second = cache.get('spain', secondController.signal);
    const firstOutcome = first.catch((error: unknown) => error);
    const secondOutcome = second.catch((error: unknown) => error);

    expect(calls).toHaveLength(1);

    firstController.abort();
    expect(calls[0].signal?.aborted).toBe(false);

    secondController.abort();
    expect(calls[0].signal?.aborted).toBe(true);
    await expect(firstOutcome).resolves.toMatchObject({ name: 'AbortError' });
    await expect(secondOutcome).resolves.toMatchObject({ name: 'AbortError' });

    const retry = cache.get('spain');
    expect(calls).toHaveLength(2);
    calls[1].resolve(jsonResponse([countryDto('Spain')]));
    await expect(retry).resolves.toEqual([expect.objectContaining({ name: 'Spain' })]);
  });
});
