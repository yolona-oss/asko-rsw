'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Button,
  Badge,
  Card,
  Select,
  FormField,
  DataGrid,
  DataSearch,
  DataFilter,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
} from '@asko/ui';
import type { DataGridColumn, DropdownMenuEntry, FilterValues, SortOrder } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonCard } from '@/components/skeleton';
import { invitationApi } from '@/lib/api/invitation';
import { Role } from '@asko/shared/client';
import type { IInvitationLink } from '@/lib/api/types';
import { ROLE_OPTIONS, TTL_OPTIONS, ROLE_LABELS, STATUS_FILTER, formatDate, isExpired } from './constants';
import { CopyButton } from './copy-button';
import { InvitationCard } from './invitation-card';

const PAGE_SIZE = 20;

export function AdminInvitations() {
  const [invitations, setInvitations] = useState<IInvitationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: 'all' });
  const [page, setPage] = useState(1);

  const [role, setRole] = useState('');
  const [ttl, setTtl] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Map invitationId -> full link for newly created invitations
  const [newLinks, setNewLinks] = useState<Record<string, string>>({});

  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  useEffect(() => {
    invitationApi.getAll()
      .then(({ data }) => setInvitations(Array.isArray(data) ? data : []))
      .catch(() => setError('Не удалось загрузить приглашения'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!role) return;
    setCreating(true);
    setCreateError('');
    try {
      const { data } = await invitationApi.create({
        role: role as Role,
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
      await invitationApi.delete(id);
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
      setNewLinks((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } catch {
      setError('Не удалось удалить приглашение');
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredInvitations = useMemo(() => {
    let result = invitations;

    // Status filter
    const status = filterValues.status;
    if (status === 'active') {
      result = result.filter((inv) => !inv.used && !isExpired(inv.expiresAt));
    } else if (status === 'used') {
      result = result.filter((inv) => inv.used);
    } else if (status === 'expired') {
      result = result.filter((inv) => !inv.used && isExpired(inv.expiresAt));
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((inv) => {
        const roleName = (ROLE_LABELS[inv.role] ?? inv.role).toLowerCase();
        const token = inv.token.toLowerCase();
        return roleName.includes(q) || token.includes(q);
      });
    }

    return result;
  }, [invitations, filterValues.status, search]);

  // Reset page on search/filter changes
  useEffect(() => { setPage(1); }, [search, filterValues.status]);

  const sortedInvitations = useMemo(() => {
    if (!sortBy) return filteredInvitations;
    return [...filteredInvitations].sort((a, b) => {
      const av = (a as any)[sortBy] ?? '';
      const bv = (b as any)[sortBy] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [filteredInvitations, sortBy, sortOrder]);

  const totalPages = Math.ceil(sortedInvitations.length / PAGE_SIZE);

  const columns: DataGridColumn<IInvitationLink>[] = useMemo(() => [
    {
      key: 'role',
      header: 'Роль',
      width: 160,
      mobileLabel: 'Роль:',
      render: (inv) => (
        <p className="text-sm font-medium text-text-main">
          {ROLE_LABELS[inv.role] ?? inv.role}
        </p>
      ),
    },
    {
      key: 'token',
      header: 'Токен',
      mobileLabel: 'Токен:',
      render: (inv) => {
        const link = newLinks[inv.id];
        return (
          <div>
            <p className="text-sm font-mono text-text-sub truncate max-w-[140px]">
              {inv.token.slice(0, 14)}...
            </p>
            {link && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-1 p-1.5 bg-green-50 rounded">
                <p className="text-xs font-mono text-text-main break-all flex-1 min-w-0">{link}</p>
                <CopyButton text={link} />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'expiresAt',
      header: 'Истекает',
      width: 160,
      mobileLabel: 'Истекает:',
      render: (inv) => {
        const expired = isExpired(inv.expiresAt);
        return <p className={`text-sm ${expired ? 'text-brand-red' : 'text-text-main'}`}>{formatDate(inv.expiresAt)}</p>;
      },
    },
    {
      key: 'status',
      header: 'Статус',
      width: 130,
      mobileLabel: 'Статус:',
      render: (inv) => {
        const expired = isExpired(inv.expiresAt);
        return inv.used ? (
          <Badge variant="neutral">Использовано</Badge>
        ) : expired ? (
          <Badge variant="error">Истёк</Badge>
        ) : (
          <Badge variant="success">Активно</Badge>
        );
      },
    },
  ], [newLinks]);

  const rowMenu = (inv: IInvitationLink): DropdownMenuEntry[] => {
    const expired = isExpired(inv.expiresAt);
    const inactive = inv.used || expired;
    const resolvedLink = newLinks[inv.id] ?? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite=${inv.token}`;
    const items: DropdownMenuEntry[] = [];
    if (!inactive) {
      items.push({
        key: 'copy',
        label: 'Копировать ссылку',
        onClick: () => navigator.clipboard.writeText(resolvedLink),
      });
    }
    items.push({
      key: 'delete',
      label: 'Удалить',
      variant: 'danger',
      disabled: deleteLoading === inv.id,
      onClick: () => handleDelete(inv.id),
    });
    return items;
  };

  const paginatedInvitations = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedInvitations.slice(start, start + PAGE_SIZE);
  }, [sortedInvitations, page]);

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

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <DataSearch value={search} onChange={setSearch} placeholder="Поиск" className="lg:w-[320px] flex-shrink-0" />
        <div className="flex-1 flex items-center gap-3">
          <DataFilter
            filters={[STATUS_FILTER]}
            values={filterValues}
            onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
          />
        </div>
      </div>

      {/* ViewSwitcher — above data view */}
      <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-14" />
          ))}
        </div>
      ) : view === 'table' ? (
        <DataGrid
          columns={columns}
          data={paginatedInvitations}
          keyExtractor={(inv) => inv.id}
          emptyContent="Нет приглашений"
          sortKey={sortBy ?? undefined}
          sortOrder={sortOrder ?? undefined}
          onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
          rowClassName={(inv) => (inv.used || isExpired(inv.expiresAt)) ? 'opacity-50' : undefined}
          rowMenu={rowMenu}
          footer={
            <div className="flex items-center justify-between w-full">
              <span>Показано {paginatedInvitations.length} из {sortedInvitations.length}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          }
        />
      ) : (
        <>
          {paginatedInvitations.length === 0 ? (
            <p className="text-sm text-text-sub text-center py-8">Нет приглашений</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedInvitations.map((inv) => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                  link={newLinks[inv.id]}
                  onDelete={handleDelete}
                  deleteLoading={deleteLoading}
                />
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
        </>
      )}
    </PageContainer>
  );
}
