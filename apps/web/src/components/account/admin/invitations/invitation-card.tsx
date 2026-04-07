'use client';

import {
  Badge,
  Card,
  ContextMenuArea,
  buildCardMenuItems,
} from '@asko/ui';
import type { DropdownMenuEntry } from '@asko/ui';
import { useClickHandlers } from '@/hooks/use-click-handlers';
import type { IInvitationLink } from '@/lib/api/types';
import { ROLE_LABELS, formatDate, isExpired } from './constants';

export function InvitationCard({
  invitation,
  link,
  onDelete,
  deleteLoading,
  onClick,
}: {
  invitation: IInvitationLink;
  link?: string;
  onDelete: (id: string) => void;
  deleteLoading: string | null;
  onClick?: () => void;
}) {
  const { handleClick } = useClickHandlers(onClick);
  const expired = isExpired(invitation.expiresAt);
  const inactive = invitation.used || expired;
  const resolvedLink = link ?? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite=${invitation.token}`;

  const customItems: DropdownMenuEntry[] = [];
  if (!inactive) {
    customItems.push({
      key: 'copy',
      label: 'Копировать ссылку',
      onClick: () => navigator.clipboard.writeText(resolvedLink),
    });
  }
  customItems.push({
    key: 'delete',
    label: 'Удалить',
    variant: 'danger',
    disabled: deleteLoading === invitation.id,
    onClick: () => onDelete(invitation.id),
  });
  const menuItems = buildCardMenuItems(onClick, undefined, customItems);

  return (
    <ContextMenuArea items={menuItems}>
      <Card padding="none" className={`p-5 flex flex-col gap-3 ${inactive ? 'opacity-50' : ''}${onClick ? ' cursor-pointer' : ''}`} onClick={handleClick}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-text-main">
            {ROLE_LABELS[invitation.role] ?? invitation.role}
          </p>
          {invitation.used ? (
            <Badge variant="neutral">Использовано</Badge>
          ) : expired ? (
            <Badge variant="error">Истёк</Badge>
          ) : (
            <Badge variant="success">Активно</Badge>
          )}
        </div>
        <p className="text-xs font-mono text-text-sub truncate">{invitation.token.slice(0, 20)}...</p>
        <p className={`text-sm ${expired ? 'text-brand-red' : 'text-text-main'}`}>
          Истекает: {formatDate(invitation.expiresAt)}
        </p>
        {link && (
          <p className="text-xs font-mono text-text-main break-all bg-green-50 p-2">{link}</p>
        )}
      </Card>
    </ContextMenuArea>
  );
}
