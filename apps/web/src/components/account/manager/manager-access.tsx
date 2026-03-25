'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  Badge,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  DataTableFooter,
  DataSearch,
  DataFilter,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
} from '@asko/ui';
import type { FilterDefinition, FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonCard } from '@/components/account/skeleton';
import { repairerApi } from '@/lib/api/repairer';
import type { IRepairer } from '@/lib/api/types';

type AccessTab = 'inactive' | 'active';

const TAB_FILTER: FilterDefinition = {
  key: 'status',
  label: '',
  type: 'tabs',
  options: [
    { value: 'inactive', label: 'Новые' },
    { value: 'active', label: 'Активные' },
  ],
};

function repairerName(r: IRepairer): string {
  const full = [r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ');
  return full || r.user?.email?.split('@')[0] || r.userId;
}

function formatDate(date: string | Date | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function RepairerRow({
  repairer,
  onActivate,
  onDeactivate,
  actionLoading,
}: {
  repairer: IRepairer;
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  actionLoading: string | null;
}) {
  const isLoading = actionLoading === repairer.id;

  return (
    <DataTableRow>
      {/* Avatar + Name */}
      <DataTableCell className="flex items-center gap-3 lg:w-[200px] lg:flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#E8E8E8] flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-text-sub" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-text-sub lg:hidden">Имя:</p>
          <p className="text-sm font-medium text-text-main">{repairerName(repairer)}</p>
        </div>
      </DataTableCell>

      {/* Email */}
      <DataTableCell mobileLabel="Почта:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{repairer.user?.email ?? '-'}</p>
      </DataTableCell>

      {/* City */}
      <DataTableCell mobileLabel="Город:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{repairer.city}</p>
      </DataTableCell>

      {/* Completed repairs */}
      <DataTableCell mobileLabel="Выполнено:" className="lg:w-[100px] lg:px-4">
        <p className="text-sm text-text-main">{repairer.completedRepairs}</p>
      </DataTableCell>

      {/* Last location update */}
      <DataTableCell mobileLabel="Геопозиция:" className="lg:w-[160px] lg:px-4">
        <p className="text-sm text-text-main">{formatDate(repairer.lastLocationUpdate)}</p>
      </DataTableCell>

      {/* Action */}
      <DataTableCell className="lg:w-[130px] lg:flex-shrink-0 lg:text-right">
        {onActivate && (
          <Button
            variant="primary"
            size="sm"
            disabled={isLoading}
            onClick={() => onActivate(repairer.id)}
          >
            {isLoading ? '...' : 'Активировать'}
          </Button>
        )}
        {onDeactivate && (
          <Button
            variant="danger"
            size="sm"
            disabled={isLoading}
            onClick={() => onDeactivate(repairer.id)}
          >
            {isLoading ? '...' : 'Деактивировать'}
          </Button>
        )}
      </DataTableCell>
    </DataTableRow>
  );
}

function RepairerCard({
  repairer,
  onActivate,
  onDeactivate,
  actionLoading,
}: {
  repairer: IRepairer;
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  actionLoading: string | null;
}) {
  const isLoading = actionLoading === repairer.id;

  return (
    <Card padding="none" className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8E8E8] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-text-sub" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-text-main">{repairerName(repairer)}</p>
            <p className="text-xs text-text-sub">{repairer.user?.email ?? '-'}</p>
          </div>
        </div>
        <Badge variant={repairer.isActive ? 'success' : 'warning'}>
          {repairer.isActive ? 'Активен' : 'Новый'}
        </Badge>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-text-sub">Город</span>
          <span className="text-text-main">{repairer.city}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-sub">Выполнено</span>
          <span className="text-text-main">{repairer.completedRepairs}</span>
        </div>
      </div>

      <div className="pt-1">
        {onActivate && (
          <Button
            variant="primary"
            size="sm"
            disabled={isLoading}
            onClick={() => onActivate(repairer.id)}
          >
            {isLoading ? '...' : 'Активировать'}
          </Button>
        )}
        {onDeactivate && (
          <Button
            variant="danger"
            size="sm"
            disabled={isLoading}
            onClick={() => onDeactivate(repairer.id)}
          >
            {isLoading ? '...' : 'Деактивировать'}
          </Button>
        )}
      </div>
    </Card>
  );
}

const LIMIT = 20;

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
