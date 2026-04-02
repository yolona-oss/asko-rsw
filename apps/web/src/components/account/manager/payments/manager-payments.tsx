'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Badge,
  Card,
  DataToolbar,
  VIEW_TABLE,
  VIEW_CARD,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  DataTableFooter,
  Pagination,
} from '@asko/ui';
import type { FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { paymentApi, type PaymentRecord } from '@/lib/api/payment';
import type { ChartStyle, DateRange } from './types';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, PROVIDER_LABELS, FILTERS } from './constants';
import { defaultRange, formatDateFull, formatAmount, formatRangeLabel, payerName, bucketPayments } from './utils';
import { PaymentChartCard } from './payment-chart-card';
import { DateRangeModal } from './date-range-modal';
import { PaymentDetailModal } from './payment-detail-modal';

export function ManagerPayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: '', provider: '' });
  const [page, setPage] = useState(1);
  const [view, setView] = useState('table');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const pageSize = 20;

  // Chart state
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);
  const [chartStyle, setChartStyle] = useState<ChartStyle>('bar');
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [chartPayments, setChartPayments] = useState<PaymentRecord[]>([]);

  // Fetch chart data
  useEffect(() => {
    paymentApi.listPayments({ limit: 1000 })
      .then(({ data }) => setChartPayments(data.data ?? []))
      .catch(() => {});
  }, []);

  // Compute chart buckets
  const confirmedPayments = useMemo(
    () => chartPayments.filter((p) => {
      if (p.status !== 'paid') return false;
      const ts = new Date(p.paidAt ?? p.createdAt).getTime();
      return ts >= dateRange.start.getTime() && ts <= dateRange.end.getTime();
    }),
    [chartPayments, dateRange],
  );

  const refundedPayments = useMemo(
    () => chartPayments.filter((p) => {
      if (p.status !== 'refunded') return false;
      const ts = new Date(p.paidAt ?? p.createdAt).getTime();
      return ts >= dateRange.start.getTime() && ts <= dateRange.end.getTime();
    }),
    [chartPayments, dateRange],
  );

  const confirmedBuckets = useMemo(() => bucketPayments(confirmedPayments, dateRange), [confirmedPayments, dateRange]);
  const refundedBuckets = useMemo(() => bucketPayments(refundedPayments, dateRange), [refundedPayments, dateRange]);

  const confirmedTotal = confirmedPayments.reduce((s, p) => s + p.amount, 0);
  const refundedTotal = refundedPayments.reduce((s, p) => s + p.amount, 0);

  // Previous period for % change
  const prevRange = useMemo(() => {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    return { start: new Date(dateRange.start.getTime() - duration), end: new Date(dateRange.start.getTime()) };
  }, [dateRange]);

  const prevConfirmedTotal = useMemo(
    () => chartPayments
      .filter((p) => {
        if (p.status !== 'paid') return false;
        const ts = new Date(p.paidAt ?? p.createdAt).getTime();
        return ts >= prevRange.start.getTime() && ts <= prevRange.end.getTime();
      })
      .reduce((s, p) => s + p.amount, 0),
    [chartPayments, prevRange],
  );

  const prevRefundedTotal = useMemo(
    () => chartPayments
      .filter((p) => {
        if (p.status !== 'refunded') return false;
        const ts = new Date(p.paidAt ?? p.createdAt).getTime();
        return ts >= prevRange.start.getTime() && ts <= prevRange.end.getTime();
      })
      .reduce((s, p) => s + p.amount, 0),
    [chartPayments, prevRange],
  );

  const rangeLabel = formatRangeLabel(dateRange);
  const toggleStyle = useCallback(() => setChartStyle((s) => (s === 'bar' ? 'line' : 'bar')), []);

  // Fetch table data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await paymentApi.listPayments({
          offset: (page - 1) * pageSize,
          limit: pageSize,
          status: filterValues.status || undefined,
          provider: filterValues.provider || undefined,
          search: search || undefined,
        });
        const result = res.data;
        setPayments(result.data ?? []);
        setTotal(result.overallCount ?? 0);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    fetchData();
  }, [page, filterValues, search]);

  const totalPages = Math.ceil(total / pageSize);
  const showFrom = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const showTo = Math.min(page * pageSize, total);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <PageContainer>
      <PageHeader>Платежи</PageHeader>

      {/* Chart cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PaymentChartCard
          title="Подтверждено"
          total={confirmedTotal}
          prevTotal={prevConfirmedTotal}
          buckets={confirmedBuckets}
          color="#20834A"
          chartStyle={chartStyle}
          rangeLabel={rangeLabel}
          onRangeClick={() => setDateModalOpen(true)}
          onStyleToggle={toggleStyle}
        />
        <PaymentChartCard
          title="Возвращено"
          total={refundedTotal}
          prevTotal={prevRefundedTotal}
          buckets={refundedBuckets}
          color="#dc2626"
          chartStyle={chartStyle}
          rangeLabel={rangeLabel}
          onRangeClick={() => setDateModalOpen(true)}
          onStyleToggle={toggleStyle}
        />
      </div>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: handleSearch, placeholder: "Поиск по ID или плательщику" }}
        filters={FILTERS}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        views={[VIEW_TABLE, VIEW_CARD]}
        activeView={view}
        onViewChange={setView}
      />

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
                  <span className="text-sm text-text-main">{PROVIDER_LABELS[p.provider ?? ''] ?? p.provider ?? '-'}</span>
                </DataTableCell>
                <DataTableCell mobileLabel="Статус:" className="lg:w-[110px] lg:px-4">
                  <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'} className="text-xs">
                    {STATUS_LABELS[p.status] ?? p.status}
                  </Badge>
                </DataTableCell>
                <DataTableCell mobileLabel="Дата:" className="lg:w-[140px] lg:px-4">
                  <span className="text-sm text-text-main">{formatDateFull(p.paidAt ?? p.createdAt)}</span>
                </DataTableCell>
                <DataTableCell className="lg:w-[100px] lg:px-4">
                  <button
                    type="button"
                    onClick={() => setSelectedPayment(p)}
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
            <div className="flex items-center justify-between w-full">
              <span>Показаны платежи {showFrom}-{showTo} из {total}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </DataTableFooter>
        </DataTable>
      ) : payments.length === 0 ? (
        <p className="text-sm text-text-sub">Платежи не найдены</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map((p) => (
            <Card key={p.id} padding="none" className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-text-sub">{formatDateFull(p.paidAt ?? p.createdAt)}</span>
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
                  {PROVIDER_LABELS[p.provider ?? ''] ?? p.provider ?? '-'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(p)}
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
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />

      {/* Modals */}
      <PaymentDetailModal
        payment={selectedPayment}
        open={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
      <DateRangeModal
        open={dateModalOpen}
        onClose={() => setDateModalOpen(false)}
        range={dateRange}
        onApply={setDateRange}
      />
    </PageContainer>
  );
}
