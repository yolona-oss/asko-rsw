'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from 'react';

export interface FormGuardState {
  dirty: boolean;
  confirmLeave: () => Promise<boolean>;
}

interface FormGuardContextValue {
  register: (state: FormGuardState) => () => void;
  getGuard: () => FormGuardState | null;
}

const FormGuardCtx = createContext<FormGuardContextValue | null>(null);

export function FormGuardProvider({ children }: { children: ReactNode }) {
  const guardRef = useRef<FormGuardState | null>(null);

  const register = useCallback((state: FormGuardState) => {
    guardRef.current = state;
    return () => {
      if (guardRef.current === state) {
        guardRef.current = null;
      }
    };
  }, []);

  const getGuard = useCallback(() => guardRef.current, []);

  return (
    <FormGuardCtx.Provider value={{ register, getGuard }}>
      {children}
    </FormGuardCtx.Provider>
  );
}

export function useFormGuardContext() {
  const ctx = useContext(FormGuardCtx);
  if (!ctx) {
    throw new Error('useFormGuardContext must be used within FormGuardProvider');
  }
  return ctx;
}
