'use client';

import { Check, X } from 'lucide-react';
import { formatDate } from './constants';
import type { WorkStep } from './types';

export function WorkStepCard({ step }: { step: WorkStep }) {
  const isCompleted = step.status === 'completed';
  const isInProgress = step.status === 'in_progress';
  const isDeclined = step.status === 'declined';

  const containerClass = isDeclined
    ? 'border-border-light bg-[#F5F5F5] opacity-70'
    : isCompleted
    ? 'border-green-200 bg-green-50/50'
    : isInProgress
    ? 'border-green-400 bg-surface'
    : 'border-border-light bg-surface';

  const iconClass = isDeclined
    ? 'bg-[#9CA3AF]'
    : isCompleted
    ? 'bg-green-600'
    : isInProgress
    ? 'bg-green-600'
    : 'bg-[#E8E8E8]';

  const titleClass = isDeclined
    ? 'text-text-sub line-through'
    : isCompleted
    ? 'text-green-700'
    : 'text-text-main';

  return (
    <div className={`flex items-start gap-3 p-4 border transition-colors ${containerClass}`}>
      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${iconClass}`}>
        {isDeclined ? (
          <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        ) : isCompleted ? (
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
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
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 border border-border-light bg-[#F5F5F5] text-text-sub">
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
