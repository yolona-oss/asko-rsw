'use client';

import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/index';
import { showError, dismissError, dismissAll, selectErrors } from '@/store/errors';
import { extractErrorMessage } from '@/lib/error-utils';

export function useError() {
  const errors = useAppSelector(selectErrors);
  const dispatch = useAppDispatch();

  const handleError = useCallback(
    (error: unknown, fallbackMessage?: string) => {
      const message = fallbackMessage ?? extractErrorMessage(error);
      const action = dispatch(showError(message));
      return action.payload.id;
    },
    [dispatch],
  );

  return {
    errors,
    showError: useCallback(
      (message: string, title?: string, details?: string) => {
        const action = dispatch(showError(message, title, details));
        return action.payload.id;
      },
      [dispatch],
    ),
    handleError,
    dismissError: useCallback((id: string) => dispatch(dismissError(id)), [dispatch]),
    dismissAll: useCallback(() => dispatch(dismissAll()), [dispatch]),
  };
}
