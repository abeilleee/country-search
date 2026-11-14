import { BASE_URL, Endpoint, HttpStatus, TIMEOUT_MS } from '@/constants';
import { HttpError } from '@/core/HttpError';
import { searchCountries } from '@/core/searchCountries';

describe('searchCountries', () => {
  const QUERY = 'spain';
  const EXPECTED_URL = `${BASE_URL}/${Endpoint.Name}/${QUERY}`;

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: HttpStatus.Success,
        json: vi.fn().mockResolvedValue([]),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns a promise', () => {
    const result = searchCountries(QUERY);

    expect(result).toBeInstanceOf(Promise);

    return result;
  });

  it('calls fetch with the correct URL built from the query', async () => {
    const controller = new AbortController();

    await searchCountries(QUERY, controller.signal);

    expect(fetch).toHaveBeenCalledTimes(1);

    const [url] = vi.mocked(fetch).mock.calls[0];

    expect(url).toBe(EXPECTED_URL);
  });

  it('passes signal to fetch', async () => {
    const controller = new AbortController();

    await searchCountries(QUERY, controller.signal);

    const init = vi.mocked(fetch).mock.calls[0][1];

    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('returns parsed JSON array on success', async () => {
    const raw = [{ name: 'Spain', capital: 'Madrid', region: 'Europe' }];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: HttpStatus.Success,
        json: vi.fn().mockResolvedValue(raw),
      }),
    );

    await expect(searchCountries(QUERY)).resolves.toEqual(raw);
  });

  it('works without a signal (uses only the internal timeout)', async () => {
    await expect(searchCountries(QUERY)).resolves.toEqual([]);

    expect(fetch).toHaveBeenCalledTimes(1);

    const init = vi.mocked(fetch).mock.calls[0][1];

    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('rejects with AbortError when the passed signal is aborted', async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, init) =>
          new Promise((_, reject) => {
            init?.signal?.addEventListener('abort', () => reject(init.signal.reason));
          }),
      ),
    );

    const promise = searchCountries(QUERY, controller.signal);
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('propagates AbortError as-is (user cancellation, not an error for UI)', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    const error = await searchCountries(QUERY).catch((e) => e);

    expect(error).toBe(abortError);
    expect(error.name).toBe('AbortError');
    expect(error.name).not.toBe('TimeoutError');
    expect(error).not.toBeInstanceOf(HttpError);
  });

  it('propagates TimeoutError as-is (not wrapped in HttpError, not AbortError)', async () => {
    const timeoutError = new DOMException('The operation timed out.', 'TimeoutError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeoutError));

    const error = await searchCountries(QUERY).catch((e) => e);

    expect(error).toBe(timeoutError);
    expect(error.name).toBe('TimeoutError');
    expect(error.name).not.toBe('AbortError');
    expect(error).not.toBeInstanceOf(HttpError);
  });

  it('returns an empty array when response.ok is false with 404 status (no matches)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: HttpStatus.NotFound,
      }),
    );

    await expect(searchCountries(QUERY)).resolves.toEqual([]);
  });

  it.each([400, 429, 500, 503])(
    'throws HttpError when response.ok is false with status %i on non-404 failure',
    async (status) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));

      const error = await searchCountries(QUERY).catch((e) => e);

      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(status);
      expect(error.name).toBe('HttpError');
    },
  );

  it('aborts with TimeoutError when the request hangs longer than TIMEOUT_MS', async () => {
    vi.useFakeTimers();
    // AbortSignal.timeout uses native timers fake-timers can't intercept so mock it with setTimeout
    vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(new DOMException('Deadline exceeded', 'TimeoutError')), ms);

      return controller.signal;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, init) =>
          new Promise((_, reject) => {
            init?.signal?.addEventListener('abort', () => reject(init.signal.reason));
          }),
      ),
    );

    const promise = searchCountries(QUERY);
    const outcome = promise.catch((error) => error);

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);

    expect(await outcome).toMatchObject({ name: 'TimeoutError' });

    vi.useRealTimers();
  });
});
