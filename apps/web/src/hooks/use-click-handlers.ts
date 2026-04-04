import { useRef, useCallback } from 'react';

const DEBOUNCE_MS = 250;

export function useClickHandlers(onClick?: () => void, onDoubleClick?: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    if (!onClick) return;
    if (onDoubleClick) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { timer.current = null; onClick(); }, DEBOUNCE_MS);
    } else {
      onClick();
    }
  }, [onClick, onDoubleClick]);

  const handleDoubleClick = useCallback(() => {
    if (!onDoubleClick) return;
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    onDoubleClick();
  }, [onDoubleClick]);

  return { handleClick, handleDoubleClick };
}
