import { useEffect, useState } from 'react';

const DEFAULT_DELAY_MS = 300;

/**
 * Debounce a value by a given delay.
 * Returns the debounced value that only updates after the caller
 * stops changing the input for `delay` milliseconds.
 */
export const useDebouncedValue = <T>(value: T, delay = DEFAULT_DELAY_MS): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
