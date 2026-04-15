'use client';

import { Button } from '@asko/ui';
import { formatTimeAgo } from '@/lib/format-time-ago';

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
      <div className="relative bg-surface shadow-lg mx-4 w-full max-w-sm p-6">
        <h2 className="text-base font-medium text-text-main">Черновик</h2>
        <p className="mt-2 text-sm text-text-sub">
          Найден несохранённый черновик (сохранён {formatTimeAgo(savedAt)}).
          Продолжить редактирование?
        </p>
        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="secondary" size="sm" onClick={onFresh}>
            Начать заново
          </Button>
          <Button variant="primary" size="sm" onClick={onResume}>
            Продолжить
          </Button>
        </div>
      </div>
    </div>
  );
}
