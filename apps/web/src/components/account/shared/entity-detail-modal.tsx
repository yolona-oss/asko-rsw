'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Modal } from '@asko/ui';
import { ShieldAlert, ExternalLink } from 'lucide-react';

export interface EntityDetailModalProps<T> {
  open: boolean;
  onClose: () => void;
  /** Item from the list (always available for immediate display) */
  item: T | null;
  /** Modal title */
  title: string;
  /** Fetch full entity data by ID. Receives the item, should return enriched data. Errors with status 403 show "Нет доступа". */
  fetchOne?: (item: T) => Promise<T>;
  /** Render detail content. Receives the (possibly fetched) item and loading state */
  renderContent: (item: T, loading: boolean) => ReactNode;
  /** If provided, shows a "Перейти" button that calls this callback */
  onEdit?: (item: T) => void;
}

export function EntityDetailModal<T>({
  open,
  onClose,
  item,
  title,
  fetchOne,
  renderContent,
  onEdit,
}: EntityDetailModalProps<T>) {
  const [fetched, setFetched] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!open || !item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFetched(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccessDenied(false);
      return;
    }
    if (!fetchOne) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFetched(null);
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFetched(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccessDenied(false);

    fetchOne(item)
      .then((data) => setFetched(data))
      .catch((err: any) => {
        if (err?.response?.status === 403) {
          setAccessDenied(true);
        }
      })
      .finally(() => setLoading(false));
  }, [open, item, fetchOne]);

  if (!item) return null;

  const displayItem = fetched ?? item;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col gap-5 p-6 w-full sm:w-[520px]">
        <h2 className="text-lg font-medium text-text-main">{title}</h2>

        {accessDenied ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <ShieldAlert className="w-10 h-10 text-text-sub" />
            <p className="text-sm font-medium text-text-main">Нет доступа</p>
            <p className="text-sm text-text-sub">У вас нет прав для просмотра данного объекта.</p>
          </div>
        ) : (
          renderContent(displayItem, loading)
        )}

        <div className="flex items-center justify-end gap-2">
          {onEdit && !accessDenied && (
            <button
              type="button"
              onClick={() => { onEdit(displayItem); onClose(); }}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-dark-deep text-text-on-dark hover:bg-dark transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Перейти
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium border border-border-light text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Modal>
  );
}
