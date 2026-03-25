'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { errorStore, extractErrorMessage } from '../error-store';

export function useError() {
  const errors = useSyncExternalStore(
    errorStore.subscribe,
    errorStore.getSnapshot,
    errorStore.getSnapshot,
  );

  const handleError = useCallback(
    (error: unknown, fallbackMessage?: string) => {
      const message = fallbackMessage ?? extractErrorMessage(error);
      return errorStore.show(message);
    },
    [],
  );

  return {
    errors,
    showError: errorStore.show,
    handleError,
    dismissError: errorStore.dismiss,
    dismissAll: errorStore.dismissAll,
  };
}
