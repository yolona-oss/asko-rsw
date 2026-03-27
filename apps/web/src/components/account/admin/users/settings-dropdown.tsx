'use client';

import { useState, useEffect, useRef } from 'react';
import type { IAuthUser } from '@/lib/api/types';

export function SettingsDropdown({
  user,
  onToggleActive,
  onDelete,
  loading,
}: {
  user: IAuthUser;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const isActive = (user as any).isActive !== false;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="text-[#1855a4] font-medium text-base hover:underline cursor-pointer tracking-[-0.16px]"
        onClick={() => setOpen(!open)}
        disabled={loading}
      >
        Настроить
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border-light shadow-lg min-w-[180px]">
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm text-text-main hover:bg-[#f6f6f8] cursor-pointer"
            disabled={loading}
            onClick={() => { onToggleActive(user.id, !isActive); setOpen(false); }}
          >
            {isActive ? 'Заблокировать' : 'Разблокировать'}
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm text-brand-red hover:bg-[#f6f6f8] cursor-pointer"
            disabled={loading}
            onClick={() => { onDelete(user.id); setOpen(false); }}
          >
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}
