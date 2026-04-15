'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
  createElement,
} from 'react';
import { useRouter } from 'next/navigation';
import { deepEqual } from '@/lib/deep-equal';
import { useFormGuardContext } from '@/components/account/layout/form-guard-context';
import { UnsavedChangesDialog } from '@/components/shared/unsaved-changes-dialog';
import { DraftResumeDialog } from '@/components/shared/draft-resume-dialog';

const DRAFT_PREFIX = 'asko:draft:';
const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface DraftEntry<T> {
  data: T;
  savedAt: number;
}

export interface UseFormGuardOptions<T> {
  storageKey: string;
  currentState: T;
  initialState: T | undefined;
  onSave?: () => Promise<void>;
  /** Called when user chooses to resume a saved draft */
  onApplyDraft?: (data: T) => void;
  externalDirty?: boolean;
  enabled?: boolean;
}

export interface UseFormGuardReturn {
  dirty: boolean;
  guardDialog: ReactNode;
  draftDialog: ReactNode;
  guardedClose: (close: () => void) => () => void;
  guardedNavigate: (href: string) => void;
  markSaved: () => void;
  markReset: () => void;
  discardDraft: () => void;
  hasDraft: boolean;
  draftSavedAt: number | null;
}

export function useFormGuard<T>(
  options: UseFormGuardOptions<T>,
): UseFormGuardReturn {
  const {
    storageKey,
    currentState,
    initialState,
    onSave,
    onApplyDraft,
    externalDirty,
    enabled = true,
  } = options;

  const router = useRouter();
  const { register } = useFormGuardContext();

  // --- Dirty detection ---
  const dirty = enabled
    ? externalDirty !== undefined
      ? externalDirty
      : initialState !== undefined && !deepEqual(currentState, initialState)
    : false;

  // --- Internal state ---
  const [showGuard, setShowGuard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDraft, setShowDraft] = useState(false);

  const pendingActionRef = useRef<(() => void) | null>(null);
  const currentStateRef = useRef(currentState);
  const dirtyRef = useRef(dirty);
  const onSaveRef = useRef(onSave);
  const onApplyDraftRef = useRef(onApplyDraft);

  currentStateRef.current = currentState;
  dirtyRef.current = dirty;
  onSaveRef.current = onSave;
  onApplyDraftRef.current = onApplyDraft;

  // --- localStorage draft ---
  const fullKey = DRAFT_PREFIX + storageKey;

  const [draft, setDraft] = useState<DraftEntry<T> | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return null;
      const entry = JSON.parse(raw) as DraftEntry<T>;
      if (Date.now() - entry.savedAt > DRAFT_TTL) {
        localStorage.removeItem(fullKey);
        return null;
      }
      return entry;
    } catch {
      return null;
    }
  });

  const draftRef = useRef(draft);
  draftRef.current = draft;

  const saveDraft = useCallback(() => {
    try {
      const entry: DraftEntry<T> = {
        data: currentStateRef.current,
        savedAt: Date.now(),
      };
      localStorage.setItem(fullKey, JSON.stringify(entry));
    } catch {
      // localStorage full or unavailable
    }
  }, [fullKey]);

  const removeDraft = useCallback(() => {
    try {
      localStorage.removeItem(fullKey);
    } catch {
      // ignore
    }
    setDraft(null);
  }, [fullKey]);

  // --- Guard dialog logic ---
  const stayResolverRef = useRef<((v: boolean) => void) | null>(null);

  const requestLeave = useCallback((action: () => void) => {
    if (!dirtyRef.current) {
      action();
      return;
    }
    pendingActionRef.current = action;
    setShowGuard(true);
  }, []);

  const confirmLeaveForContext = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!dirtyRef.current) {
        resolve(true);
        return;
      }
      stayResolverRef.current = resolve;
      pendingActionRef.current = () => resolve(true);
      setShowGuard(true);
    });
  }, []);

  const handleSave = useCallback(async () => {
    const save = onSaveRef.current;
    if (!save) return;
    setSaving(true);
    try {
      await save();
      removeDraft();
      setShowGuard(false);
      setSaving(false);
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      stayResolverRef.current = null;
      action?.();
    } catch {
      setSaving(false);
    }
  }, [removeDraft]);

  const handleDismiss = useCallback(() => {
    saveDraft();
    setShowGuard(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    stayResolverRef.current = null;
    action?.();
  }, [saveDraft]);

  const handleStay = useCallback(() => {
    setShowGuard(false);
    pendingActionRef.current = null;
    stayResolverRef.current?.(false);
    stayResolverRef.current = null;
  }, []);

  // --- Public API ---
  const guardedClose = useCallback(
    (close: () => void) => {
      return () => requestLeave(close);
    },
    [requestLeave],
  );

  const guardedNavigate = useCallback(
    (href: string) => {
      requestLeave(() => router.push(href));
    },
    [requestLeave, router],
  );

  const markSaved = useCallback(() => {
    removeDraft();
  }, [removeDraft]);

  const markReset = useCallback(() => {
    removeDraft();
  }, [removeDraft]);

  const handleResumeDraft = useCallback(() => {
    const d = draftRef.current;
    if (d) {
      onApplyDraftRef.current?.(d.data);
      removeDraft();
    }
    setShowDraft(false);
  }, [removeDraft]);

  const discardDraft = useCallback(() => {
    removeDraft();
    setShowDraft(false);
  }, [removeDraft]);

  // --- Show draft dialog on mount if draft exists ---
  useEffect(() => {
    if (draft && initialState !== undefined) {
      setShowDraft(true);
    }
  }, [draft !== null, initialState !== undefined]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Register into FormGuardContext ---
  useEffect(() => {
    const state = {
      get dirty() {
        return dirtyRef.current;
      },
      confirmLeave: confirmLeaveForContext,
    };
    const unregister = register(state);
    return unregister;
  }, [register, confirmLeaveForContext]);

  // --- beforeunload ---
  useEffect(() => {
    if (!dirty || !enabled) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, enabled]);

  // --- popstate (browser back/forward) ---
  useEffect(() => {
    if (!dirty || !enabled) return;

    window.history.pushState({ __formGuard: true }, '');

    const handler = () => {
      if (!dirtyRef.current) return;
      window.history.pushState({ __formGuard: true }, '');
      requestLeave(() => {
        window.history.go(-2);
      });
    };

    window.addEventListener('popstate', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      if (window.history.state?.__formGuard) {
        window.history.back();
      }
    };
  }, [dirty, enabled, requestLeave]);

  // --- Render dialogs ---
  const guardDialog = useMemo(
    () =>
      createElement(UnsavedChangesDialog, {
        open: showGuard,
        saving,
        onSave: handleSave,
        onDismiss: handleDismiss,
        onStay: handleStay,
      }),
    [showGuard, saving, handleSave, handleDismiss, handleStay],
  );

  const draftDialog = useMemo(
    () =>
      draft
        ? createElement(DraftResumeDialog, {
            open: showDraft,
            savedAt: draft.savedAt,
            onResume: handleResumeDraft,
            onFresh: discardDraft,
          })
        : null,
    [showDraft, draft, handleResumeDraft, discardDraft],
  );

  return {
    dirty,
    guardDialog,
    draftDialog,
    guardedClose,
    guardedNavigate,
    markSaved,
    markReset,
    discardDraft,
    hasDraft: draft !== null,
    draftSavedAt: draft?.savedAt ?? null,
  };
}
