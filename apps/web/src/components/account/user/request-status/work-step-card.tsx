'use client';

import { Check, X } from 'lucide-react';
import { formatDate } from './constants';
import type { WorkStep } from './types';

export function WorkStepCard({ step }: { step: WorkStep }) {
  const isCompleted = step.status === 'completed';
  const isInProgress = step.status === 'in_progress';
  const isDeclined = step.status === 'declined';

  const containerClass = isDeclined
    ? 'border-border-light bg-surface-muted opacity-70'
    : isCompleted
    ? 'border-success-border bg-success-bg/50'
    : isInProgress
    ? 'border-success bg-surface'
    : 'border-border-light bg-surface';

  const iconClass = isDeclined
    ? 'bg-text-muted'
    : isCompleted
    ? 'bg-success'
    : isInProgress
    ? 'bg-success'
    : 'bg-border-light';

  const titleClass = isDeclined
    ? 'text-text-sub line-through'
    : isCompleted
    ? 'text-success-deep'
    : 'text-text-main';

  return (
    <div className={`flex items-start gap-3 p-4 border transition-colors ${containerClass}`}>
      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${iconClass}`}>
        {isDeclined ? (
          <X className="w-3.5 h-3.5 text-text-on-dark" strokeWidth={3} />
        ) : isCompleted ? (
          <Check className="w-3.5 h-3.5 text-text-on-dark" strokeWidth={3} />
        ) : isInProgress ? (
          <div className="w-2 h-2 rounded-full bg-surface animate-pulse" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-skeleton" />
        )}
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${titleClass}`}>
            {step.title}
          </span>
          {step.isMandatory && (
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 border border-border-light bg-surface-muted text-text-sub">
              Обязательный
            </span>
          )}
        </div>
        {step.description && (
          <span className="text-xs text-text-sub">{step.description}</span>
        )}
        {step.comment && (
          <div className="mt-1 pl-2 border-l-2 border-border-light">
            <span className="text-xs text-text-main whitespace-pre-wrap">{step.comment}</span>
          </div>
        )}
        {isDeclined && (
          <span className="text-xs text-text-sub mt-1">
            Отклонено новым мастером{step.declinedAt ? ` — ${formatDate(step.declinedAt)}` : ''}
          </span>
        )}
        {isCompleted && !isDeclined && (
          <span className="text-xs text-text-sub mt-1">
            {formatDate(step.updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
