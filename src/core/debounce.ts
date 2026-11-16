import { DEFAULT_DELAY_MS } from '@/constants';

/**
 * Creates a debounced wrapper around `fn`. The wrapper postpones the call to
 * `fn` by `delay` ms; every new call to the wrapper resets the timer, so `fn`
 * runs once — `delay` ms after the last call
 *
 * @typeParam Args — argument types of `fn`; preserved on the wrapper unchanged
 * @param fn — the function whose invocation should be deferred
 * @param delay - number (default 300ms)
 * @returns A new wrapper function that accepts the same arguments as `fn`
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number = DEFAULT_DELAY_MS,
) {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Args) => {
    if (timerId !== null) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      fn(...args);
      timerId = null;
    }, delay);
  };
}
