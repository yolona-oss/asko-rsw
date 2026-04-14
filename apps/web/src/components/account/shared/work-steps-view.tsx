'use client';

import { useState, useEffect } from 'react';
import { Card } from '@asko/ui';
import { repairRequestApi } from '@/lib/api/repair-request';
import { WorkStepCard } from '@/components/account/user/request-status/work-step-card';

interface WorkStepsViewProps {
  requestId: string;
}

export function WorkStepsView({ requestId }: WorkStepsViewProps) {
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    repairRequestApi.getSteps(requestId)
      .then(({ data }) => setSteps((data as any).steps ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [requestId]);

  if (loading) {
    return (
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-text-main">Этапы работы</h2>
        <div className="h-16 bg-surface-secondary animate-pulse" />
      </Card>
    );
  }

  const sorted = [...steps].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return null;

  const active = sorted.filter(s => s.status !== 'declined');
  const done = active.filter(s => s.status === 'completed' || s.status === 'skipped').length;

  return (
    <Card className="flex flex-col gap-3 sm:gap-4">
      <h2 className="text-lg font-medium text-text-main">Этапы работы</h2>

      {active.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-surface-secondary overflow-hidden">
            <div className="h-full bg-success transition-all duration-300" style={{ width: `${(done / active.length) * 100}%` }} />
          </div>
          <span className="text-[12px] sm:text-sm text-text-sub shrink-0">{done}/{active.length}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {sorted.map((step, idx) => (
          <WorkStepCard key={step.id} step={step} index={idx} />
        ))}
      </div>
    </Card>
  );
}
