'use client';

import { type ReactNode } from 'react';
import { Button, type ButtonVariant } from './button';

export interface DialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Dialog({
  open,
  title,
  description,
  confirmLabel = 'Продолжить',
  cancelLabel = 'Отмена',
  confirmVariant = 'danger',
  loading,
  onConfirm,
  onCancel,
}: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-white rounded-sm shadow-lg mx-4 w-full max-w-sm p-6">
        <h2 className="text-base font-medium text-text-main">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-text-sub">{description}</p>
        )}
        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} size="sm" onClick={onConfirm} disabled={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
