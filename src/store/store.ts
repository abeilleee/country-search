import { DEFAULT_DELAY_MS, SearchFailure } from '@/constants';
import { HttpError } from '@/core/HttpError';
import { classifySearchError } from '@/core/classifySearchError';
import { countryCache } from '@/core/createCountryCache';
import { debounce } from '@/core/debounce';
import type { Country } from '@/core/mapCountryResponse';

export interface AppState {
  countries: Country[];
  loading: boolean;
  error: SearchError | null;
}

interface Store {
  getState: () => AppState;
  subscribe: (listener: (state: AppState) => void) => () => void;
  fetchCountries: (query: string) => void;
}

type SearchError =
  | { kind: SearchFailure.Timeout; message: string }
  | { kind: SearchFailure.Network; message: string }
  | { kind: SearchFailure.Http; status?: number; message: string }
  | { kind: SearchFailure.Unknown; message: string };

const initialState: AppState = {
  countries: [],
  error: null,
  loading: false,
};

export function createCountrySearch(delay = DEFAULT_DELAY_MS): Store {
  const listeners = new Set<(state: AppState) => void>();
  const isCurrent = (current: AbortController) => controller === current;

  let state: AppState = { ...initialState };
  let controller: AbortController | null = null;

  const setState = (patch: Partial<AppState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  };

  const toSearchError = (error: unknown): SearchError | null => {
    const classifiedError = classifySearchError(error);

    switch (classifiedError) {
      // Aborted is not an error
      case SearchFailure.Aborted:
        return null;

      case SearchFailure.Timeout:
        return { kind: SearchFailure.Timeout, message: 'Request timed out. Please try again.' };

      case SearchFailure.Network:
        return {
          kind: SearchFailure.Network,
          message: 'Network problem. Please check your connection.',
        };

      case SearchFailure.Http: {
        const status = error instanceof HttpError ? error.status : undefined;

        return {
          kind: SearchFailure.Http,
          status,
          message: `Server responded with an error${status ? ` ${status}` : ''}. Please try again.`,
        };
      }

      default:
        return { kind: SearchFailure.Unknown, message: 'Please try again.' };
    }
  };

  const runSearch = async (query: string, current: AbortController) => {
    if (!isCurrent(current)) {
      return;
    }

    try {
      const countries = await countryCache.get(query, current.signal);

      if (!isCurrent(current)) {
        return;
      }

      setState({ countries });
    } catch (error) {
      if (!isCurrent(current)) {
        return;
      }

      const searchedError = toSearchError(error);

      // Abort is not an error
      if (!searchedError) {
        return;
      }

      setState({
        countries: [],
        error: searchedError,
      });
    } finally {
      if (isCurrent(current)) {
        setState({ loading: false });
        controller = null;
      }
    }
  };

  const debouncedRun = debounce((query: string, current: AbortController) => {
    void runSearch(query, current);
  }, delay);

  const fetchCountries = (query: string) => {
    controller?.abort();
    controller = null;

    if (!query.trim()) {
      setState({
        countries: [],
        error: null,
        loading: false,
      });

      return;
    }

    const current = new AbortController();
    controller = current;

    setState({ countries: [], error: null, loading: true });
    debouncedRun(query.trim(), current);
  };

  return {
    getState: () => state,

    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    fetchCountries,
  };
}
