import type { AppState } from '@/store/store';

type ViewStatus = 'idle' | 'loading' | 'error' | 'empty' | 'results';

export const getViewStatus = (state: AppState, query: string): ViewStatus => {
  const trimmed = query.trim();

  if (state.error) return 'error';
  if (state.loading) return 'loading';
  if (!trimmed) return 'idle';
  if (state.countries.length === 0) return 'empty';

  return 'results';
};
