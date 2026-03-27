'use client';

import { WorkStepStatus } from '@asko/shared/client';

export function StepCircle({ status, index }: { status: WorkStepStatus; index: number }) {
  const bg =
    status === WorkStepStatus.COMPLETED ? 'bg-green-600 text-white'
      : status === WorkStepStatus.IN_PROGRESS ? 'bg-amber-400 text-white'
        : status === WorkStepStatus.SKIPPED ? 'bg-gray-400 text-white'
          : 'bg-[#E5E5E5] text-text-sub';
  return (
    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${bg}`}>
      {status === WorkStepStatus.COMPLETED ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : status === WorkStepStatus.SKIPPED ? '-' : index + 1}
    </div>
  );
}
