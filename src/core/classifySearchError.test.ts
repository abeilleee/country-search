import { SearchFailure } from '@/constants';
import { HttpError } from './HttpError';
import { classifySearchError } from './classifySearchError';

describe('classifySearchError', () => {
  it('classifies user cancellation as "aborted"', () => {
    const error = new DOMException('The operation was aborted.', 'AbortError');

    expect(classifySearchError(error)).toBe(SearchFailure.Aborted);
  });

  it('classifies timeout as "timeout"', () => {
    const error = new DOMException('The operation timed out.', 'TimeoutError');

    expect(classifySearchError(error)).toBe(SearchFailure.Timeout);
  });

  it.each([400, 429, 500, 503])('classifies HTTP %i as "http"', (status) => {
    expect(classifySearchError(new HttpError(status))).toBe('http');
  });

  it('classifies network failure as "network"', () => {
    expect(classifySearchError(new TypeError('Failed to fetch'))).toBe(SearchFailure.Network);
  });

  it.each<[string, unknown]>([
    ['generic Error', new Error('Something went wrong')],
    ['unexpected DOMException', new DOMException('Network error', 'NetworkError')],
    ['plain object with AbortError name', { name: 'AbortError' }],
    ['string', 'AbortError'],
    ['null', null],
    ['undefined', undefined],
  ])('classifies %s as "unknown"', (_description, error) => {
    expect(classifySearchError(error)).toBe(SearchFailure.Unknown);
  });

  it('does not mix up AbortError and TimeoutError', () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    const timeoutError = new DOMException('Timed out', 'TimeoutError');

    expect(classifySearchError(abortError)).not.toBe(SearchFailure.Timeout);
    expect(classifySearchError(timeoutError)).not.toBe(SearchFailure.Aborted);
  });
});
