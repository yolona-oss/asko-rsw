'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type TooltipTrigger = 'hover' | 'click' | 'both';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  trigger?: TooltipTrigger;
  delay?: number;
  className?: string;
  contentClassName?: string;
}

const placementStyles: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowStyles: Record<TooltipPlacement, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-dark border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-dark border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-dark border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-dark border-y-transparent border-l-transparent',
};

export function Tooltip({
  content,
  children,
  placement = 'top',
  trigger = 'hover',
  delay = 200,
  className,
  contentClassName,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const toggle = useCallback(() => {
    setVisible((v) => !v);
  }, []);

  // Close on outside click for click trigger
  useEffect(() => {
    if (!visible || trigger === 'hover') return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [visible, trigger]);

  // Close on Escape
  useEffect(() => {
    if (!visible) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setVisible(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [visible]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const hoverHandlers = trigger === 'hover' || trigger === 'both'
    ? { onMouseEnter: show, onMouseLeave: hide }
    : {};

  const clickHandler = trigger === 'click' || trigger === 'both'
    ? { onClick: toggle }
    : {};

  return (
    <div
      ref={wrapperRef}
      className={cn('relative inline-flex', className)}
      {...hoverHandlers}
      {...clickHandler}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 pointer-events-none',
            'px-3 py-1.5 text-xs text-text-on-dark bg-dark shadow-lg',
            'whitespace-nowrap animate-[fade-in_150ms_ease-out]',
            placementStyles[placement],
            contentClassName,
          )}
        >
          {content}
          <span
            className={cn('absolute w-0 h-0 border-4', arrowStyles[placement])}
          />
        </div>
      )}
    </div>
  );
}
