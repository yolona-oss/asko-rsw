'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@asko/ui';

export interface UnsavedChangesDialogProps {
  open: boolean;
  saving?: boolean;
  changes?: string[];
  onSave: () => void;
  onDismiss: () => void;
  onStay: () => void;
}

export function UnsavedChangesDialog({
  open,
  saving,
  changes,
  onSave,
  onDismiss,
  onStay,
}: UnsavedChangesDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onStay} />
      <div className="relative bg-surface shadow-xl mx-4 w-full max-w-sm overflow-hidden">
        <div className="h-1 bg-warning" />
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-warning-bg border border-warning-border flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-medium text-text-main">
                Несохранённые изменения
              </h2>
              <p className="mt-1 text-sm text-text-sub">
                Вы уверены, что хотите уйти? Несохранённые данные будут потеряны.
              </p>
            </div>
          </div>

          {changes && changes.length > 0 && (
            <div className="mt-4 pl-[52px]">
              <p className="text-xs text-text-muted mb-1.5">Изменённые поля:</p>
              <div className="flex flex-wrap gap-1.5">
                {changes.map((label) => (
                  <span
                    key={label}
                    className="text-xs text-text-sub bg-surface-secondary px-2 py-0.5"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button variant="ghost" size="sm" onClick={onStay} disabled={saving}>
              Остаться
            </Button>
            <Button variant="danger" size="sm" onClick={onDismiss} disabled={saving}>
              Не сохранять
            </Button>
            <Button variant="primary" size="sm" onClick={onSave} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
