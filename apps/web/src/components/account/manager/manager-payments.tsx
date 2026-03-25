'use client';

import { useState, useEffect } from 'react';
import {
  Badge,
  Card,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  DataSearch,
  DataFilter,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  DataTableFooter,
} from '@asko/ui';
import type { BadgeVariant, FilterDefinition, FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { paymentApi, type PaymentRecord, type PaymentStats } from '@/lib/api/payment';

const STATUS_LABELS: Record<string, string> = {
  paid: 'Подтверждён',
  pending: 'Ожидание',
  refunded: 'Возвращён',
  failed: 'Ошибка',
};

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  paid: 'success',
  pending: 'warning',
  refunded: 'error',
  failed: 'neutral',
};

const PROVIDER_LABELS: Record<string, string> = {
  dummy: 'Тестовая',
  yookassa: 'ЮKassa',
  tbank: 'Т-Банк',
  card: 'Карта',
};

const FILTERS: FilterDefinition[] = [
  {
    key: 'status',
    label: 'Статус',
    type: 'select',
    options: [
      { value: '', label: 'Все' },
      { value: 'paid', label: 'Подтверждён' },
      { value: 'pending', label: 'Ожидание' },
      { value: 'refunded', label: 'Возвращён' },
      { value: 'failed', label: 'Ошибка' },
    ],
  },
  {
    key: 'provider',
    label: 'Способ',
    type: 'select',
    options: [
      { value: '', label: 'Все' },
      { value: 'dummy', label: 'Тестовая' },
      { value: 'yookassa', label: 'ЮKassa' },
      { value: 'tbank', label: 'Т-Банк' },
      { value: 'card', label: 'Карта' },
    ],
  },
];

function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatAmount(amount: number) {
  return amount.toLocaleString('ru-RU');
}

function payerName(user?: PaymentRecord['user']) {
  if (!user) return '—';
  return [user.lastName, user.firstName].filter(Boolean).join(' ') || user.email || '—';
}

