'use client';

import { Card, ContextMenuArea, StatusBadge, buildCardMenuItems } from '@asko/ui';
import type { DropdownMenuEntry } from '@asko/ui';
import type { IAuthUser } from '@/lib/api/types';
import { ROLE_LABELS } from './constants';
import { UserAvatar } from './user-avatar';

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

  const customItems: DropdownMenuEntry[] = [
    {
      key: 'toggle-active',
      label: isActive ? 'Заблокировать' : 'Разблокировать',
      disabled: loading,
      onClick: () => onToggleActive(user.id, !isActive),
    },
    {
      key: 'delete',
      label: 'Удалить',
      variant: 'danger',
      disabled: loading,
      onClick: () => onDelete(user.id),
    },
  ];
  const menuItems = buildCardMenuItems(undefined, undefined, customItems);

  return (
    <ContextMenuArea items={menuItems}>
      <Card padding="none" className={`p-5 flex flex-col gap-3 ${!isActive ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-3">
          <UserAvatar />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-main tracking-[-0.14px]">{name}</p>
            <p className="text-xs text-text-sub">{user.phone ?? '-'}</p>
          </div>
          <StatusBadge active={isActive} />
        </div>
        <div className="flex flex-col gap-1 text-sm text-text-main tracking-[-0.14px]">
          <div className="flex justify-between">
            <span className="text-text-sub">Роль:</span>
            <span>{user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-sub">Район:</span>
            <span>-</span>
          </div>
        </div>
      </Card>
    </ContextMenuArea>
  );
}
