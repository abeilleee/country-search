import type { CountryDto } from '@/types';

export interface FetchCall {
  promise: Promise<Response>;
  resolve: (response: Response) => void;
  signal?: AbortSignal | null;
}

export const countryDto = (name: string): CountryDto => ({
  name,
  region: 'Europe',
  alpha2Code: 'XX',
  alpha3Code: 'XXX',
});

export const jsonResponse = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as Response;

export const mockFetch = (): FetchCall[] => {
  const calls: FetchCall[] = [];

  const mockedFetch = vi.fn((_url: string, { signal }: RequestInit = {}) => {
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

  vi.stubGlobal('fetch', mockedFetch);

  return calls;
};
