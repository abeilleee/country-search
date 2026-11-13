import { SearchFailure } from '@/constants';
import { HttpError } from './HttpError';

export function classifySearchError(error: unknown): SearchFailure {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'AbortError':
        return SearchFailure.Aborted;

      case 'TimeoutError':
        return SearchFailure.Timeout;
    }
  }

  if (error instanceof HttpError) {
    return SearchFailure.Http;
  }

  if (error instanceof TypeError) {
    return SearchFailure.Network;
  }

  return SearchFailure.Unknown;
}
