'use client';

import { Clock } from 'lucide-react';
import type { RepairRequestStatus } from '@asko/shared/client';
import { STATUS_TITLES, formatDate } from './constants';

interface StatusTimelineProps {
  statusTimestamps: Record<string, string>;
  currentStatus: RepairRequestStatus;
}

export function StatusTimeline({ statusTimestamps, currentStatus }: StatusTimelineProps) {
  const entries = Object.entries(statusTimestamps)
    .sort(([, a], [, b]) => new Date(a).getTime() - new Date(b).getTime());

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-0 max-w-lg mt-6">
      <h3 className="text-base font-medium text-text-main mb-3">История статусов</h3>
      <div className="relative">
        {entries.map(([status, timestamp], idx) => {
          const isCurrent = status === currentStatus;
          const isLast = idx === entries.length - 1;

          return (
            <div key={status} className="flex gap-3 relative">
              {/* Vertical line */}
              {!isLast && (
                <div className="absolute left-[11px] top-[24px] bottom-0 w-px bg-border-light" />
              )}

              {/* Dot */}
              <div className="relative z-[1] mt-1.5 shrink-0">
                {isCurrent ? (
                  <div className="w-[22px] h-[22px] flex items-center justify-center bg-brand-main">
                    <Clock className="w-3 h-3 text-text-on-brand" />
                  </div>
                ) : (
                  <div className="w-[22px] h-[22px] flex items-center justify-center bg-success">
                    <div className="w-2 h-2 bg-white" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={`flex flex-col pb-4 ${isLast ? 'pb-0' : ''}`}>
                <span className={`text-sm font-medium ${isCurrent ? 'text-text-main' : 'text-text-sub'}`}>
                  {STATUS_TITLES[status] ?? status}
                </span>
                <span className="text-xs text-text-sub">{formatDate(timestamp)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
