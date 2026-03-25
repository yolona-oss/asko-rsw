'use client';

import { useEffect, useCallback } from 'react';
import { useError } from '@/lib/hooks/use-error';
import { Modal, Button } from '@asko/ui';

export function ErrorModal() {
  const { errors, dismissError, dismissAll } = useError();
  const current = errors[errors.length - 1] ?? null;

  const handleDismiss = useCallback(() => {
    if (current) dismissError(current.id);
  }, [current, dismissError]);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => dismissError(current.id), 15_000);
    return () => clearTimeout(timer);
  }, [current?.id, dismissError]);

  if (!current) return null;

  return (
    <Modal open onClose={handleDismiss} className="w-full max-w-md">
      <div className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-brand-red"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-text-main">
              {current.title}
            </h3>
            <p className="mt-1 text-sm text-text-sub">{current.message}</p>

            {current.details && (
              <details className="mt-3">
                <summary className="text-xs text-text-sub cursor-pointer hover:text-text-main transition-colors">
                  Подробности
                </summary>
                <pre className="mt-2 text-xs text-text-sub bg-gray-50 rounded-sm p-3 overflow-x-auto max-h-32">
                  {current.details}
                </pre>
              </details>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {errors.length > 1 ? (
            <button
              onClick={dismissAll}
              className="text-xs text-text-sub hover:text-text-main transition-colors cursor-pointer"
            >
              Закрыть все ({errors.length})
            </button>
          ) : (
            <span />
          )}
          <Button variant="secondary" size="sm" onClick={handleDismiss}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
}
