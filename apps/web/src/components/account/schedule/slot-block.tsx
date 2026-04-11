'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import type { PatternSlot } from './types';

export interface SlotEntry {
  uid: string;
  slot: PatternSlot;
}

interface SlotBlockProps {
  entry: SlotEntry;
  index: number;
  defaultStart: string;
  defaultEnd: string;
  interactive: boolean;
  onOpen: (index: number) => void;
}

export function SlotBlock({ entry, index, defaultStart, defaultEnd, interactive, onOpen }: SlotBlockProps) {
  const controls = useDragControls();
  const { slot } = entry;
  const isWork = !!slot.work;
  const start = slot.startTime || defaultStart;
  const end = slot.endTime || defaultEnd;
  const hasOverride = !!slot.startTime || !!slot.endTime;

  const base = 'w-[110px] sm:w-[130px] shrink-0 select-none p-2.5 sm:p-3 flex flex-col gap-1 border transition-colors';
  const stateClass = isWork
    ? 'bg-success-bg border-success-border text-text-main'
    : 'bg-surface-hover border-border-light text-text-sub';
  const interactiveClass = interactive ? 'cursor-pointer hover:border-text-main' : '';

  const content = (
    <div
      className={`${base} ${stateClass} ${interactiveClass}`}
      onClick={interactive ? () => onOpen(index) : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] sm:text-xs font-semibold">День {index + 1}</span>
        {interactive && (
          <button
            type="button"
            className="text-text-sub hover:text-text-main touch-none p-0.5 -m-0.5"
            onPointerDown={(e) => {
              e.stopPropagation();
              controls.start(e);
            }}
            aria-label="Перетащить"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
      </div>
      {isWork ? (
        <>
          <span className="text-[13px] sm:text-sm font-medium">{start} — {end}</span>
          <span className="text-[10px] sm:text-[11px] text-text-sub">
            {hasOverride ? 'Индивидуально' : 'Рабочий'}
          </span>
        </>
      ) : (
        <span className="text-[13px] sm:text-sm">Выходной</span>
      )}
    </div>
  );

  if (!interactive) {
    return content;
  }

  return (
    <Reorder.Item
      value={entry}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.04, zIndex: 10 }}
      className="list-none"
    >
      {content}
    </Reorder.Item>
  );
}
