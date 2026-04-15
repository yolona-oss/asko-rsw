'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Badge,
  Card,
  ContextMenuArea,
  buildCardMenuItems,
  DataToolbar,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  DataGroupedView,
  Pagination,
  ChartCard,
  DateRangeModal,
  defaultRange,
  formatRangeLabel,
  filterValueToParam,
} from '@asko/ui';
import type { FilterValues, ChartStyle, DateRange, ChartBucket } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { paymentApi, type PaymentRecord } from '@/lib/api/payment';
import { PaymentTargetGroup } from '@/components/account/payments/shared/payment-target-group';
import { PAYMENT_TARGET_LABELS } from '@/components/account/payments/shared/payment-constants';
import { PaymentSummary } from '@/components/account/payments/shared/payment-summary';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, PROVIDER_LABELS, FILTERS } from './constants';
import { formatDateFull, formatAmount, payerName, bucketPayments } from './utils';
import { PaymentDetailModal } from './payment-detail-modal';

function groupKey(p: PaymentRecord) {
  return p.targetId ? `${p.targetType}:${p.targetId}` : 'unknown';
}

export function ManagerPayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: '', provider: '' });
  const [page, setPage] = useState(1);
  const [view, setView] = useState('table');
  const [selectedGroup, setSelectedGroup] = useState<{ payment: PaymentRecord; groupPayments: PaymentRecord[] } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 50;

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
      if (p.status !== 'paid' && p.status !== 'partially_refunded') return false;
      const ts = new Date(p.paidAt || p.createdAt).getTime();
      return ts >= dateRange.start.getTime() && ts <= dateRange.end.getTime();
    }),
    [chartPayments, dateRange],
  );

  const refundedPayments = useMemo(
    () => chartPayments.filter((p) => {
      if (p.status !== 'refunded' && p.status !== 'partially_refunded') return false;
      const ts = new Date(p.paidAt || p.createdAt).getTime();
      return ts >= dateRange.start.getTime() && ts <= dateRange.end.getTime();
    }),
    [chartPayments, dateRange],
  );

  const confirmedBuckets = useMemo(() => bucketPayments(confirmedPayments, dateRange), [confirmedPayments, dateRange]);
  const refundedBuckets = useMemo(() => bucketPayments(refundedPayments, dateRange), [refundedPayments, dateRange]);

  const confirmedTotal = confirmedPayments.reduce((s, p) => s + p.amount - (p.refundedAmount ?? 0), 0);
  const refundedTotal = refundedPayments.reduce((s, p) => s + (p.refundedAmount ?? 0), 0);

  // Previous period for % change
  const prevRange = useMemo(() => {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    return { start: new Date(dateRange.start.getTime() - duration), end: new Date(dateRange.start.getTime()) };
  }, [dateRange]);

  const prevConfirmedTotal = useMemo(
    () => chartPayments
      .filter((p) => {
        if (p.status !== 'paid' && p.status !== 'partially_refunded') return false;
        const ts = new Date(p.paidAt || p.createdAt).getTime();
        return ts >= prevRange.start.getTime() && ts <= prevRange.end.getTime();
      })
      .reduce((s, p) => s + p.amount - (p.refundedAmount ?? 0), 0),
    [chartPayments, prevRange],
  );

  const prevRefundedTotal = useMemo(
    () => chartPayments
      .filter((p) => {
        if (p.status !== 'refunded' && p.status !== 'partially_refunded') return false;
        const ts = new Date(p.paidAt || p.createdAt).getTime();
        return ts >= prevRange.start.getTime() && ts <= prevRange.end.getTime();
      })
      .reduce((s, p) => s + (p.refundedAmount ?? 0), 0),
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
          status: filterValueToParam(filterValues, 'status'),
          provider: filterValueToParam(filterValues, 'provider'),
          search: search || undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
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
  }, [page, filterValues, search, refreshKey]);

  const totalPages = Math.ceil(total / pageSize);
  const showFrom = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const showTo = Math.min(page * pageSize, total);

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePaymentClick = (payment: PaymentRecord, groupPayments: PaymentRecord[]) => {
    setSelectedGroup({ payment, groupPayments });
  };

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
        viewSwitcher={<ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />}
      />

      {/* Data — grouped in both views */}
      {view === 'table' ? (
        <DataGroupedView<PaymentRecord>
          data={payments}
          groupBy={groupKey}
          loading={loading}
          loadingGroups={4}
          emptyContent="Платежи не найдены"
          renderGroup={({ key, items }) => (
            <PaymentTargetGroup
              groupKey={key}
              payments={items}
              statusLabels={STATUS_LABELS}
              onPaymentClick={handlePaymentClick}
            />
          )}
        />
      ) : (
        <DataGroupedView<PaymentRecord>
          data={payments}
          groupBy={groupKey}
          loading={loading}
          loadingGroups={4}
          emptyContent="Платежи не найдены"
          renderGroup={({ key, items }) => {
            const colonIdx = key.indexOf(':');
            const targetType = colonIdx > 0 ? key.slice(0, colonIdx) : '';
            const targetId = colonIdx > 0 ? key.slice(colonIdx + 1) : '';
            const isUnknown = key === 'unknown' || !targetType;
            const typeLabel = isUnknown ? 'Прочие платежи' : (PAYMENT_TARGET_LABELS[targetType] ?? targetType);

            return (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-main">{typeLabel}</span>
                  {!isUnknown && <span className="text-xs text-text-sub font-mono">#{targetId.slice(0, 8)}</span>}
                  <Badge variant="neutral" className="text-xs">{items.length}</Badge>
                </div>
                <PaymentSummary payments={items} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((p) => (
                    <ContextMenuArea
                      key={p.id}
                      items={buildCardMenuItems(() => handlePaymentClick(p, items))}
                    >
                      <Card padding="none" className="p-5 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs text-text-sub">{formatDateFull(p.paidAt || p.createdAt)}</span>
                          <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'} className="text-xs">
                            {STATUS_LABELS[p.status] ?? p.status}
                          </Badge>
                        </div>
                        <p className="text-base font-medium text-text-main">{payerName(p.user)}</p>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={p.status === 'refunded' ? 'error' : p.status === 'partially_refunded' || p.status === 'pending' ? 'warning' : 'success'}
                            className="text-xs"
                          >
                            +{formatAmount(p.amount)} ₽
                            {p.refundedAmount != null && p.refundedAmount > 0 && <span className="ml-1 opacity-75">(-{formatAmount(p.refundedAmount)})</span>}
                          </Badge>
                          <span className="text-sm text-text-sub">
                            {PROVIDER_LABELS[p.provider ?? ''] ?? p.provider ?? '-'}
                          </span>
                        </div>
                      </Card>
                    </ContextMenuArea>
                  ))}
                </div>
              </div>
            );
          }}
        />
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-sub">Показаны платежи {showFrom}-{showTo} из {total}</span>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Modals */}
      <PaymentDetailModal
        payment={selectedGroup?.payment ?? null}
        groupPayments={selectedGroup?.groupPayments}
        open={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        onConfirm={() => { setSelectedGroup(null); setRefreshKey((k) => k + 1); }}
      />
      <DateRangeModal
        open={dateModalOpen}
        onClose={() => setDateModalOpen(false)}
        range={dateRange}
        onApply={(r) => { if (r) setDateRange(r); }}
        showAllTime={false}
      />
    </PageContainer>
  );
}
