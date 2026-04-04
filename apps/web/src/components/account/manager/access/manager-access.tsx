'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  DataSearch,
  DataFilter,
  DataGrid,
  Pagination,
} from '@asko/ui';
import type { FilterValues, DataGridColumn, SortOrder } from '@asko/ui';
import { User } from 'lucide-react';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonCard } from '@/components/skeleton';
import { repairerApi } from '@/lib/api/repairer';
import type { IRepairer } from '@/lib/api/types';
import type { AccessTab } from './constants';
import { TAB_FILTER, LIMIT, repairerName, formatDate } from './constants';
import { RepairerCard } from './repairer-card';

export function ManagerAccess() {
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

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const totalPages = Math.ceil(total / LIMIT);

  const repairerColumns: DataGridColumn<IRepairer>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Имя',
      width: 200,
      mobileLabel: 'Имя:',
      render: (rep) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8E8E8] flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-text-sub" />
          </div>
          <p className="text-sm font-medium text-text-main">{repairerName(rep)}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Почта',
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
      width: 100,
      mobileLabel: 'Выполнено:',
      render: (rep) => <p className="text-sm text-text-main">{rep.completedRepairs}</p>,
    },
    {
      key: 'location',
      header: 'Геопозиция',
      width: 160,
      mobileLabel: 'Геопозиция:',
      render: (rep) => <p className="text-sm text-text-main">{formatDate(rep.lastLocationUpdate)}</p>,
    },
  ], []);

  return (
    <PageContainer>
      <PageHeader>Доступы мастеров</PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <DataSearch value={search} onChange={setSearch} placeholder="Поиск по городу..." className="lg:w-[320px] flex-shrink-0" />
        <div className="flex-1 flex items-center gap-3">
          <DataFilter filters={[TAB_FILTER]} values={filterValues} onChange={handleFilterChange} />
          <div className="ml-auto flex-shrink-0 flex items-center gap-2">
            <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-brand-red">{error}</p>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} className="h-16" />
          ))}
        </div>
      ) : view === 'table' ? (
        <DataGrid<IRepairer>
          columns={repairerColumns}
          data={displayed}
          keyExtractor={(rep) => rep.id}
          emptyContent={activeTab === 'inactive' ? 'Нет новых мастеров' : 'Нет активных мастеров'}
          sortKey={sortBy ?? undefined}
          sortOrder={sortOrder ?? undefined}
          onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
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
                />
              ))}
            </div>
          )}
        </>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
    </PageContainer>
  );
}
