'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Button,
  Card,
  Select,
  FormField,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  Badge,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonCard } from '@/components/account/skeleton';
import { adminApi } from '@/lib/api/admin';
import type { IInvitationLink } from '@asko/shared/client';

// Admin role is intentionally excluded — admin accounts require direct provisioning
const ROLE_OPTIONS = [
  { value: 'user', label: 'Пользователь' },
  { value: 'dealer', label: 'Дилер' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'repairer', label: 'Мастер' },
];

const TTL_OPTIONS: { value: number; label: string }[] = [
  { value: 3600, label: '1 час' },
  { value: 86400, label: '24 часа' },
  { value: 604800, label: '7 дней' },
  { value: 2592000, label: '30 дней' },
];

const ROLE_LABELS: Record<string, string> = {
  user: 'Пользователь',
  dealer: 'Дилер',
  manager: 'Менеджер',
  repairer: 'Мастер',
  admin: 'Администратор',
  super_admin: 'Супер-администратор',
};

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isExpired(expiresAt: string | Date): boolean {
  return new Date(expiresAt) < new Date();
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleCopy}>
      {copied ? 'Скопировано!' : 'Копировать'}
    </Button>
  );
}

function InvitationRow({
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
        {/* Role */}
        <DataTableCell mobileLabel="Роль:" className="lg:w-[160px] lg:flex-shrink-0">
          <p className="text-sm font-medium text-text-main">
            {ROLE_LABELS[invitation.role] ?? invitation.role}
          </p>
        </DataTableCell>

        {/* Token preview */}
        <DataTableCell mobileLabel="Токен:" className="lg:flex-1 lg:px-4">
          <p className="text-sm font-mono text-text-sub truncate max-w-[140px]">
            {invitation.token.slice(0, 14)}…
          </p>
        </DataTableCell>

        {/* Expires */}
        <DataTableCell mobileLabel="Истекает:" className="lg:w-[160px] lg:px-4">
          <p className={`text-sm ${expired ? 'text-brand-red' : 'text-text-main'}`}>
            {formatDate(invitation.expiresAt)}
          </p>
        </DataTableCell>

        {/* Status */}
        <DataTableCell mobileLabel="Статус:" className="lg:w-[110px] lg:px-4">
          {invitation.used ? (
            <Badge variant="neutral">Использовано</Badge>
          ) : expired ? (
            <Badge variant="error">Истёк</Badge>
          ) : (
            <Badge variant="success">Активно</Badge>
          )}
        </DataTableCell>

        {/* Actions */}
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

export function AdminInvitations() {
  const [invitations, setInvitations] = useState<IInvitationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [role, setRole] = useState('');
  const [ttl, setTtl] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Map invitationId → full link for newly created invitations
  const [newLinks, setNewLinks] = useState<Record<string, string>>({});

  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getInvitations()
      .then(({ data }) => setInvitations(Array.isArray(data) ? data : []))
      .catch(() => setError('Не удалось загрузить приглашения'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!role) return;
    setCreating(true);
    setCreateError('');
    try {
      const { data } = await adminApi.createInvitation({
        role,
        ttl: ttl !== '' ? ttl : undefined,
      });
      const { invite, link } = data as { invite: IInvitationLink; link: string };
      setInvitations((prev) => [invite, ...prev]);
      setNewLinks((prev) => ({ ...prev, [invite.id]: link }));
      setRole('');
      setTtl('');
    } catch {
      setCreateError('Не удалось создать приглашение');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      await adminApi.deleteInvitation(id);
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
      setNewLinks((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } catch {
      setError('Не удалось удалить приглашение');
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader>Приглашения</PageHeader>
      {/* Create form */}
      <Card className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <FormField label="Роль">
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="min-w-[180px]"
          >
            <option value="" disabled>Выбрать роль</option>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Срок действия">
          <Select
            value={ttl}
            onChange={(e) => setTtl(e.target.value === '' ? '' : Number(e.target.value))}
            className="min-w-[140px]"
          >
            <option value="">7 дней (по умолч.)</option>
            {TTL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </FormField>
        <div className="flex flex-col gap-1">
          <Button onClick={handleCreate} disabled={!role || creating}>
            {creating ? 'Создание...' : 'Создать приглашение'}
          </Button>
          {createError && <p className="text-xs text-brand-red">{createError}</p>}
        </div>
      </Card>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <DataTableHeader>
        <div className="w-[160px] flex-shrink-0">Роль</div>
        <div className="flex-1 px-4">Токен</div>
        <div className="w-[160px] px-4">Истекает</div>
        <div className="w-[110px] px-4">Статус</div>
        <div className="w-[180px] flex-shrink-0" />
      </DataTableHeader>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <DataTable>
          {invitations.length === 0 ? (
            <DataTableEmpty>Нет приглашений</DataTableEmpty>
          ) : (
            invitations.map((inv) => (
              <InvitationRow
                key={inv.id}
                invitation={inv}
                link={newLinks[inv.id]}
                onDelete={handleDelete}
                deleteLoading={deleteLoading}
              />
            ))
          )}
        </DataTable>
      )}
    </PageContainer>
  );
}
