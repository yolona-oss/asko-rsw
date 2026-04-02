'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  DataFilter,
  DataToolbar,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  DataTableFooter,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
} from '@asko/ui';
import type { FilterDefinition, FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonCard } from '@/components/skeleton';
import { usersApi } from '@/lib/api/users';
import type { IAuthUser } from '@/lib/api/types';
import { ROLE_LABELS, ROLE_TAB_FILTER_DEF } from './constants';
import { Checkbox } from './checkbox';
import { SettingsDropdown } from './settings-dropdown';
import { InviteDropdown } from './invite-dropdown';
import { UserAvatar } from './user-avatar';
import { StatusBadge } from './status-badge';
import { UserCard } from './user-card';

const PAGE_SIZE = 20;

export function AdminUsers() {
  const [users, setUsers] = useState<IAuthUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: 'all', role: 'repairer' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [view, setView] = useState('table');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await usersApi.getAll({
        offset: page,
        limit: PAGE_SIZE,
        search: search || undefined,
        role: filterValues.role || undefined,
        status: filterValues.status !== 'all' ? (filterValues.status as string) : undefined,
      });
      setUsers(data.data ?? []);
      setTotal(data.overallCount ?? 0);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterValues.role, filterValues.status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset selection when role changes
  useEffect(() => {
    setSelected(new Set());
  }, [filterValues.role]);

  const handleToggleActive = async (id: string, active: boolean) => {
    setActionLoading(id);
    try {
      if (active) {
        await usersApi.enable(id);
      } else {
        await usersApi.disable(id);
      }
      setUsers((prev) =>
        prev.map((u) => u.id === id ? { ...u, isActive: active } as any : u),
      );
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await usersApi.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const STATUS_FILTER_DEF: FilterDefinition = {
    key: 'status',
    label: 'Статус',
    type: 'select',
    options: [
      { value: 'all', label: 'Все' },
      { value: 'active', label: 'Активен' },
      { value: 'disabled', label: 'Заблокирован' },
    ],
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <PageContainer>
      <PageHeader>Выдача доступов</PageHeader>

      {/* Role tabs */}
      <DataFilter
        filters={[ROLE_TAB_FILTER_DEF]}
        values={filterValues}
        onChange={(key, value) => { setFilterValues((prev) => ({ ...prev, [key]: value })); setPage(1); }}
      />

      {/* Search + Filters + ViewSwitcher + Invite button */}
      <DataToolbar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: "Поиск" }}
        filters={[STATUS_FILTER_DEF]}
        filterValues={filterValues}
        onFilterChange={(key, value) => { setFilterValues((prev) => ({ ...prev, [key]: value })); setPage(1); }}
        views={[VIEW_TABLE, VIEW_CARD]}
        activeView={view}
        onViewChange={setView}
        actions={<InviteDropdown />}
      />

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} className="h-14" />
          ))}
        </div>
      ) : view === 'table' ? (
        <DataTable>
          {/* Header */}
          <DataTableHeader className="lg:grid lg:grid-cols-[32px_1fr_160px_90px_150px_100px_90px]">
            <span />
            <span>Пользователь</span>
            <span>Телефон</span>
            <span>Роль</span>
            <span>Район</span>
            <span>Статус</span>
            <span>Действия</span>
          </DataTableHeader>

          {/* Rows */}
          {users.length === 0 ? (
            <DataTableEmpty>Нет пользователей</DataTableEmpty>
          ) : (
            users.map((user) => {
              const name = [user.lastName, user.firstName, (user as any).middleName].filter(Boolean).join(' ') || 'Без имени';
              const isActive = (user as any).isActive !== false;
              const isLoading = actionLoading === user.id;
              const isSelected = selected.has(user.id);

              return (
                <DataTableRow
                  key={user.id}
                  className={`lg:grid lg:grid-cols-[32px_1fr_160px_90px_150px_100px_90px] ${
                    !isActive ? 'opacity-50' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <DataTableCell className="hidden lg:flex items-center">
                    <Checkbox checked={isSelected} onChange={() => toggleSelect(user.id)} />
                  </DataTableCell>

                  {/* User */}
                  <DataTableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar />
                      <p className="text-sm font-medium text-[#323232] tracking-[-0.14px]">{name}</p>
                    </div>
                  </DataTableCell>

                  {/* Phone */}
                  <DataTableCell mobileLabel="Телефон:">
                    <p className="text-sm text-[#323232] tracking-[-0.14px]">{user.phone ?? '-'}</p>
                  </DataTableCell>

                  {/* Role */}
                  <DataTableCell mobileLabel="Роль:">
                    <p className="text-sm text-[#323232] tracking-[-0.14px]">
                      {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
                    </p>
                  </DataTableCell>

                  {/* Район */}
                  <DataTableCell mobileLabel="Район:">
                    <p className="text-sm text-[#323232] tracking-[-0.14px]">-</p>
                  </DataTableCell>

                  {/* Status */}
                  <DataTableCell mobileLabel="Статус:">
                    <StatusBadge isActive={isActive} />
                  </DataTableCell>

                  {/* Actions */}
                  <DataTableCell>
                    <SettingsDropdown
                      user={user}
                      onToggleActive={handleToggleActive}
                      onDelete={handleDelete}
                      loading={isLoading}
                    />
                  </DataTableCell>
                </DataTableRow>
              );
            })
          )}

          {/* Footer */}
          {users.length > 0 && (
            <DataTableFooter>
              <div className="flex items-center justify-between w-full">
                <span>Показано {users.length} из {total}</span>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </DataTableFooter>
          )}
        </DataTable>
      ) : (
        /* Card view */
        users.length === 0 ? (
          <p className="text-sm text-text-sub text-center py-8">Нет пользователей</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                  loading={actionLoading === user.id}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
          </>
        )
      )}
    </PageContainer>
  );
}
