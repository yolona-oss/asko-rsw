import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Like `useState`, but automatically resets the value back to `defaultValue`
 * after `delayMs` milliseconds whenever a non-default value is set.
 *
 * Setting the default value clears any pending timer immediately.
 * The timer is cleaned up on unmount.
 */
export function useAutoReset<T>(defaultValue: T, delayMs: number): [T, (value: T) => void] {
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const set = useCallback((next: T) => {
    clearTimeout(timerRef.current);
    setValue(next);
    if (next !== defaultValue) {
      timerRef.current = setTimeout(() => setValue(defaultValue), delayMs);
    }
  }, [defaultValue, delayMs]);

  return [value, set];
}
