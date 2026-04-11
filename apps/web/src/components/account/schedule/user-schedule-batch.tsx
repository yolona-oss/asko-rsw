'use client';

import { useState } from 'react';
import { Badge, Button, Card } from '@asko/ui';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import type { PatternRecord, ScheduleEntry } from './types';
import { PatternPreview, patternSummary } from './pattern-preview';
import {
  TYPE_LABELS,
  STATUS_LABELS,
  STATUS_BADGE_VARIANT,
  TYPE_BADGE_VARIANT,
  formatRange,
} from './constants';

interface UserScheduleBatchProps {
  userId: string;
  displayName?: string;
  pattern: PatternRecord | null;
  entries: ScheduleEntry[];
  canApprove: boolean;
  canEdit: boolean;
  onApprove?: (entry: ScheduleEntry) => void;
  onReject?: (entry: ScheduleEntry) => void;
  onEdit?: (entry: ScheduleEntry) => void;
  onDelete?: (entry: ScheduleEntry) => void;
  onViewUser?: (userId: string) => void;
}

export function UserScheduleBatch({
  userId,
  displayName,
  pattern,
  entries,
  canApprove,
  canEdit,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onViewUser,
}: UserScheduleBatchProps) {
  const [expanded, setExpanded] = useState(false);

  const pendingCount = entries.filter((e) => e.status === 'pending').length;
  const upcomingVacation = entries.filter((e) => e.type === 'vacation').length;
  const overtimeCount = entries.filter((e) => e.type === 'overtime').length;
  const extraDayCount = entries.filter((e) => e.type === 'extra_day').length;

  return (
    <Card padding="none" className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex flex-col gap-2 p-3 sm:p-4 sm:flex-row sm:items-center sm:gap-3 hover:bg-surface-hover transition-colors text-left w-full"
      >
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <ChevronRight className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] sm:text-sm font-medium text-text-main truncate">
              {displayName ?? userId.slice(0, 8)}
            </p>
            <p className="text-[11px] sm:text-[12px] text-text-sub truncate">
              {patternSummary(pattern)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap sm:justify-end pl-6 sm:pl-0">
          {pendingCount > 0 && (
            <Badge variant="warning">{pendingCount} на рассм.</Badge>
          )}
          {upcomingVacation > 0 && <Badge variant="warning">{upcomingVacation} отпуск</Badge>}
          {overtimeCount > 0 && <Badge variant="neutral">{overtimeCount} перераб.</Badge>}
          {extraDayCount > 0 && <Badge variant="success">{extraDayCount} доп.</Badge>}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border-light p-3 sm:p-4 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[11px] sm:text-[12px] text-text-sub">Рабочий цикл</p>
              {onViewUser && (
                <Button variant="secondary" size="sm" onClick={() => onViewUser(userId)} className="shrink-0">
                  Открыть
                </Button>
              )}
            </div>
            <PatternPreview pattern={pattern} compact />
          </div>

          <div>
            <p className="text-[11px] sm:text-[12px] text-text-sub mb-2">Записи ({entries.length})</p>
            {entries.length === 0 ? (
              <p className="text-sm text-text-sub">Нет записей</p>
            ) : (
              <div className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 border border-border-light flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={TYPE_BADGE_VARIANT[entry.type] ?? 'neutral'}>
                        {TYPE_LABELS[entry.type] ?? entry.type}
                      </Badge>
                      <Badge variant={STATUS_BADGE_VARIANT[entry.status] ?? 'neutral'}>
                        {STATUS_LABELS[entry.status] ?? entry.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[13px] sm:text-sm">
                      <span className="text-text-main font-medium">
                        {formatRange(entry.dateFrom, entry.dateTo)}
                      </span>
                      <span className="text-text-sub">
                        {entry.startTime} — {entry.endTime}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="text-[12px] sm:text-sm text-text-sub line-clamp-2">{entry.note}</p>
                    )}
                    {(canEdit || (canApprove && entry.status === 'pending')) && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {canApprove && entry.status === 'pending' && (
                          <>
                            <Button size="sm" variant="success" onClick={() => onApprove?.(entry)} className="flex-1 sm:flex-none">
                              Одобрить
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => onReject?.(entry)} className="flex-1 sm:flex-none">
                              Отклонить
                            </Button>
                          </>
                        )}
                        {canEdit && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => onEdit?.(entry)} className="flex-1 sm:flex-none">
                              Изменить
                            </Button>
                            <button
                              type="button"
                              onClick={() => onDelete?.(entry)}
                              className="text-text-sub hover:text-brand-red transition-colors cursor-pointer p-2 -m-2 shrink-0"
                              aria-label="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
