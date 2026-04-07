'use client';

import { Check } from 'lucide-react';
import { formatDate } from './constants';
import type { WorkStep } from './types';

export function WorkStepCard({ step }: { step: WorkStep }) {
  const isCompleted = step.status === 'completed';
  const isInProgress = step.status === 'in_progress';

  return (
    <div className={`flex items-start gap-3 p-4 border transition-colors ${isCompleted ? 'border-green-200 bg-green-50/50' : isInProgress ? 'border-green-400 bg-surface' : 'border-border-light bg-surface'}`}>
      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${isCompleted ? 'bg-green-600' : isInProgress ? 'bg-green-600' : 'bg-[#E8E8E8]'}`}>
        {isCompleted ? (
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        ) : isInProgress ? (
          <div className="w-2 h-2 rounded-full bg-surface animate-pulse" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-skeleton" />
        )}
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className={`text-sm font-medium ${isCompleted ? 'text-green-700' : 'text-text-main'}`}>
          {step.title}
        </span>
        {step.description && (
          <span className="text-xs text-text-sub">{step.description}</span>
        )}
        {isCompleted && (
          <span className="text-xs text-text-sub mt-1">
            {formatDate(step.updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