export function ManagerPayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: '', provider: '' });
  const [page, setPage] = useState(0);
  const [view, setView] = useState('table');
  const pageSize = 20;

  useEffect(() => {
    async function fetchData() {
      try {
        const [paymentsRes, statsRes] = await Promise.all([
          paymentApi.listPayments({
            offset: page * pageSize,
            limit: pageSize,
            status: filterValues.status || undefined,
            provider: filterValues.provider || undefined,
            search: search || undefined,
          }),
          paymentApi.getStats(),
        ]);
        const result = paymentsRes.data;
        setPayments(result.data ?? []);
        setTotal(result.overallCount ?? 0);
        setStats(statsRes.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    fetchData();
  }, [page, filterValues, search]);

  const totalPages = Math.ceil(total / pageSize);
  const showFrom = total > 0 ? page * pageSize + 1 : 0;
  const showTo = Math.min((page + 1) * pageSize, total);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  return (
    <PageContainer>
      <PageHeader>Платежи</PageHeader>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-border-light p-5 lg:p-8 flex flex-col gap-1">
          <p className="text-2xl lg:text-[52px] font-bold text-text-main leading-tight tracking-tight">
            {stats ? `${formatAmount(stats.confirmedTotal)} ₽` : '—'}
          </p>
          <p className="text-base lg:text-2xl text-text-main">Подтверждено</p>
        </div>
        <div className="bg-white border border-border-light p-5 lg:p-8 flex flex-col gap-1">
          <p className="text-2xl lg:text-[52px] font-bold text-text-main leading-tight tracking-tight">
            {stats ? `${formatAmount(stats.refundedTotal)} ₽` : '—'}
          </p>
          <p className="text-base lg:text-2xl text-text-main">Возвращено</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <DataSearch
          value={search}
          onChange={handleSearch}
          placeholder="Поиск по ID или плательщику"
          className="lg:w-[320px] flex-shrink-0"
        />
        <div className="flex-1 flex items-center gap-3">
          <DataFilter
            filters={FILTERS}
            values={filterValues}
            onChange={handleFilterChange}
          />
          <div className="ml-auto flex-shrink-0 flex items-center gap-2">
            <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
          </div>
        </div>
      </div>

      {/* Data */}
      {loading ? (
        <p className="text-sm text-text-sub">Загрузка...</p>
      ) : view === 'table' ? (
        <DataTable>
          <DataTableHeader>
            <div className="w-[80px] flex-shrink-0">ID</div>
            <div className="flex-1 px-4">Плательщик</div>
            <div className="w-[110px] px-4">Сумма</div>
            <div className="w-[100px] px-4">Способ</div>
            <div className="w-[110px] px-4">Статус</div>
            <div className="w-[140px] px-4">Дата платежа</div>
            <div className="w-[100px] px-4">Действия</div>
          </DataTableHeader>
          {payments.length === 0 ? (
            <DataTableEmpty>Платежи не найдены</DataTableEmpty>
          ) : (
            payments.map((p) => (
              <DataTableRow key={p.id} className="hover:bg-gray-50 transition-colors">
                <DataTableCell mobileLabel="ID:" className="lg:w-[80px] lg:flex-shrink-0">
                  <span className="font-medium text-text-main text-sm">#{p.id.slice(0, 4)}</span>
                </DataTableCell>
                <DataTableCell mobileLabel="Плательщик:" className="lg:flex-1 lg:px-4">
                  <span className="text-sm text-text-main">{payerName(p.user)}</span>
                </DataTableCell>
                <DataTableCell mobileLabel="Сумма:" className="lg:w-[110px] lg:px-4">
                  <Badge
                    variant={p.status === 'refunded' ? 'error' : p.status === 'pending' ? 'warning' : 'success'}
                    className="text-xs"
                  >
                    +{formatAmount(p.amount)} ₽
                  </Badge>
                </DataTableCell>
                <DataTableCell mobileLabel="Способ:" className="lg:w-[100px] lg:px-4">
                  <span className="text-sm text-text-main">{PROVIDER_LABELS[p.provider ?? ''] ?? p.provider ?? '—'}</span>
                </DataTableCell>
                <DataTableCell mobileLabel="Статус:" className="lg:w-[110px] lg:px-4">
                  <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'} className="text-xs">
                    {STATUS_LABELS[p.status] ?? p.status}
                  </Badge>
                </DataTableCell>
                <DataTableCell mobileLabel="Дата:" className="lg:w-[140px] lg:px-4">
                  <span className="text-sm text-text-main">{formatDate(p.paidAt ?? p.createdAt)}</span>
                </DataTableCell>
                <DataTableCell className="lg:w-[100px] lg:px-4">
                  <button
                    type="button"
                    className="text-[#1855a4] font-medium hover:underline text-left cursor-pointer flex items-center gap-1 text-sm"
                  >
                    Подробнее
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </DataTableCell>
              </DataTableRow>
            ))
          )}
          <DataTableFooter>
            Показаны платежи {showFrom}-{showTo} из {total}
          </DataTableFooter>
        </DataTable>
      ) : payments.length === 0 ? (
        <p className="text-sm text-text-sub">Платежи не найдены</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map((p) => (
            <Card key={p.id} padding="none" className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-text-sub">{formatDate(p.paidAt ?? p.createdAt)}</span>
                <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'} className="text-xs">
                  {STATUS_LABELS[p.status] ?? p.status}
                </Badge>
              </div>
              <p className="text-base font-medium text-text-main">{payerName(p.user)}</p>
              <div className="flex items-center gap-3">
                <Badge
                  variant={p.status === 'refunded' ? 'error' : p.status === 'pending' ? 'warning' : 'success'}
                  className="text-xs"
                >
                  +{formatAmount(p.amount)} ₽
                </Badge>
                <span className="text-sm text-text-sub">
                  {PROVIDER_LABELS[p.provider ?? ''] ?? p.provider ?? '—'}
                </span>
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-text-main hover:text-brand-red transition-colors mt-auto pt-2 cursor-pointer"
              >
                Подробнее
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-sub">
          <span>Показаны платежи {showFrom}-{showTo} из {total}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border border-border-light disabled:opacity-40 cursor-pointer"
            >
              &larr;
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border border-border-light disabled:opacity-40 cursor-pointer"
            >
              &rarr;
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
