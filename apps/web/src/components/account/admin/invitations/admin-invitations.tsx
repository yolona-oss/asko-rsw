'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Button,
  Card,
  Select,
  FormField,
  DataTable,
  DataTableHeader,
  DataTableEmpty,
  DataTableFooter,
  DataSearch,
  DataFilter,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
} from '@asko/ui';
import type { FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonCard } from '@/components/account/skeleton';
import { invitationApi } from '@/lib/api/invitation';
import { Role } from '@asko/shared/client';
import type { IInvitationLink } from '@/lib/api/types';
import { ROLE_OPTIONS, TTL_OPTIONS, ROLE_LABELS, STATUS_FILTER, isExpired } from './constants';
import { InvitationRow } from './invitation-row';
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

  const totalPages = Math.ceil(filteredInvitations.length / PAGE_SIZE);
  const paginatedInvitations = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredInvitations.slice(start, start + PAGE_SIZE);
  }, [filteredInvitations, page]);

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
          <div className="ml-auto flex-shrink-0 flex items-center gap-2">
            <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-14" />
          ))}
        </div>
      ) : view === 'table' ? (
        <DataTable>
          <DataTableHeader>
            <div className="w-[160px] flex-shrink-0">Роль</div>
            <div className="flex-1 px-4">Токен</div>
            <div className="w-[160px] px-4">Истекает</div>
            <div className="w-[130px] px-4">Статус</div>
            <div className="w-[180px] flex-shrink-0" />
          </DataTableHeader>

          {paginatedInvitations.length === 0 ? (
            <DataTableEmpty>Нет приглашений</DataTableEmpty>
          ) : (
            paginatedInvitations.map((inv) => (
              <InvitationRow
                key={inv.id}
                invitation={inv}
                link={newLinks[inv.id]}
                onDelete={handleDelete}
                deleteLoading={deleteLoading}
              />
            ))
          )}

          <DataTableFooter>
            <div className="flex items-center justify-between w-full">
              <span>Показано {paginatedInvitations.length} из {filteredInvitations.length}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </DataTableFooter>
        </DataTable>
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
