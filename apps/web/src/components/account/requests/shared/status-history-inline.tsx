'use client';

import { useState } from 'react';
import { Check, Clock, Pause, Ban, Truck, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import type { IStatusTimestampEntry } from '@asko/shared/client';
import {
  STATUS_TITLES,
  statusColor,
  isActiveWorkStatus,
  computeActiveMinutes,
  formatDuration,
  formatActiveMinutes,
  formatTimestamp,
  type StatusColorCategory,
} from './status-constants';

const DOT_BG: Record<StatusColorCategory, string> = {
  success: 'bg-success',
  error: 'bg-error',
  warning: 'bg-warning',
  brand: 'bg-brand-main',
  neutral: 'bg-surface-secondary',
};

const LINE_BG: Record<StatusColorCategory, string> = {
  success: 'bg-success/30',
  error: 'bg-error/30',
  warning: 'bg-warning/30',
  brand: 'bg-brand-main/30',
  neutral: 'bg-border-light',
};

function DotIcon({ status, color }: { status: string; color: StatusColorCategory }) {
  const iconClass = color === 'neutral' ? 'text-text-sub' : 'text-white';
  const size = 'w-3 h-3';

  switch (status) {
    case 'completed':
      return <Check className={`${size} ${iconClass}`} />;
    case 'cancelled': case 'refused':
      return <Ban className={`${size} ${iconClass}`} />;
    case 'en_route':
      return <Truck className={`${size} ${iconClass}`} />;
    case 'in_progress':
      return <Wrench className={`${size} ${iconClass}`} />;
    case 'paused':
      return <Pause className={`${size} ${iconClass}`} />;
    default:
      return <Clock className={`${size} ${iconClass}`} />;
  }
}

const COLLAPSED_COUNT = 3;

interface StatusHistoryInlineProps {
  statusTimestamps: IStatusTimestampEntry[];
  currentStatus: string;
}

export function StatusHistoryInline({ statusTimestamps, currentStatus }: StatusHistoryInlineProps) {
  const [expanded, setExpanded] = useState(false);

  const entries = [...statusTimestamps].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  if (entries.length <= 1) return null;

  const activeMinutes = computeActiveMinutes(entries);
  const canCollapse = entries.length > COLLAPSED_COUNT;
  const visible = expanded || !canCollapse ? entries : entries.slice(-COLLAPSED_COUNT);
  const hiddenCount = entries.length - COLLAPSED_COUNT;

  let lastCurrentIdx = -1;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].status === currentStatus) { lastCurrentIdx = i; break; }
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-text-main">
          История статусов
        </p>
        {canCollapse && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-brand-main hover:underline cursor-pointer"
          >
            {expanded ? (
              <>Свернуть <ChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <>Показать все ({hiddenCount} ещё) <ChevronDown className="w-3.5 h-3.5" /></>
            )}
          </button>
        )}
      </div>

      <div className="relative">
        {visible.map((entry, visIdx) => {
          const realIdx = expanded || !canCollapse
            ? visIdx
            : entries.length - COLLAPSED_COUNT + visIdx;
          const isCurrent = entry.status === currentStatus && realIdx === lastCurrentIdx;
          const isLast = realIdx === entries.length - 1;
          const color = statusColor(entry.status, isCurrent);
          const isActive = isActiveWorkStatus(entry.status);

          const durationMs = !isLast
            ? new Date(entries[realIdx + 1].timestamp).getTime() - new Date(entry.timestamp).getTime()
            : 0;

          return (
            <div key={realIdx} className="relative">
              <div className="flex gap-4">
                <div className="relative flex flex-col items-center shrink-0" style={{ width: 22 }}>
                  <div className={`w-[22px] h-[22px] flex items-center justify-center ${DOT_BG[color]}`}>
                    <DotIcon status={entry.status} color={color} />
                  </div>
                  {!isLast && (
                    <div className={`w-px flex-1 min-h-[24px] ${LINE_BG[color]}`} />
                  )}
                </div>

                <div className={`flex-1 pb-1 ${isActive ? 'border-l-2 border-brand-main/40 pl-3 -ml-1' : ''}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-sm font-medium ${isCurrent ? 'text-text-main' : 'text-text-sub'}`}>
                      {STATUS_TITLES[entry.status] ?? entry.status}
                    </span>
                  </div>
                  <span className="text-xs text-text-sub">{formatTimestamp(entry.timestamp)}</span>
                </div>
              </div>

              {!isLast && durationMs > 0 && (
                <div className="flex gap-4 pb-2">
                  <div className="shrink-0" style={{ width: 22 }} />
                  <span className="text-[11px] text-text-sub bg-surface-secondary px-2 py-0.5 inline-block">
                    {formatDuration(durationMs)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeMinutes > 0 && (
        <div className="mt-3 bg-surface-secondary p-3 border border-border-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-brand-main" />
              <span className="text-sm font-medium text-text-main">Время работы</span>
            </div>
            <span className="text-sm font-semibold text-text-main">{formatActiveMinutes(activeMinutes)}</span>
          </div>
          <p className="text-xs text-text-sub mt-1">Суммарное время в статусах «В пути» и «В работе»</p>
        </div>
      )}
    </div>
  );
}
