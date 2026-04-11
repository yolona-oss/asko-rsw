'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SkeletonBlock } from '@asko/ui';
import { invitationApi } from '@/lib/api/invitation';
import { INVITE_ROLE_LABELS, formatDateTime, isExpired } from './constants';

export function InviteListPopup({ onClose }: { onClose: () => void }) {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    invitationApi.getAll()
      .then(({ data }) => setInvites(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      await invitationApi.delete(id);
      setInvites((prev) => prev.filter((inv) => inv.id !== id));
    } catch {} finally {
      setDeleteLoading(null);
    }
  };

  const handleCopy = (invite: any) => {
    const link = `${window.location.origin}/register?invite=${invite.token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-dark-deep/40" />
      <div
        className="relative bg-surface w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-divider">
          <h3 className="text-lg font-medium text-text-main">Все приглашения</h3>
          <button type="button" onClick={onClose} className="text-text-sub hover:text-text-main cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-2 p-5">{Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} className="h-10" />)}</div>
          ) : invites.length === 0 ? (
            <p className="text-sm text-text-sub p-5">Нет приглашений</p>
          ) : (
            invites.map((inv) => {
              const expired = isExpired(inv.expiresAt);
              const inactive = inv.used || expired;
              return (
                <div
                  key={inv.id}
                  className={`flex items-center gap-3 px-5 py-3 border-b border-border-divider ${inactive ? 'opacity-50' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-main">
                        {INVITE_ROLE_LABELS[inv.role] ?? inv.role}
                      </span>
                      {inv.used ? (
                        <span className="text-xs text-text-muted bg-surface-secondary px-1.5 py-0.5 rounded">Использовано</span>
                      ) : expired ? (
                        <span className="text-xs text-error bg-error-bg px-1.5 py-0.5 rounded">Истёк</span>
                      ) : (
                        <span className="text-xs text-success-deep bg-success-bg px-1.5 py-0.5 rounded">Активно</span>
                      )}
                    </div>
                    <p className="text-xs text-text-sub mt-0.5">
                      Истекает: {formatDateTime(inv.expiresAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!inactive && (
                      <button
                        type="button"
                        className="text-xs text-info-deep font-medium hover:underline cursor-pointer"
                        onClick={() => handleCopy(inv)}
                      >
                        {copiedId === inv.id ? 'Скопировано!' : 'Копировать'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-xs text-brand-red font-medium hover:underline cursor-pointer"
                      disabled={deleteLoading === inv.id}
                      onClick={() => handleDelete(inv.id)}
                    >
                      {deleteLoading === inv.id ? '...' : 'Удалить'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
