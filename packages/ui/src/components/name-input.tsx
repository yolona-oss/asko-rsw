'use client';

import {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  KeyboardEvent,
  useRef,
} from 'react';

import { Input, type InputProps } from './input';
import { cn } from '../utils/cn';

export interface NameInputProps extends InputProps {
  /** Autocomplete suggestions for first names (имена) */
  names: string[];
  /** Autocomplete suggestions for surnames (фамилии) */
  surnames: string[];
  /** Autocomplete suggestions for patronymics (отчества) */
  patronymics: string[];
}

export const NameInput = forwardRef<HTMLInputElement, NameInputProps>(
  ({ value = '', onChange, names, surnames, patronymics, className, ...props }, ref) => {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const text = String(value);
    const words = text.split(' ');
    const wordIndex = words.length - 1; // 0 = surname, 1 = name, 2 = patronymic

    // Pick the right suggestion list based on which word is being typed
    // ФИО order: Фамилия(0) Имя(1) Отчество(2)
    const pool = wordIndex === 0 ? surnames : wordIndex === 1 ? names : wordIndex === 2 ? patronymics : [];

    const currentWord = (words[wordIndex] ?? '').toLowerCase();

    const filtered = useMemo(() => {
      if (!currentWord) return pool.slice(0, 20);
      return pool.filter((s) => s.toLowerCase().startsWith(currentWord)).slice(0, 20);
    }, [currentWord, pool]);

    // All 3 parts are filled — no more suggestions
    const isComplete = wordIndex >= 3 || (wordIndex === 2 && currentWord.length > 0 && filtered.length === 0);

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset active selection when filtered list changes
    useEffect(() => {
      setActive(-1);
    }, [currentWord]);

    const complete = (suggestion: string) => {
      const before = words.slice(0, wordIndex);
      const next = [...before, suggestion].join(' ');

      // Add trailing space after words 1 and 2 so user can start typing next part
      const withSpace = wordIndex < 2 ? next + ' ' : next;

      onChange?.({ target: { value: withSpace } } as any);

      if (wordIndex >= 2) {
        setOpen(false);
      }
      setActive(-1);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Tab') {
        // After all 3 words or no suggestions — let Tab work normally
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

    // Don't show dropdown when all parts are done
    const showDropdown = open && filtered.length > 0 && !isComplete;

    return (
      <div ref={wrapperRef} className="relative w-full">
        <Input
          ref={ref}
          value={value}
          className={className}
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
              'bg-white border border-border-light',
              'rounded-sm shadow-md',
              'max-h-60 overflow-auto',
            )}
          >
            {filtered.map((s, i) => (
              <div
                key={s}
                onMouseDown={() => complete(s)}
                className={cn(
                  'px-3 py-2 text-sm cursor-pointer',
                  'hover:bg-gray-100',
                  i === active && 'bg-gray-100',
                )}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

NameInput.displayName = 'NameInput';
