'use client';

import { Badge } from '@asko/ui';
import { formatDate } from './constants';
import type { WorkStep } from './types';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'В процессе',
  completed: 'Выполнен',
  skipped: 'Пропущен',
  declined: 'Отклонён',
};

const STATUS_BADGE: Record<string, 'neutral' | 'warning' | 'success' | 'error'> = {
  pending: 'neutral',
  in_progress: 'warning',
  completed: 'success',
  skipped: 'neutral',
  declined: 'error',
};

const BLOCK_CLASS: Record<string, string> = {
  pending: 'border-border-light bg-surface',
  in_progress: 'border-warning-border bg-warning-bg',
  completed: 'border-success-border bg-success-bg/50',
  skipped: 'border-border-light bg-surface-secondary',
  declined: 'border-border-light bg-surface-muted opacity-60',
};

export function WorkStepCard({ step, index }: { step: WorkStep; index: number }) {
  const isDeclined = step.status === 'declined';
  const isCompleted = step.status === 'completed';

  return (
    <div className={`p-3 sm:p-4 border flex flex-col gap-2 transition-colors ${BLOCK_CLASS[step.status] ?? 'border-border-light bg-surface'}`}>
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={STATUS_BADGE[step.status] ?? 'neutral'}>
          {STATUS_LABEL[step.status] ?? step.status}
        </Badge>
        {step.isMandatory && <Badge variant="neutral">Обязательный</Badge>}
      </div>

      {/* Title */}
      <div className="flex items-center gap-2 text-[13px] sm:text-sm">
        <span className="text-text-sub font-semibold shrink-0">Шаг {index + 1}.</span>
        <span className={`font-medium ${isDeclined ? 'text-text-sub line-through' : isCompleted ? 'text-success-deep' : 'text-text-main'}`}>
          {step.title}
        </span>
      </div>

      {/* Description */}
      {step.description && (
        <p className="text-[12px] sm:text-sm text-text-sub">{step.description}</p>
      )}

      {/* Comment */}
      {step.comment && (
        <div className="pl-3 border-l-2 border-border-light">
          <p className="text-[12px] sm:text-sm text-text-main whitespace-pre-wrap">{step.comment}</p>
        </div>
      )}

      {/* Declined info */}
      {isDeclined && (
        <p className="text-[12px] sm:text-sm text-text-sub">
          Отклонено новым мастером{step.declinedAt ? ` — ${formatDate(step.declinedAt)}` : ''}
        </p>
      )}

      {/* Completed timestamp */}
      {isCompleted && !isDeclined && (
        <p className="text-[12px] sm:text-sm text-text-sub">{formatDate(step.updatedAt)}</p>
      )}
    </div>
  );
}
