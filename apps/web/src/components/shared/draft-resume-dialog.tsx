'use client';

import { History } from 'lucide-react';
import { Button } from '@asko/ui';
import { formatTimeAgo } from '@asko/shared/client';

export interface DraftResumeDialogProps {
  open: boolean;
  savedAt: number;
  onResume: () => void;
  onFresh: () => void;
}

export function DraftResumeDialog({
  open,
  savedAt,
  onResume,
  onFresh,
}: DraftResumeDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onFresh} />
      <div className="relative bg-surface shadow-xl mx-4 w-full max-w-sm overflow-hidden">
        <div className="h-1 bg-info" />
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-info-bg border border-info-border flex items-center justify-center">
              <History className="w-5 h-5 text-info" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-medium text-text-main">Черновик</h2>
              <p className="mt-1 text-sm text-text-sub">
                Найден несохранённый черновик (сохранён{' '}
                {formatTimeAgo(savedAt)}). Продолжить редактирование?
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <Button variant="ghost" size="sm" onClick={onFresh}>
              Начать заново
            </Button>
            <Button variant="primary" size="sm" onClick={onResume}>
              Продолжить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
