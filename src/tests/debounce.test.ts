import { DEFAULT_DELAY_MS } from '@/constants';
import { debounce } from '@/core/debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a function', () => {
    const fn = vi.fn();

    expect(debounce(fn)).toBeTypeOf('function');
  });

  it('does not call function immediately', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced();
    expect(fn).not.toHaveBeenCalled();
  });

  it('calls function once after delay elapses', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced();
    vi.advanceTimersByTime(250);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not call fn before delay elapses', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 400);

    debounced();
    vi.advanceTimersByTime(399);

    expect(fn).not.toHaveBeenCalled();
  });

  it('passes the arguments of the last call to fn', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced('a', 1);
    debounced('b', 2);
    debounced('c', 3);

    vi.advanceTimersByTime(200);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c', 3);
  });

  it('creates independent debounced functions', () => {
    const fnA = vi.fn();
    const fnB = vi.fn();
    const debouncedA = debounce(fnA, 200);
    const debouncedB = debounce(fnB, 250);

    debouncedA();
    debouncedB();

    vi.advanceTimersByTime(200);
    expect(fnA).toHaveBeenCalledTimes(1);
    expect(fnB).not.toHaveBeenCalled();

    vi.advanceTimersByTime(250);
    expect(fnB).toHaveBeenCalledTimes(1);
  });

  it(`uses ${DEFAULT_DELAY_MS}ms delay by default when delay argument is omitted`, () => {
    const fn = vi.fn();
    const debounced = debounce(fn);
    const notYetElapsedMs = DEFAULT_DELAY_MS - 1;

    debounced();
    vi.advanceTimersByTime(notYetElapsedMs);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on repeated calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 400);

    debounced();
    vi.advanceTimersByTime(200);
    debounced();
    vi.advanceTimersByTime(200);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('can be called again after fn has fired', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 350);

    debounced();
    vi.advanceTimersByTime(350);
    expect(fn).toHaveBeenCalledTimes(1);

    debounced();
    vi.advanceTimersByTime(350);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
