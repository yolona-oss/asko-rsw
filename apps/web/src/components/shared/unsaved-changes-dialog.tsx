'use client';

import { Button } from '@asko/ui';

export interface UnsavedChangesDialogProps {
  open: boolean;
  saving?: boolean;
  onSave: () => void;
  onDismiss: () => void;
  onStay: () => void;
}

export function UnsavedChangesDialog({
  open,
  saving,
  onSave,
  onDismiss,
  onStay,
}: UnsavedChangesDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onStay} />
      <div className="relative bg-surface shadow-lg mx-4 w-full max-w-sm p-6">
        <h2 className="text-base font-medium text-text-main">
          Несохранённые изменения
        </h2>
        <p className="mt-2 text-sm text-text-sub">
          У вас есть несохранённые изменения. Что вы хотите сделать?
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3 sm:justify-end">
          <Button variant="secondary" size="sm" onClick={onStay} disabled={saving}>
            Остаться
          </Button>
          <Button variant="danger" size="sm" onClick={onDismiss} disabled={saving}>
            Отменить изменения
          </Button>
          <Button variant="primary" size="sm" onClick={onSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
