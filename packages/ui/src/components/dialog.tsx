'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { cn } from '../utils/cn';
import { Button, type ButtonVariant } from './button';
import { useUiLocale } from '../locale';

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

const DURATION = 200;

export function Dialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'danger',
  loading,
  onConfirm,
  onCancel,
}: DialogProps) {
  const locale = useUiLocale();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, DURATION);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleCancel = useCallback(() => {
    if (closing || loading) return;
    onCancel();
  }, [closing, loading, onCancel]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className={cn(
          'absolute inset-0 bg-black/60',
          closing
            ? 'animate-[fade-out_200ms_ease-in_forwards]'
            : 'animate-[fade-in_200ms_ease-out]',
        )}
        onClick={handleCancel}
      />
      <div
        className={cn(
          'relative bg-surface shadow-lg mx-4 w-full max-w-sm p-6',
          closing
            ? 'animate-[modal-out_200ms_ease-in_forwards]'
            : 'animate-[modal-in_200ms_ease-out]',
        )}
      >
        <h2 className="text-base font-medium text-text-main">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-text-sub">{description}</p>
        )}
        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="secondary" size="sm" onClick={handleCancel} disabled={loading}>
            {cancelLabel ?? locale.dialogCancel}
          </Button>
          <Button variant={confirmVariant} size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel ?? locale.dialogConfirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
