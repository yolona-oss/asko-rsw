'use client';

import {
  useState,
  useEffect,
  forwardRef,
  KeyboardEvent,
  useRef,
} from 'react';

import { Input, type InputProps } from './input';
import { cn } from '../utils/cn';

export interface NameInputProps extends InputProps {
  names: readonly string[];
  surnames: readonly string[];
  patronymics: readonly string[];
}

export const NameInput = forwardRef<HTMLInputElement, NameInputProps>(
  ({ value = '', onChange, names, surnames, patronymics, className, ...props }, ref) => {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const text = String(value);
    const words = text.split(' ');
    const wordIndex = words.length - 1;

    // ФИО order: Фамилия(0) Имя(1) Отчество(2)
    const pool = wordIndex === 0 ? [...surnames] : wordIndex === 1 ? [...names] : wordIndex === 2 ? [...patronymics] : [];
    const currentWord = (words[wordIndex] ?? '').toLowerCase();

    const filtered = (() => {
      if (!currentWord) return pool.slice(0, 20);
      return pool.filter((s) => s.toLowerCase().startsWith(currentWord)).slice(0, 20);
    })();

    const isComplete = wordIndex >= 3 || (wordIndex === 2 && currentWord.length > 0 && filtered.length === 0);

    // Ghost text: top suggestion's untyped suffix
    const ghostSuffix = (() => {
      if (!open || isComplete || !currentWord || filtered.length === 0) return '';
      const top = filtered[active >= 0 ? active : 0];
      if (!top || !top.toLowerCase().startsWith(currentWord)) return '';
      return top.slice(currentWord.length);
    })();

    // Build full ФИО line for a suggestion
    const completedWords = words.slice(0, wordIndex);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [prevWord, setPrevWord] = useState(currentWord);
    if (currentWord !== prevWord) {
      setPrevWord(currentWord);
      if (active !== -1) setActive(-1);
    }

    const complete = (suggestion: string) => {
      const next = [...completedWords, suggestion].join(' ');
      const withSpace = wordIndex < 2 ? next + ' ' : next;
      onChange?.({ target: { value: withSpace } } as any);
      if (wordIndex >= 2) setOpen(false);
      setActive(-1);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Tab') {
        if (isComplete || filtered.length === 0 || wordIndex >= 3) {
          setOpen(false);
          return;
        }
        e.preventDefault();
        complete(active >= 0 ? filtered[active] : filtered[0]);
        return;
      }

      if (!open || !filtered.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => (i + 1 >= filtered.length ? 0 : i + 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => (i <= 0 ? filtered.length - 1 : i - 1));
      }
      if (e.key === 'Enter' && active >= 0) {
        e.preventDefault();
        complete(filtered[active]);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    const showDropdown = open && filtered.length > 0 && !isComplete;

    return (
      <div ref={wrapperRef} className="relative w-full">
        {/* Ghost text overlay — shows top suggestion suffix faded */}
        {ghostSuffix && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none px-4 py-2.5 text-sm overflow-hidden whitespace-nowrap"
          >
            <span className="invisible">{text}</span>
            <span className="text-text-main/25">{ghostSuffix}</span>
          </div>
        )}

        <Input
          ref={ref}
          value={value}
          className={cn(className, ghostSuffix && 'bg-transparent')}
          onChange={(e) => {
            onChange?.(e);
            setOpen(true);
          }}
          onFocus={() => {
            if (!isComplete) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          {...props}
        />

        {showDropdown && (
          <div
            className={cn(
              'absolute z-50 mt-1 w-full',
              'bg-surface border border-border-light',
              'shadow-md',
              'max-h-60 overflow-auto',
            )}
          >
            {filtered.map((suggestion, i) => {
              const prefix = completedWords.join(' ');
              const matchLen = currentWord.length;
              const isTabTarget = active >= 0 ? i === active : i === 0;

              return (
                <div
                  key={suggestion}
                  onMouseDown={() => complete(suggestion)}
                  className={cn(
                    'px-3 py-2 text-sm cursor-pointer',
                    'hover:bg-surface-secondary',
                    (i === active || isTabTarget) && 'bg-surface-secondary',
                  )}
                >
                  {/* Previously completed words — muted */}
                  {prefix && <span className="text-text-sub">{prefix} </span>}
                  {/* Matched prefix — bold */}
                  <span className="font-semibold">{suggestion.slice(0, matchLen)}</span>
                  {/* Rest of suggestion — normal */}
                  <span>{suggestion.slice(matchLen)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  },
);

NameInput.displayName = 'NameInput';
