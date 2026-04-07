'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Badge,
  Card,
  ContextMenuArea,
  DataToolbar,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  DataGrid,
  Pagination,
  ChartCard,
  DateRangeModal,
  defaultRange,
  formatRangeLabel,
} from '@asko/ui';
import type { FilterValues, DataGridColumn, SortOrder, ChartStyle, DateRange, ChartBucket } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { paymentApi, type PaymentRecord } from '@/lib/api/payment';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, PROVIDER_LABELS, FILTERS } from './constants';
import { formatDateFull, formatAmount, payerName, bucketPayments } from './utils';
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
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);
  const pageSize = 20;

  // Chart state
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange());
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

  const renderChartTooltip = useCallback((bucket: ChartBucket) => (
    <>
      <p className="text-xs font-medium text-text-main">{bucket.label}</p>
      <p className="text-xs text-text-sub">{formatAmount(bucket.total)} ₽</p>
      <p className="text-xs text-text-sub">{bucket.count} {bucket.count === 1 ? 'транзакция' : bucket.count < 5 ? 'транзакции' : 'транзакций'}</p>
    </>
  ), []);

  // Fetch table data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await paymentApi.listPayments({
          page: page,
          limit: pageSize,
          status: filterValues.status || undefined,
          provider: filterValues.provider || undefined,
          search: search || undefined,
          sortBy: sortBy ?? undefined,
          sortOrder: sortOrder ?? undefined,
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
  }, [page, filterValues, search, sortBy, sortOrder]);

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

  const paymentColumns: DataGridColumn<PaymentRecord>[] = useMemo(() => [
    {
      key: 'id',
      header: 'ID',
      width: 80,
      mobileLabel: 'ID:',
      render: (p) => <span className="font-medium text-text-main text-sm">#{p.id.slice(0, 4)}</span>,
    },
    {
      key: 'payer',
      header: 'Плательщик',
      mobileLabel: 'Плательщик:',
      render: (p) => <span className="text-sm text-text-main">{payerName(p.user)}</span>,
    },
    {
      key: 'amount',
      header: 'Сумма',
      width: 110,
      mobileLabel: 'Сумма:',
      render: (p) => (
        <Badge
          variant={p.status === 'refunded' ? 'error' : p.status === 'pending' ? 'warning' : 'success'}
          className="text-xs"
        >
          +{formatAmount(p.amount)} ₽
        </Badge>
      ),
    },
    {
      key: 'provider',
      header: 'Способ',
      width: 100,
      mobileLabel: 'Способ:',
      render: (p) => <span className="text-sm text-text-main">{PROVIDER_LABELS[p.provider ?? ''] ?? p.provider ?? '-'}</span>,
    },
    {
      key: 'status',
      header: 'Статус',
      width: 110,
      mobileLabel: 'Статус:',
      render: (p) => (
        <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'} className="text-xs">
          {STATUS_LABELS[p.status] ?? p.status}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Дата платежа',
      width: 140,
      mobileLabel: 'Дата:',
      render: (p) => <span className="text-sm text-text-main">{formatDateFull(p.paidAt ?? p.createdAt)}</span>,
    },
  ], []);

  return (
    <PageContainer>
      <PageHeader>Платежи</PageHeader>

      {/* Chart cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Подтверждено"
          formattedValue={`${formatAmount(confirmedTotal)} ₽`}
          pctChange={prevConfirmedTotal > 0 ? Math.round(((confirmedTotal - prevConfirmedTotal) / prevConfirmedTotal) * 100) : confirmedTotal > 0 ? 100 : 0}
          buckets={confirmedBuckets}
          color="#20834A"
          chartStyle={chartStyle}
          rangeLabel={rangeLabel}
          onRangeClick={() => setDateModalOpen(true)}
          onStyleToggle={toggleStyle}
          renderTooltip={renderChartTooltip}
        />
        <ChartCard
          title="Возвращено"
          formattedValue={`${formatAmount(refundedTotal)} ₽`}
          pctChange={prevRefundedTotal > 0 ? Math.round(((refundedTotal - prevRefundedTotal) / prevRefundedTotal) * 100) : refundedTotal > 0 ? 100 : 0}
          buckets={refundedBuckets}
          color="#dc2626"
          chartStyle={chartStyle}
          rangeLabel={rangeLabel}
          onRangeClick={() => setDateModalOpen(true)}
          onStyleToggle={toggleStyle}
          renderTooltip={renderChartTooltip}
        />
      </div>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: handleSearch, placeholder: "Поиск по ID или плательщику" }}
        filters={FILTERS}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
      />

      {/* ViewSwitcher — above data view */}
      <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />

      {/* Data */}
      {loading ? (
        <p className="text-sm text-text-sub">Загрузка...</p>
      ) : view === 'table' ? (
        <DataGrid<PaymentRecord>
          columns={paymentColumns}
          data={payments}
          keyExtractor={(p) => p.id}
          emptyContent="Платежи не найдены"
          sortKey={sortBy ?? undefined}
          sortOrder={sortOrder ?? undefined}
          onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
          onRowClick={(p) => setSelectedPayment(p)}
          suppressDetailMenuItem
          footer={
            <div className="flex items-center justify-between w-full">
              <span>Показаны платежи {showFrom}-{showTo} из {total}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          }
        />
      ) : payments.length === 0 ? (
        <p className="text-sm text-text-sub">Платежи не найдены</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map((p) => (
            <ContextMenuArea
              key={p.id}
              items={[
                { key: 'view', label: 'Подробнее', onClick: () => setSelectedPayment(p) },
              ]}
            >
              <Card padding="none" className="p-5 flex flex-col gap-3">
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
              </Card>
            </ContextMenuArea>
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
