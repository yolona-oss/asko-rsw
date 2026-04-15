'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useEntityDetail } from '@/hooks/use-entity-detail';
import { EntityDetailModal } from '@/components/account/_shared/entity-detail-modal';
import { RepairerDetail, fetchRepairerOne } from './repairer-detail';
import {
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  DataToolbar,
  DataGrid,
  Pagination,
  SkeletonCard,
} from '@asko/ui';
import type { FilterValues, DataGridColumn, SortOrder } from '@asko/ui';
import { User } from 'lucide-react';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { repairerApi } from '@/lib/api/repairer';
import type { IRepairer } from '@/lib/api/types';
import type { AccessTab } from './constants';
import { TAB_FILTER, LIMIT, repairerName, formatDate } from './constants';
import { RepairerCard } from './repairer-card';

export function ManagerAccess() {
  const detail = useEntityDetail<IRepairer>();
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: 'inactive' });
  const [repairers, setRepairers] = useState<IRepairer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  const activeTab = (filterValues.status ?? 'inactive') as AccessTab;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRepairers = useCallback(() => {
    setLoading(true);
    setError('');
    repairerApi.getAll({ page: page, limit: LIMIT, search: debouncedSearch || undefined, sortBy: sortBy ?? undefined, sortOrder: sortOrder ?? undefined })
      .then(({ data }) => {
        setRepairers(data?.data ?? []);
        setTotal(data?.overallCount ?? 0);
      })
      .catch(() => setError('Не удалось загрузить данные'))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    fetchRepairers();
  }, [fetchRepairers]);

  // Reset page on tab/search change
  useEffect(() => { setPage(1); }, [activeTab, debouncedSearch]);

  const displayed = useMemo(() =>
    repairers.filter((r) =>
      activeTab === 'inactive' ? !r.isActive : r.isActive,
    ),
    [repairers, activeTab],
  );

  const handleActivate = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await repairerApi.update(id, { isActive: true });
      setRepairers((prev) => prev.map((r) => r.id === id ? { ...r, isActive: true } : r));
    } catch {
      setError('Не удалось активировать мастера');
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleDeactivate = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await repairerApi.update(id, { isActive: false });
      setRepairers((prev) => prev.map((r) => r.id === id ? { ...r, isActive: false } : r));
    } catch {
      setError('Не удалось деактивировать мастера');
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const totalPages = Math.ceil(total / LIMIT);

  const repairerColumns: DataGridColumn<IRepairer>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Имя',
      sortable: false,
      width: 200,
      mobileLabel: 'Имя:',
      render: (rep) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-border-light flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-text-sub" />
          </div>
          <p className="text-sm font-medium text-text-main">{repairerName(rep)}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Почта',
      sortable: false,
      mobileLabel: 'Почта:',
      render: (rep) => <p className="text-sm text-text-main">{rep.user?.email ?? '-'}</p>,
    },
    {
      key: 'city',
      header: 'Город',
      mobileLabel: 'Город:',
      render: (rep) => <p className="text-sm text-text-main">{rep.city}</p>,
    },
    {
      key: 'completed',
      header: 'Выполнено',
      sortField: 'completedRepairs',
      width: 100,
      mobileLabel: 'Выполнено:',
      render: (rep) => <p className="text-sm text-text-main">{rep.completedRepairs}</p>,
    },
    {
      key: 'location',
      header: 'Геопозиция',
      sortable: false,
      width: 160,
      mobileLabel: 'Геопозиция:',
      render: (rep) => <p className="text-sm text-text-main">{formatDate(rep.lastLocationUpdate)}</p>,
    },
  ], []);

  return (
    <PageContainer>
      <PageHeader>Доступы мастеров</PageHeader>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Поиск по городу..." }}
        filters={[TAB_FILTER]}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        viewSwitcher={<ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />}
      />

      {error && (
        <p className="text-sm text-brand-red">{error}</p>
      )}

      {view === 'table' ? (
        <DataGrid<IRepairer>
          loading={loading}
          columns={repairerColumns}
          data={displayed}
          keyExtractor={(rep) => rep.id}
          emptyContent={activeTab === 'inactive' ? 'Нет новых мастеров' : 'Нет активных мастеров'}
          sortKey={sortBy ?? undefined}
          sortOrder={sortOrder ?? undefined}
          onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
          onRowClick={detail.onRowClick}
          rowMenu={(rep) => [
            activeTab === 'inactive'
              ? { key: 'activate', label: 'Активировать', onClick: () => handleActivate(rep.id) }
              : { key: 'deactivate', label: 'Деактивировать', onClick: () => handleDeactivate(rep.id) },
          ]}
          footer={
            <div className="flex items-center justify-between w-full">
              <span>Показано {displayed.length} из {total}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          }
        />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="h-36" />)}
        </div>
      ) : (
        <>
          {displayed.length === 0 ? (
            <p className="text-sm text-text-sub text-center py-8">
              {activeTab === 'inactive' ? 'Нет новых мастеров' : 'Нет активных мастеров'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayed.map((rep) => (
                <RepairerCard
                  key={rep.id}
                  repairer={rep}
                  menuItems={[
                    activeTab === 'inactive'
                      ? { key: 'activate', label: 'Активировать', onClick: () => handleActivate(rep.id) }
                      : { key: 'deactivate', label: 'Деактивировать', onClick: () => handleDeactivate(rep.id) },
                  ]}
                  onClick={() => detail.onRowClick(rep)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />

      <EntityDetailModal
        open={detail.open}
        onClose={detail.onClose}
        item={detail.selectedItem}
        title="Детали мастера"
        fetchOne={fetchRepairerOne}
        renderContent={(item, loading) => <RepairerDetail item={item} loading={loading} />}
      />
    </PageContainer>
  );
}
