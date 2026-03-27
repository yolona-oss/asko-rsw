'use client';

import {
  Button,
  Badge,
  Card,
} from '@asko/ui';
import type { IInvitationLink } from '@/lib/api/types';
import { ROLE_LABELS, formatDate, isExpired } from './constants';
import { CopyButton } from './copy-button';

export function InvitationCard({
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
    <Card padding="none" className={`p-5 flex flex-col gap-3 ${inactive ? 'opacity-50' : ''}`}>
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
        <p className="text-xs font-mono text-text-main break-all bg-green-50 p-2 rounded-sm">{link}</p>
      )}
      <div className="flex gap-2 pt-1">
        {!inactive && <CopyButton text={resolvedLink} />}
        <Button
          variant="danger"
          size="sm"
          disabled={deleteLoading === invitation.id}
          onClick={() => onDelete(invitation.id)}
        >
          {deleteLoading === invitation.id ? '...' : 'Удалить'}
        </Button>
      </div>
    </Card>
  );
}
