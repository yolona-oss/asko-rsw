'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import type { PatternSlot } from './types';

interface SlotBlockProps {
  slot: PatternSlot;
  index: number;
  defaultStart: string;
  defaultEnd: string;
  interactive: boolean;
  onOpen: (index: number) => void;
}

export function SlotBlock({ slot, index, defaultStart, defaultEnd, interactive, onOpen }: SlotBlockProps) {
  const controls = useDragControls();
  const isWork = !!slot.work;
  const start = slot.startTime || defaultStart;
  const end = slot.endTime || defaultEnd;
  const hasOverride = !!slot.startTime || !!slot.endTime;

  const base = 'min-w-[120px] select-none p-3 flex flex-col gap-1 border transition-colors';
  const stateClass = isWork
    ? 'bg-green-50 border-green-300 text-text-main'
    : 'bg-gray-50 border-gray-200 text-text-sub';
  const interactiveClass = interactive ? 'cursor-pointer hover:border-text-main' : '';

  const content = (
    <div
      className={`${base} ${stateClass} ${interactiveClass}`}
      onClick={interactive ? () => onOpen(index) : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">День {index + 1}</span>
        {interactive && (
          <button
            type="button"
            className="text-text-sub hover:text-text-main touch-none"
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
          <span className="text-sm font-medium">{start} — {end}</span>
          <span className="text-[11px] text-text-sub">
            {hasOverride ? 'Индивидуальное время' : 'Рабочий'}
          </span>
        </>
      ) : (
        <span className="text-sm">Выходной</span>
      )}
    </div>
  );

  if (!interactive) {
    return content;
  }

  return (
    <Reorder.Item
      value={slot}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.03, zIndex: 10 }}
      className="list-none"
    >
      {content}
    </Reorder.Item>
  );
}
