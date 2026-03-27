'use client';

import {
  Button,
  Badge,
  DataTableRow,
  DataTableCell,
} from '@asko/ui';
import type { IInvitationLink } from '@/lib/api/types';
import { ROLE_LABELS, formatDate, isExpired } from './constants';
import { CopyButton } from './copy-button';

export function InvitationRow({
  invitation,
  link,
  onDelete,
  deleteLoading,
}: {
  invitation: IInvitationLink;
  link?: string;
  onDelete: (id: string) => void;
  deleteLoading: string | null;
}) {
  const expired = isExpired(invitation.expiresAt);
  const inactive = invitation.used || expired;
  const resolvedLink = link ?? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite=${invitation.token}`;

  return (
    <>
      <DataTableRow className={inactive ? 'opacity-50' : undefined}>
        <DataTableCell mobileLabel="Роль:" className="lg:w-[160px] lg:flex-shrink-0">
          <p className="text-sm font-medium text-text-main">
            {ROLE_LABELS[invitation.role] ?? invitation.role}
          </p>
        </DataTableCell>
        <DataTableCell mobileLabel="Токен:" className="lg:flex-1 lg:px-4">
          <p className="text-sm font-mono text-text-sub truncate max-w-[140px]">
            {invitation.token.slice(0, 14)}...
          </p>
        </DataTableCell>
        <DataTableCell mobileLabel="Истекает:" className="lg:w-[160px] lg:px-4">
          <p className={`text-sm ${expired ? 'text-brand-red' : 'text-text-main'}`}>
            {formatDate(invitation.expiresAt)}
          </p>
        </DataTableCell>
        <DataTableCell mobileLabel="Статус:" className="lg:w-[130px] lg:px-4">
          {invitation.used ? (
            <Badge variant="neutral">Использовано</Badge>
          ) : expired ? (
            <Badge variant="error">Истёк</Badge>
          ) : (
            <Badge variant="success">Активно</Badge>
          )}
        </DataTableCell>
        <DataTableCell className="lg:w-[180px] lg:flex-shrink-0 lg:text-right flex gap-2">
          {!inactive && <CopyButton text={resolvedLink} />}
          <Button
            variant="danger"
            size="sm"
            disabled={deleteLoading === invitation.id}
            onClick={() => onDelete(invitation.id)}
          >
            {deleteLoading === invitation.id ? '...' : 'Удалить'}
          </Button>
        </DataTableCell>
      </DataTableRow>

      {/* Newly created link row */}
      {link && (
        <DataTableRow className="bg-green-50">
          <DataTableCell className="lg:col-span-full w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full min-w-0">
              <p className="text-xs font-mono text-text-main break-all flex-1 min-w-0">{link}</p>
              <CopyButton text={link} />
            </div>
          </DataTableCell>
        </DataTableRow>
      )}
    </>
  );
}
