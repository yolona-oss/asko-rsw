'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useEntityDetail } from '@/hooks/use-entity-detail';
import { EntityDetailModal } from '@/components/account/_shared/entity-detail-modal';
import { UserDetail } from './user-detail';
import {
  DataToolbar,
  DataGrid,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
  StatusBadge,
  SkeletonCard,
  filterValueToParam,
} from '@asko/ui';
import type { DataGridColumn, DropdownMenuEntry, FilterDefinition, FilterValues, SortOrder } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { usersApi } from '@/lib/api/users';
import type { AuthUser } from '@/lib/api/types';
import { ROLE_LABELS, ROLE_TAB_FILTER_DEF } from './constants';
import { InviteDropdown } from './invite-dropdown';
import { UserAvatar } from './user-avatar';
import { UserCard } from './user-card';

const PAGE_SIZE = 20;

export function AdminUsers() {
  const detail = useEntityDetail<AuthUser>();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: '', role: 'repairer' });
  const [view, setView] = useState('table');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await usersApi.getAll({
        page: page,
        limit: PAGE_SIZE,
        search: search || undefined,
        role: filterValueToParam(filterValues, 'role'),
        status: filterValueToParam(filterValues, 'status'),
        sortBy: sortBy ?? undefined,
        sortOrder: sortOrder ?? undefined,
      });
      setUsers(data.data ?? []);
      setTotal(data.overallCount ?? 0);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterValues.role, filterValues.status, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (id: string, active: boolean) => {
    setActionLoading(id);
    try {
      if (active) {
        await usersApi.enable(id);
      } else {
        await usersApi.disable(id);
      }
      setUsers((prev) =>
        prev.map((u) => u.id === id ? { ...u, isActive: active } : u),
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
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const STATUS_FILTER_DEF: FilterDefinition = {
    key: 'status',
    label: 'Статус',
    type: 'select',
    options: [
      { value: '', label: 'Все' },
      { value: 'active', label: 'Активен' },
      { value: 'disabled', label: 'Заблокирован' },
    ],
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const columns: DataGridColumn<AuthUser>[] = useMemo(() => [
    {
      key: 'user',
      header: 'Пользователь',
      sortField: 'lastName',
      render: (user) => {
        const name = [user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ') || 'Без имени';
        return (
          <div className="flex items-center gap-3">
            <UserAvatar />
            <p className="text-sm font-medium text-text-main tracking-[-0.14px]">{name}</p>
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'Телефон',
      width: 160,
      mobileLabel: 'Телефон:',
      render: (user) => <p className="text-sm text-text-main tracking-[-0.14px]">{user.phone ?? '-'}</p>,
    },
    {
      key: 'role',
      header: 'Роль',
      sortable: false,
      width: 90,
      mobileLabel: 'Роль:',
      render: (user) => (
        <p className="text-sm text-text-main tracking-[-0.14px]">
          {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
        </p>
      ),
    },
    {
      key: 'district',
      header: 'Район',
      sortable: false,
      width: 150,
      mobileLabel: 'Район:',
      render: () => <p className="text-sm text-text-main tracking-[-0.14px]">-</p>,
    },
    {
      key: 'status',
      header: 'Статус',
      sortField: 'isActive',
      width: 100,
      mobileLabel: 'Статус:',
      render: (user) => {
        const isActive = user.isActive !== false;
        return <StatusBadge active={isActive} />;
      },
    },
  ], [actionLoading]);

  const rowMenu = (user: AuthUser): DropdownMenuEntry[] => {
    const isActive = user.isActive !== false;
    return [
      {
        key: 'toggle-active',
        label: isActive ? 'Заблокировать' : 'Разблокировать',
        onClick: () => handleToggleActive(user.id, !isActive),
      },
      {
        key: 'delete',
        label: 'Удалить',
        variant: 'danger',
        onClick: () => handleDelete(user.id),
      },
    ];
  };

  return (
    <PageContainer>
      <PageHeader>Выдача доступов</PageHeader>

      {/* Search + Filters + ViewSwitcher + Invite button */}
      <DataToolbar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: "Поиск" }}
        filters={[STATUS_FILTER_DEF, ROLE_TAB_FILTER_DEF]}
        filterValues={filterValues}
        onFilterChange={(key: string, value: string | string[]) => { setFilterValues((prev) => ({ ...prev, [key]: value })); setPage(1); }}
        inlineActions={<InviteDropdown />}
        viewSwitcher={<ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />}
      />

      {/* Content */}
      {view === 'table' ? (
        <DataGrid
          loading={loading}
          columns={columns}
          data={users}
          keyExtractor={(user) => user.id}
          emptyContent="Нет пользователей"
          sortKey={sortBy ?? undefined}
          sortOrder={sortOrder ?? undefined}
          onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
          onRowClick={detail.onRowClick}
          rowClassName={(user) => user.isActive === false ? 'opacity-50' : undefined}
          rowMenu={rowMenu}
          footer={users.length > 0 ? (
            <div className="flex items-center justify-between w-full">
              <span>Показано {users.length} из {total}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          ) : undefined}
        />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="h-36" />)}
        </div>
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
      <EntityDetailModal
        open={detail.open}
        onClose={detail.onClose}
        item={detail.selectedItem}
        title="Детали пользователя"
        renderContent={(item, loading) => <UserDetail item={item} loading={loading} />}
      />
    </PageContainer>
  );
}
