'use client';

import { DropdownMenu } from '@asko/ui';
import type { DropdownMenuEntry } from '@asko/ui';
import type { AuthUser } from '@/lib/api/types';

export function SettingsDropdown({
  user,
  onToggleActive,
  onDelete,
  loading,
}: {
  user: AuthUser;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const isActive = user.isActive !== false;

  const items: DropdownMenuEntry[] = [
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

  return (
    <DropdownMenu
      trigger={
        <button
          type="button"
          className="text-info-deep font-medium text-base hover:underline cursor-pointer tracking-[-0.16px]"
          disabled={loading}
        >
          Настроить
        </button>
      }
      items={items}
      placement="bottom-end"
    />
  );
}
