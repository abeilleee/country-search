export interface SearchHistoryStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export interface SearchHistory {
  getAll: () => string[];
  add: (query: string) => string[];
  clear: () => void;
}

/**
 * Creates a persistent list of recent search queries backed by a storage.
 * Queries are kept most-recent-first, deduplicated case-insensitively and capped at `limit` items
 *
 * @param storage - compatible object (`getItem`/`setItem`/`removeItem`)
 * @param key - storage key the history is stored under
 * @param limit - maximum number of queries to keep
 * @returns an object with `getAll`, `add` and `clear`
 */
export function createSearchHistory(
  storage: SearchHistoryStorage,
  key: string,
  limit: number,
): SearchHistory {
  const getAll = (): string[] => {
    try {
      const raw = storage.getItem(key);

      if (!raw) {
        return [];
      }

      const parsed: unknown = JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      // corrupted or unavailable storage - start from an empty history
      return [];
    }
  };

  const save = (items: string[]) => {
    try {
      storage.setItem(key, JSON.stringify(items));
    } catch {
      // do nothing when storage is disabled or full
    }
  };

  const add = (query: string) => {
    const value = query.trim();
    const current = getAll();

    if (!value) {
      return current;
    }

    const next = [
      value,
      ...current.filter((item) => item.toLowerCase() !== value.toLowerCase()),
    ].slice(0, limit);

    save(next);

    return next;
  };

  const clear = () => {
    try {
      storage.removeItem(key);
    } catch {
      // ignore removal failures
    }
  };

  return { getAll, add, clear };
}
