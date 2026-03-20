'use client';

import { useState, useEffect } from 'react';
import { Badge, Select } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
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
  const [statusFilter, setStatusFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    async function fetchData() {
      try {
        const [paymentsRes, statsRes] = await Promise.all([
          paymentApi.listPayments({
            offset: page * pageSize,
            limit: pageSize,
            status: statusFilter || undefined,
            provider: providerFilter || undefined,
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
  }, [page, statusFilter, providerFilter, search]);

  const totalPages = Math.ceil(total / pageSize);
  const showFrom = total > 0 ? page * pageSize + 1 : 0;
  const showTo = Math.min((page + 1) * pageSize, total);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

      {/* Search + Create button */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-sub" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(0); }}
            placeholder="Поиск по ID или плательщику"
            className="w-full border border-border-light pl-10 pr-4 py-2.5 text-sm text-text-main placeholder:text-text-sub focus:outline-none focus:border-text-sub"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 text-sm overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-medium text-text-main">Статус:</span>
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="py-1 text-sm min-w-[100px]"
          >
            <option value="">Все</option>
            <option value="paid">Подтверждён</option>
            <option value="pending">Ожидание</option>
            <option value="refunded">Возвращён</option>
            <option value="failed">Ошибка</option>
          </Select>
        </div>
        <div className="w-px h-6 bg-border-light flex-shrink-0" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-medium text-text-main">Способ:</span>
          <Select
            value={providerFilter}
            onChange={(e) => { setProviderFilter(e.target.value); setPage(0); }}
            className="py-1 text-sm min-w-[100px]"
          >
            <option value="">Все</option>
            <option value="dummy">Тестовая</option>
            <option value="yookassa">ЮKassa</option>
            <option value="tbank">Т-Банк</option>
            <option value="card">Карта</option>
          </Select>
        </div>
      </div>

      {/* Desktop table */}
      {loading ? (
        <p className="text-sm text-text-sub">Загрузка...</p>
      ) : payments.length === 0 ? (
        <p className="text-sm text-text-sub">Платежи не найдены</p>
      ) : (
        <>
          {/* Desktop view */}
          <div className="hidden lg:block bg-white border border-border-light overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[80px_1fr_110px_100px_110px_140px_100px] bg-[#f6f6f8] border-b border-border-light px-5 py-2 text-sm text-text-main">
              <span>ID</span>
              <span>Плательщик</span>
              <span>Сумма</span>
              <span>Способ</span>
              <span>Статус</span>
              <span>Дата платежа</span>
              <span>Действия</span>
            </div>
            {/* Rows */}
            {payments.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[80px_1fr_110px_100px_110px_140px_100px] px-5 py-3 border-b border-border-light items-center text-sm"
              >
                <span className="font-medium text-text-main">#{p.id.slice(0, 4)}</span>
                <span className="text-text-main">{payerName(p.user)}</span>
                <span>
                  <Badge
                    variant={p.status === 'refunded' ? 'error' : p.status === 'pending' ? 'warning' : 'success'}
                    className="text-xs"
                  >
                    +{formatAmount(p.amount)} ₽
                  </Badge>
                </span>
                <span className="text-text-main">{PROVIDER_LABELS[p.provider ?? ''] ?? p.provider ?? '—'}</span>
                <span>
                  <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </Badge>
                </span>
                <span className="text-text-main">{formatDate(p.paidAt ?? p.createdAt)}</span>
                <button
                  type="button"
                  className="text-[#1855a4] font-medium hover:underline text-left cursor-pointer flex items-center gap-1"
                >
                  Подробнее
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Mobile view */}
          <div className="flex flex-col gap-4 lg:hidden">
            {payments.map((p) => (
              <div key={p.id} className="bg-white border border-border-light p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-lg font-medium text-text-main">{payerName(p.user)}</p>
                    <p className="text-sm text-text-main">{formatDate(p.paidAt ?? p.createdAt)}</p>
                  </div>
                  <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={p.status === 'refunded' ? 'error' : p.status === 'pending' ? 'warning' : 'success'}
                  >
                    +{formatAmount(p.amount)} ₽
                  </Badge>
                  <span className="text-sm text-text-main">
                    {PROVIDER_LABELS[p.provider ?? ''] ?? p.provider ?? '—'}
                  </span>
                </div>
                <button
                  type="button"
                  className="text-[#1855a4] font-medium text-base flex items-center gap-1 cursor-pointer"
                >
                  Подробнее
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-text-sub">
            <span>Показаны платежи {showFrom}-{showTo} из {total}</span>
            {totalPages > 1 && (
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
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
}
