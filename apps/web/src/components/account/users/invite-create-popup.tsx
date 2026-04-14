'use client';

import { useState } from 'react';
import { Button, Select } from '@asko/ui';
import { X } from 'lucide-react';
import { invitationApi } from '@/lib/api/invitation';
import { Role } from '@asko/shared/client';
import { ROLE_OPTIONS, TTL_OPTIONS } from './constants';

export function InviteCreatePopup({ onClose }: { onClose: () => void }) {
  const [role, setRole] = useState('');
  const [ttl, setTtl] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!role) return;
    setCreating(true);
    setError('');
    setCreatedLink('');
    try {
      const { data } = await invitationApi.create({
        role: role as Role,
        ttl: ttl !== '' ? ttl : undefined,
      });
      setCreatedLink((data as any).link);
    } catch {
      setError('Не удалось создать приглашение');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(createdLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-overlay-dark/60" />
      <div
        className="relative bg-surface w-full max-w-md mx-4 p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-text-main">Создать приглашение</h3>
          <button type="button" onClick={onClose} className="text-text-sub hover:text-text-main cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-main">Роль</label>
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="text-sm">
            <option value="" disabled>Выбрать роль</option>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-main">Срок действия</label>
          <Select
            value={ttl}
            onChange={(e) => setTtl(e.target.value === '' ? '' : Number(e.target.value))}
            className="text-sm"
          >
            <option value="">7 дней (по умолч.)</option>
            {TTL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>

        {createdLink && (
          <div className="flex flex-col gap-2 p-3 bg-success-bg border border-success-border">
            <p className="text-xs font-mono text-text-main break-all">{createdLink}</p>
            <button
              type="button"
              className="text-xs text-success-deep font-medium hover:underline cursor-pointer text-left"
              onClick={handleCopy}
            >
              {copied ? 'Скопировано!' : 'Копировать ссылку'}
            </button>
          </div>
        )}

        {error && <p className="text-xs text-brand-red">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Закрыть</Button>
          <Button onClick={handleCreate} disabled={!role || creating}>
            {creating ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </div>
    </div>
  );
}
