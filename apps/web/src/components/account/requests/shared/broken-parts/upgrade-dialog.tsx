'use client';

import { useState, useCallback } from 'react';
import { Button, Modal } from '@asko/ui';
import { ArrowUpCircle, X } from 'lucide-react';
import { repairRequestApi } from '@/lib/api/repair-request';
import type { BrokenPart } from './types';

interface UpgradeDialogProps {
  open: boolean;
  requestId: string;
  part: BrokenPart | null;
  onClose: () => void;
  onUpgraded: (part: BrokenPart) => void;
}

export function UpgradeDialog({ open, requestId, part, onClose, onUpgraded }: UpgradeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = useCallback(async () => {
    if (!part) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await repairRequestApi.upgradeBrokenPartSuggestion(requestId, part.id);
      const upgraded = (data.part ?? data) as BrokenPart;
      onUpgraded(upgraded);
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Не удалось подтвердить предположение');
    } finally {
      setLoading(false);
    }
  }, [part, requestId, onUpgraded, onClose]);

  return (
    <Modal open={open} onClose={loading ? undefined : onClose}>
      <div className="flex flex-col gap-4 p-6 w-full sm:w-[420px]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-text-main">Подтвердить предположение</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-text-sub hover:text-text-main cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {part && (
          <div className="flex flex-col gap-1 p-3 border border-border-light bg-surface-secondary">
            <p className="text-sm font-medium text-text-main">{part.name}</p>
            {part.note && <p className="text-xs text-text-sub">{part.note}</p>}
          </div>
        )}

        <p className="text-sm text-text-sub">
          Предположение клиента будет преобразовано в подтверждённую запчасть. После этого она появится в основном списке и с ней можно будет работать как с обычной запчастью.
        </p>

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleUpgrade} disabled={loading || !part}>
            <ArrowUpCircle className="w-4 h-4 mr-1.5 inline" />
            {loading ? 'Подтверждение...' : 'Подтвердить'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
