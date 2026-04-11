'use client';

import { Check } from 'lucide-react';
import { WorkStepStatus } from '@asko/shared/client';

export function StepCircle({ status, index }: { status: WorkStepStatus; index: number }) {
  const bg =
    status === WorkStepStatus.COMPLETED ? 'bg-success text-text-on-dark'
      : status === WorkStepStatus.IN_PROGRESS ? 'bg-warning text-text-on-dark'
        : status === WorkStepStatus.SKIPPED ? 'bg-text-muted text-text-on-dark'
          : 'bg-border-light text-text-sub';
  return (
    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${bg}`}>
      {status === WorkStepStatus.COMPLETED ? (
        <Check className="w-3 h-3" strokeWidth={2.5} />
      ) : status === WorkStepStatus.SKIPPED ? '-' : index + 1}
    </div>
  );
}
