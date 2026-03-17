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
  names: string[];
  surnames: string[];
  patronymics: string[];
}

export const NameInput = forwardRef<
  HTMLInputElement,
  NameInputProps
>(
  (
    {
      value = '',
      onChange,
      names,
      surnames,
      patronymics,
      className,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    const [filtered, setFiltered] = useState<string[]>([]);
    const [active, setActive] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const words = String(value).split(' ');

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };

      document.addEventListener(
        'mousedown',
        handleClickOutside,
      );

      return () => {
        document.removeEventListener(
          'mousedown',
          handleClickOutside,
        );
      };
    }, []);

    useEffect(() => {
      if (!value) {
        setFiltered(names.slice(0, 20));
        return;
      }

      // first name
      if (words.length === 1) {
        const v = words[0].toLowerCase();

        setFiltered(
          names
            .filter((n) =>
              n.toLowerCase().startsWith(v),
            )
            .slice(0, 20),
        );

        return;
      }

      // surname
      if (words.length === 2) {
        const v = words[1].toLowerCase();

        setFiltered(
          surnames
            .filter((s) =>
              s.toLowerCase().startsWith(v),
            )
            .slice(0, 20),
        );

        return;
      }

      // patronymic
      if (words.length >= 3) {
        const v = words[2].toLowerCase();

        setFiltered(
          patronymics
            .filter((p) =>
              p.toLowerCase().startsWith(v),
            )
            .slice(0, 20),
        );

        return;
      }
    }, [value, names, surnames, patronymics]);

    const complete = (part: string) => {
      let next = '';

      if (words.length === 1) {
        next = part;
      } else if (words.length === 2) {
        next = words[0] + ' ' + part;
      } else {
        next =
          words[0] +
          ' ' +
          words[1] +
          ' ' +
          part;
      }

      onChange?.({
        target: { value: next },
      } as any);

      setOpen(false);
      setActive(-1);
    };

    const onKeyDown = (
      e: KeyboardEvent<HTMLInputElement>,
    ) => {
      if (!filtered.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) =>
          i + 1 >= filtered.length ? 0 : i + 1,
        );
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) =>
          i <= 0 ? filtered.length - 1 : i - 1,
        );
      }

      if (e.key === 'Tab') {
        e.preventDefault();

        complete(
          active >= 0
            ? filtered[active]
            : filtered[0],
        );
      }

      if (e.key === 'Enter') {
        if (active >= 0) {
          e.preventDefault();
          complete(filtered[active]);
        }
      }
    };

    return (
      <div
        ref={wrapperRef}
        className="relative w-full"
      >
        <Input
          ref={ref}
          value={value}
          className={className}
          onChange={(e) => {
            onChange?.(e);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          {...props}
        />

        {open && filtered.length > 0 && (
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
