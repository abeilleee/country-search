import { SearchFailure } from '@/constants';

export function classifySearchError(error: unknown): SearchFailure {
  void error;

  throw new Error('Not implemented');
}
