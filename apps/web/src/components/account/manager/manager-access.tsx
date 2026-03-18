'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  TabList,
  Tab,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonCard } from '@/components/account/skeleton';
import { managerApi } from '@/lib/api/manager';
import type { IRepairer } from '@asko/shared/client';

type AccessTab = 'inactive' | 'active';

interface RepairerWithUser extends IRepairer {
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

function repairerName(r: RepairerWithUser): string {
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
  repairer: RepairerWithUser;
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

const LIMIT = 20;

export function ManagerAccess() {
  const [activeTab, setActiveTab] = useState<AccessTab>('inactive');
  const [repairers, setRepairers] = useState<RepairerWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRepairers = useCallback(() => {
    setLoading(true);
    setError('');
    managerApi.getRepairers({ offset: page, limit: LIMIT, search: debouncedSearch || undefined })
      .then(({ data }) => {
        setRepairers(data?.data ?? []);
        setTotal(data?.total ?? 0);
      })
      .catch(() => setError('Не удалось загрузить данные'))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchRepairers();
  }, [fetchRepairers]);

  // Reset page on tab/search change
  useEffect(() => { setPage(1); }, [activeTab, debouncedSearch]);

  const displayed = repairers.filter((r) =>
    activeTab === 'inactive' ? !r.isActive : r.isActive,
  );

  const handleActivate = async (id: string) => {
    setActionLoading(id);
    try {
      await managerApi.updateRepairer(id, { isActive: true });
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
      await managerApi.updateRepairer(id, { isActive: false });
      setRepairers((prev) => prev.map((r) => r.id === id ? { ...r, isActive: false } : r));
    } catch {
      setError('Не удалось деактивировать мастера');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <PageContainer>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <PageHeader>Доступы мастеров</PageHeader>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по городу..."
          className="border border-border-light rounded-sm px-3 py-2 text-sm text-text-main outline-none focus:border-brand-red lg:w-56"
        />
      </div>

      <TabList>
        <Tab active={activeTab === 'inactive'} onClick={() => setActiveTab('inactive')}>
          Новые
        </Tab>
        <Tab active={activeTab === 'active'} onClick={() => setActiveTab('active')}>
          Активные
        </Tab>
      </TabList>

      {error && (
        <p className="text-sm text-brand-red">{error}</p>
      )}

      <DataTableHeader>
        <div className="w-[200px] flex-shrink-0">Имя</div>
        <div className="flex-1 px-4">Почта</div>
        <div className="flex-1 px-4">Город</div>
        <div className="w-[100px] px-4">Выполнено</div>
        <div className="w-[160px] px-4">Геопозиция</div>
        <div className="w-[130px] flex-shrink-0" />
      </DataTableHeader>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <DataTable>
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
        </DataTable>
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
