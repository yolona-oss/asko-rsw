'use client';

import { Card } from '@asko/ui';
import type { IAuthUser } from '@/lib/api/types';
import { ROLE_LABELS } from './constants';
import { UserAvatar } from './user-avatar';
import { StatusBadge } from './status-badge';
import { SettingsDropdown } from './settings-dropdown';

export function UserCard({
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
  const name = [user.lastName, user.firstName, (user as any).middleName].filter(Boolean).join(' ') || 'Без имени';
  const isActive = (user as any).isActive !== false;

  return (
    <Card padding="none" className={`p-5 flex flex-col gap-3 ${!isActive ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <UserAvatar />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#323232] tracking-[-0.14px]">{name}</p>
          <p className="text-xs text-text-sub">{user.phone ?? '-'}</p>
        </div>
        <StatusBadge isActive={isActive} />
      </div>
      <div className="flex flex-col gap-1 text-sm text-[#323232] tracking-[-0.14px]">
        <div className="flex justify-between">
          <span className="text-text-sub">Роль:</span>
          <span>{user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-sub">Район:</span>
          <span>-</span>
        </div>
      </div>
      <div className="pt-1">
        <SettingsDropdown
          user={user}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
          loading={loading}
        />
      </div>
    </Card>
  );
}
