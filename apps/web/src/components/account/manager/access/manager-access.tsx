'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  DataSearch,
  DataFilter,
  DataTable,
  DataTableHeader,
  DataTableEmpty,
  DataTableFooter,
} from '@asko/ui';
import type { FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonCard } from '@/components/account/skeleton';
import { repairerApi } from '@/lib/api/repairer';
import type { IRepairer } from '@/lib/api/types';
import type { AccessTab } from './constants';
import { TAB_FILTER, LIMIT } from './constants';
import { RepairerRow } from './repairer-row';
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

  const activeTab = (filterValues.status ?? 'inactive') as AccessTab;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRepairers = useCallback(() => {
    setLoading(true);
    setError('');
    repairerApi.getAll({ offset: page, limit: LIMIT, search: debouncedSearch || undefined })
      .then(({ data }) => {
        setRepairers(data?.data ?? []);
        setTotal(data?.overallCount ?? 0);
      })
      .catch(() => setError('Не удалось загрузить данные'))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

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

  const handleActivate = async (id: string) => {
    setActionLoading(id);
    try {
      await repairerApi.update(id, { isActive: true });
      setRepairers((prev) => prev.map((r) => r.id === id ? { ...r, isActive: true } : r));
    } catch {
      setError('Не удалось активировать мастера');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (id: string) => {
    setActionLoading(id);
    try {
      await repairerApi.update(id, { isActive: false });
      setRepairers((prev) => prev.map((r) => r.id === id ? { ...r, isActive: false } : r));
    } catch {
      setError('Не удалось деактивировать мастера');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const totalPages = Math.ceil(total / LIMIT);

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
        <DataTable>
          <DataTableHeader>
            <div className="w-[200px] flex-shrink-0">Имя</div>
            <div className="flex-1 px-4">Почта</div>
            <div className="flex-1 px-4">Город</div>
            <div className="w-[100px] px-4">Выполнено</div>
            <div className="w-[160px] px-4">Геопозиция</div>
            <div className="w-[130px] flex-shrink-0" />
          </DataTableHeader>

          {displayed.length === 0 ? (
            <DataTableEmpty>
              {activeTab === 'inactive' ? 'Нет новых мастеров' : 'Нет активных мастеров'}
            </DataTableEmpty>
          ) : (
            displayed.map((rep) => (
              <RepairerRow
                key={rep.id}
                repairer={rep}
                onActivate={activeTab === 'inactive' ? handleActivate : undefined}
                onDeactivate={activeTab === 'active' ? handleDeactivate : undefined}
                actionLoading={actionLoading}
              />
            ))
          )}

          <DataTableFooter>
            Показано {displayed.length} из {total}
          </DataTableFooter>
        </DataTable>
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
                  onActivate={activeTab === 'inactive' ? handleActivate : undefined}
                  onDeactivate={activeTab === 'active' ? handleDeactivate : undefined}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="text-sm text-text-sub">{page} / {totalPages}</span>
          <Button
            variant="secondary"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Вперёд
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
