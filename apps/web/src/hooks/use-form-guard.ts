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
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { useFormGuardContext } from '@/components/account/layout/form-guard-context';
import { UnsavedChangesDialog } from '@/components/shared/unsaved-changes-dialog';
import { DraftResumeDialog } from '@/components/shared/draft-resume-dialog';

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
  /** Maps field keys to human-readable labels shown in the unsaved-changes dialog */
  fieldLabels?: Record<string, string>;
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
    fieldLabels,
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
  const [changes, setChanges] = useState<string[] | undefined>(undefined);

  const pendingActionRef = useRef<(() => void) | null>(null);
  const currentStateRef = useRef(currentState);
  const dirtyRef = useRef(dirty);
  const onSaveRef = useRef(onSave);
  const onApplyDraftRef = useRef(onApplyDraft);
  const fieldLabelsRef = useRef(fieldLabels);
  const initialStateRef = useRef(initialState);
  const enabledRef = useRef(enabled);
  const externalDirtyRef = useRef(externalDirty);

  currentStateRef.current = currentState;
  dirtyRef.current = dirty;
  onSaveRef.current = onSave;
  onApplyDraftRef.current = onApplyDraft;
  fieldLabelsRef.current = fieldLabels;
  initialStateRef.current = initialState;
  enabledRef.current = enabled;
  externalDirtyRef.current = externalDirty;

  // --- localStorage draft ---
  const fullKey = STORAGE_KEYS.draft(storageKey);

  const [draft, setDraft] = useState<DraftEntry<T> | null>(() => {
    const entry = storage.getJSON<DraftEntry<T>>(fullKey);
    if (!entry) return null;
    if (Date.now() - entry.savedAt > DRAFT_TTL) {
      storage.remove(fullKey);
      return null;
    }
    return entry;
  });

  const draftRef = useRef(draft);
  draftRef.current = draft;

  const removeDraft = useCallback(() => {
    storage.remove(fullKey);
    setDraft(null);
  }, [fullKey]);

  // --- Guard dialog logic ---
  const stayResolverRef = useRef<((v: boolean) => void) | null>(null);

  /** Fresh dirty computation from refs — immune to stale render state. */
  const isDirtyNow = useCallback((): boolean => {
    if (!enabledRef.current) return false;
    if (externalDirtyRef.current !== undefined) return externalDirtyRef.current;
    const ini = initialStateRef.current;
    return ini !== undefined && !deepEqual(currentStateRef.current, ini);
  }, []);

  const snapshotChanges = useCallback(() => {
    const labels = fieldLabelsRef.current;
    const ini = initialStateRef.current;
    if (!labels || ini === undefined) { setChanges(undefined); return; }
    const cur = currentStateRef.current as Record<string, unknown>;
    const iniRec = ini as Record<string, unknown>;
    const result: string[] = [];
    for (const key of Object.keys(labels)) {
      if (!deepEqual(cur[key], iniRec[key])) result.push(labels[key]);
    }
    setChanges(result.length > 0 ? result : undefined);
  }, []);

  const requestLeave = useCallback((action: () => void) => {
    if (!isDirtyNow()) {
      action();
      return;
    }
    pendingActionRef.current = action;
    snapshotChanges();
    setShowGuard(true);
  }, [isDirtyNow, snapshotChanges]);

  const confirmLeaveForContext = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!isDirtyNow()) {
        resolve(true);
        return;
      }
      stayResolverRef.current = resolve;
      pendingActionRef.current = () => resolve(true);
      snapshotChanges();
      setShowGuard(true);
    });
  }, [isDirtyNow, snapshotChanges]);

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
    setShowGuard(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    stayResolverRef.current = null;
    action?.();
  }, []);

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
        return isDirtyNow();
      },
      confirmLeave: confirmLeaveForContext,
    };
    const unregister = register(state);
    return unregister;
  }, [register, confirmLeaveForContext, isDirtyNow]);

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
      if (!isDirtyNow()) return;
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
  }, [dirty, enabled, requestLeave, isDirtyNow]);

  // --- Render dialogs ---
  const guardDialog = useMemo(
    () =>
      createElement(UnsavedChangesDialog, {
        open: showGuard,
        saving,
        changes,
        onSave: handleSave,
        onDismiss: handleDismiss,
        onStay: handleStay,
      }),
    [showGuard, saving, changes, handleSave, handleDismiss, handleStay],
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
