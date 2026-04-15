'use client';

import { Badge } from '@asko/ui';
import { formatDate } from './detail-constants';
import type { WorkStep } from './detail-types';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'В процессе',
  completed: 'Выполнен',
  skipped: 'Пропущен',
  declined: 'Отклонён',
};

const STATUS_BADGE: Record<string, 'neutral' | 'warning' | 'success' | 'error' | 'info'> = {
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
  const isDiagnostic = !!step.isMandatory && step.title === 'Диагностика' && !isDeclined;

  const blockClass = isDiagnostic
    ? isCompleted ? 'border-info-border bg-info-bg' : 'border-info-border bg-info-bg/50'
    : BLOCK_CLASS[step.status] ?? 'border-border-light bg-surface';

  return (
    <div className={`p-3 sm:p-4 border flex flex-col gap-2 transition-colors ${blockClass}`}>
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={isDiagnostic ? 'info' : (STATUS_BADGE[step.status] ?? 'neutral')}>
          {isDiagnostic ? 'Диагностика' : (STATUS_LABEL[step.status] ?? step.status)}
        </Badge>
        {!isDiagnostic && step.isMandatory && <Badge variant="neutral">Обязательный</Badge>}
        {isDiagnostic && step.status !== 'pending' && (
          <Badge variant={STATUS_BADGE[step.status] ?? 'neutral'}>
            {STATUS_LABEL[step.status] ?? step.status}
          </Badge>
        )}
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

      {/* Comment / diagnostic result */}
      {step.comment && (
        <div className={`pl-3 border-l-2 ${isDiagnostic ? 'border-info-border' : 'border-border-light'}`}>
          {isDiagnostic && <p className="text-[11px] sm:text-xs text-text-sub mb-0.5">Результат диагностики</p>}
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
