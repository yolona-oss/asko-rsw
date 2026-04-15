'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Badge,
  Button,
  Card,
  DataGrid,
  DataToolbar,
  DetailRow,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  ChartCard,
  DateRangeModal,
  defaultRange,
  formatRangeLabel,
  SkeletonCard,
} from '@asko/ui';
import type { DataGridColumn, SortOrder, FilterValues, ChartStyle, DateRange, ChartBucket } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { useEntityDetail } from '@/hooks/use-entity-detail';
import { EntityDetailModal } from '@/components/account/_shared/entity-detail-modal';
import { WithdrawModal } from '@/components/account/payments/dealer/withdraw-modal';
import { paymentApi, type PaymentRecord } from '@/lib/api/payment';
import { dealerApi } from '@/lib/api/dealer';
import type { IPointsTransaction } from '@/lib/api/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { getMyWithdraws } from '@/store/withdraw-slice';
import {
  formatAmount, formatDate,
  POINTS_TX_LABELS, POINTS_TX_BADGE_VARIANT,
  STATUS_LABELS, STATUS_BADGE_VARIANT, TARGET_LABELS,
} from './constants';
import { WithdrawalHistory } from './withdrawal-history';

// ─── Chart bucketing helpers ───────────────────────────────────────────────

function makeBuckets(range: DateRange): ChartBucket[] {
  const rangeMs = range.end.getTime() - range.start.getTime();
  const bucketMs = rangeMs <= 60 * 86400000 ? 86400000 : 7 * 86400000;
  const labelFn = (d: Date) => `${d.getDate()} ${d.toLocaleDateString('ru-RU', { month: 'short' })}`;
  const buckets: ChartBucket[] = [];
  let t = range.start.getTime();
  while (t < range.end.getTime()) {
    buckets.push({ start: new Date(t), end: new Date(Math.min(t + bucketMs, range.end.getTime())), total: 0, count: 0, label: labelFn(new Date(t)) });
    t += bucketMs;
  }
  return buckets;
}

function bucketPointsIncome(transactions: IPointsTransaction[], range: DateRange): ChartBucket[] {
  const rangeMs = range.end.getTime() - range.start.getTime();
  const bucketMs = rangeMs <= 60 * 86400000 ? 86400000 : 7 * 86400000;
  const buckets = makeBuckets(range);
  for (const tx of transactions) {
    if (tx.amount <= 0) continue;
    const ts = new Date(tx.createdAt).getTime();
    if (ts < range.start.getTime() || ts > range.end.getTime()) continue;
    const idx = Math.min(Math.floor((ts - range.start.getTime()) / bucketMs), buckets.length - 1);
    if (idx >= 0) { buckets[idx].total += tx.amount; buckets[idx].count += 1; }
  }
  return buckets;
}

function bucketWithdrawals(items: any[], range: DateRange): ChartBucket[] {
  const rangeMs = range.end.getTime() - range.start.getTime();
  const bucketMs = rangeMs <= 60 * 86400000 ? 86400000 : 7 * 86400000;
  const buckets = makeBuckets(range);
  for (const w of items) {
    const ts = new Date(w.requestedAt ?? w.createdAt).getTime();
    if (ts < range.start.getTime() || ts > range.end.getTime()) continue;
    const idx = Math.min(Math.floor((ts - range.start.getTime()) / bucketMs), buckets.length - 1);
    if (idx >= 0) { buckets[idx].total += w.amount; buckets[idx].count += 1; }
  }
  return buckets;
}

// ─── Filter definitions ────────────────────────────────────────────────────

const POINTS_FILTER = { key: 'type', label: 'Тип', type: 'select' as const, options: [
  { value: '', label: 'Все' }, { value: 'earned', label: 'Начисление' },
  { value: 'spent', label: 'Списание' }, { value: 'adjustment', label: 'Корректировка' },
]};

const PAYMENT_STATUS_FILTER = { key: 'status', label: 'Статус', type: 'select' as const, options: [
  { value: '', label: 'Все' }, { value: 'paid', label: 'Оплачен' },
  { value: 'pending', label: 'Ожидание' }, { value: 'refunded', label: 'Возвращён' },
]};

// ─── Columns ───────────────────────────────────────────────────────────────

const pointsColumns: DataGridColumn<IPointsTransaction>[] = [
  { key: 'reason', header: 'Описание', sortable: false, mobileLabel: 'Описание:', render: (tx) => <span className="text-sm text-text-main">{tx.reason}</span> },
  { key: 'amount', header: 'Сумма', width: 120, mobileLabel: 'Сумма:', render: (tx) => <span className={`text-sm font-medium ${tx.amount > 0 ? 'text-success' : 'text-brand-red'}`}>{tx.amount > 0 ? '+' : ''}{formatAmount(tx.amount)}</span> },
  { key: 'type', header: 'Тип', sortable: false, width: 130, mobileLabel: 'Тип:', render: (tx) => <Badge variant={POINTS_TX_BADGE_VARIANT[tx.type] ?? 'neutral'}>{POINTS_TX_LABELS[tx.type] ?? tx.type}</Badge> },
  { key: 'date', header: 'Дата', sortField: 'createdAt', width: 160, mobileLabel: 'Дата:', render: (tx) => <span className="text-sm text-text-sub">{formatDate(tx.createdAt)}</span> },
];

const paymentColumns: DataGridColumn<PaymentRecord>[] = [
  { key: 'type', header: 'Тип', sortable: false, mobileLabel: 'Тип:', render: (p) => <span className="text-sm font-medium text-text-main">{TARGET_LABELS[p.targetType ?? ''] ?? 'Платёж'}</span> },
  { key: 'amount', header: 'Сумма', width: 140, mobileLabel: 'Сумма:', render: (p) => <span className="text-sm font-bold text-text-main">{formatAmount(p.amount)} ₽</span> },
  { key: 'status', header: 'Статус', width: 140, mobileLabel: 'Статус:', render: (p) => <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'}>{STATUS_LABELS[p.status] ?? p.status}</Badge> },
  { key: 'date', header: 'Дата', sortField: 'createdAt', width: 160, mobileLabel: 'Дата:', render: (p) => <span className="text-sm text-text-sub">{formatDate(p.paidAt || p.createdAt)}</span> },
];

// ─── Component ─────────────────────────────────────────────────────────────

export function DealerPayments() {
  const dispatch = useAppDispatch();
  const { withdrawals } = useAppSelector((s) => s.withdraw);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [pointsHistory, setPointsHistory] = useState<IPointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // Detail modals
  const pointsDetail = useEntityDetail<IPointsTransaction>();
  const paymentDetail = useEntityDetail<PaymentRecord>();

  // Points view
  const [pointsView, setPointsView] = useState('table');
  const [pointsFilter, setPointsFilter] = useState<FilterValues>({ type: '' });
  const [pointsSortBy, setPointsSortBy] = useState<string | null>(null);
  const [pointsSortOrder, setPointsSortOrder] = useState<SortOrder | null>(null);

  // Payment view
  const [paymentView, setPaymentView] = useState('table');
  const [paymentFilter, setPaymentFilter] = useState<FilterValues>({ status: '' });
  const [paymentSortBy, setPaymentSortBy] = useState<string | null>(null);
  const [paymentSortOrder, setPaymentSortOrder] = useState<SortOrder | null>(null);

  // Chart
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange());
  const [chartStyle, setChartStyle] = useState<ChartStyle>('bar');
  const [dateModalOpen, setDateModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [paymentsRes, profileRes, pointsRes] = await Promise.all([
        paymentApi.getMyPayments({ limit: 200 }),
        dealerApi.getProfile(),
        dealerApi.getPointsHistory({ limit: 200 }),
      ]);
      setPayments(paymentsRes.data.data ?? []);
      setPaymentsTotal(paymentsRes.data.overallCount ?? 0);
      setPointsBalance(profileRes.data.profile?.pointsBalance ?? 0);
      setPointsHistory(pointsRes.data.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); dispatch(getMyWithdraws()); }, [dispatch, fetchData]);

  // Chart data — points income
  const earnedBuckets = useMemo(() => bucketPointsIncome(pointsHistory, dateRange), [pointsHistory, dateRange]);
  const inRange = useCallback((ts: number) => ts >= dateRange.start.getTime() && ts <= dateRange.end.getTime(), [dateRange]);
  const inPrev = useMemo(() => {
    const dur = dateRange.end.getTime() - dateRange.start.getTime();
    const ps = dateRange.start.getTime() - dur;
    const pe = dateRange.start.getTime();
    return (ts: number) => ts >= ps && ts <= pe;
  }, [dateRange]);

  const earnedTotal = useMemo(() => pointsHistory.filter(tx => tx.amount > 0 && inRange(new Date(tx.createdAt).getTime())).reduce((s, tx) => s + tx.amount, 0), [pointsHistory, inRange]);
  const prevEarned = useMemo(() => pointsHistory.filter(tx => tx.amount > 0 && inPrev(new Date(tx.createdAt).getTime())).reduce((s, tx) => s + tx.amount, 0), [pointsHistory, inPrev]);

  // Chart data — withdrawals
  const withdrawalBuckets = useMemo(() => bucketWithdrawals(withdrawals, dateRange), [withdrawals, dateRange]);
  const withdrawalTotal = useMemo(() => withdrawals.filter((w: any) => inRange(new Date(w.requestedAt ?? w.createdAt).getTime())).reduce((s: number, w: any) => s + w.amount, 0), [withdrawals, inRange]);
  const prevWithdrawal = useMemo(() => withdrawals.filter((w: any) => inPrev(new Date(w.requestedAt ?? w.createdAt).getTime())).reduce((s: number, w: any) => s + w.amount, 0), [withdrawals, inPrev]);

  const rangeLabel = formatRangeLabel(dateRange);
  const toggleStyle = useCallback(() => setChartStyle(s => s === 'bar' ? 'line' : 'bar'), []);
  const pct = (cur: number, prev: number) => prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0;

  const renderPointsTooltip = useCallback((bucket: ChartBucket) => (
    <>
      <p className="text-xs font-medium text-text-main">{bucket.label}</p>
      <p className="text-xs text-text-sub">{formatAmount(bucket.total)} баллов</p>
      <p className="text-xs text-text-sub">{bucket.count} {bucket.count === 1 ? 'операция' : bucket.count < 5 ? 'операции' : 'операций'}</p>
    </>
  ), []);

  const renderWithdrawalTooltip = useCallback((bucket: ChartBucket) => (
    <>
      <p className="text-xs font-medium text-text-main">{bucket.label}</p>
      <p className="text-xs text-text-sub">{formatAmount(bucket.total)} ₽</p>
      <p className="text-xs text-text-sub">{bucket.count} {bucket.count === 1 ? 'вывод' : bucket.count < 5 ? 'вывода' : 'выводов'}</p>
    </>
  ), []);

  // Filtered data
  const filteredPoints = useMemo(() => {
    let items = pointsHistory;
    if (pointsFilter.type) items = items.filter(tx => tx.type === pointsFilter.type);
    if (pointsSortBy) items = [...items].sort((a, b) => { const cmp = ((a as any)[pointsSortBy] ?? '') < ((b as any)[pointsSortBy] ?? '') ? -1 : 1; return pointsSortOrder === 'desc' ? -cmp : cmp; });
    return items;
  }, [pointsHistory, pointsFilter, pointsSortBy, pointsSortOrder]);

  const filteredPayments = useMemo(() => {
    let items = payments;
    if (paymentFilter.status) items = items.filter(p => p.status === paymentFilter.status);
    if (paymentSortBy) items = [...items].sort((a, b) => { const cmp = ((a as any)[paymentSortBy] ?? '') < ((b as any)[paymentSortBy] ?? '') ? -1 : 1; return paymentSortOrder === 'desc' ? -cmp : cmp; });
    return items;
  }, [payments, paymentFilter, paymentSortBy, paymentSortOrder]);

  return (
    <PageContainer>
      <PageHeader>Платежи</PageHeader>

      {/* Balance card */}
      <Card className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[24px] font-normal leading-[28px] tracking-[-0.01em] text-text-main">Баланс баллов</span>
          <span className="text-[82px] font-medium leading-[86px] tracking-[-0.01em] text-text-main">
            {loading ? '-' : formatAmount(pointsBalance)}
          </span>
        </div>
        <Button variant="primary" size="lg" onClick={() => setWithdrawOpen(true)} disabled={pointsBalance <= 0}>
          Вывести на карту
        </Button>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Начислено баллов" formattedValue={`${formatAmount(earnedTotal)}`} pctChange={pct(earnedTotal, prevEarned)} buckets={earnedBuckets} color="#20834A" chartStyle={chartStyle} rangeLabel={rangeLabel} onRangeClick={() => setDateModalOpen(true)} onStyleToggle={toggleStyle} renderTooltip={renderPointsTooltip} />
        <ChartCard title="Выведено" formattedValue={`${formatAmount(withdrawalTotal)} ₽`} pctChange={pct(withdrawalTotal, prevWithdrawal)} buckets={withdrawalBuckets} color="#3b82f6" chartStyle={chartStyle} rangeLabel={rangeLabel} onRangeClick={() => setDateModalOpen(true)} onStyleToggle={toggleStyle} renderTooltip={renderWithdrawalTooltip} />
      </div>

      {/* Withdrawal history */}
      <WithdrawalHistory withdrawals={withdrawals} />

      {/* Points history */}
      <h3 className="text-lg font-medium text-text-main">История баллов</h3>
      <DataToolbar
        filters={[POINTS_FILTER]}
        filterValues={pointsFilter}
        onFilterChange={(key: string, value: string | string[]) => setPointsFilter(prev => ({ ...prev, [key]: value }))}
        viewSwitcher={<ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={pointsView} onViewChange={setPointsView} />}
      />
      {pointsView === 'table' ? (
        <DataGrid<IPointsTransaction> loading={loading} columns={pointsColumns} data={filteredPoints} keyExtractor={(tx) => tx.id} emptyContent="Нет операций" sortKey={pointsSortBy ?? undefined} sortOrder={pointsSortOrder ?? undefined} onSort={(k, o) => { setPointsSortBy(k); setPointsSortOrder(o); }} onRowClick={pointsDetail.onRowClick} footer={<>Показано {filteredPoints.length} из {pointsHistory.length}</>} />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="h-36" />)}
        </div>
      ) : filteredPoints.length === 0 ? (
        <p className="text-sm text-text-sub">Нет операций</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPoints.map((tx) => (
            <Card key={tx.id} padding="none" className="p-5 flex flex-col gap-3 cursor-pointer hover:border-text-sub transition-colors" onClick={() => pointsDetail.onRowClick(tx)}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-text-main">{tx.reason}</span>
                <Badge variant={POINTS_TX_BADGE_VARIANT[tx.type] ?? 'neutral'}>{POINTS_TX_LABELS[tx.type] ?? tx.type}</Badge>
              </div>
              <span className={`text-lg font-medium ${tx.amount > 0 ? 'text-success' : 'text-brand-red'}`}>{tx.amount > 0 ? '+' : ''}{formatAmount(tx.amount)}</span>
              <span className="text-xs text-text-sub">{formatDate(tx.createdAt)}</span>
            </Card>
          ))}
        </div>
      )}

      {/* Payment history */}
      <h3 className="text-lg font-medium text-text-main">История платежей</h3>
      <DataToolbar
        filters={[PAYMENT_STATUS_FILTER]}
        filterValues={paymentFilter}
        onFilterChange={(key: string, value: string | string[]) => setPaymentFilter(prev => ({ ...prev, [key]: value }))}
        viewSwitcher={<ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={paymentView} onViewChange={setPaymentView} />}
      />
      {paymentView === 'table' ? (
        <DataGrid<PaymentRecord> loading={loading} columns={paymentColumns} data={filteredPayments} keyExtractor={(p) => p.id} emptyContent="Нет платежей" sortKey={paymentSortBy ?? undefined} sortOrder={paymentSortOrder ?? undefined} onSort={(k, o) => { setPaymentSortBy(k); setPaymentSortOrder(o); }} onRowClick={paymentDetail.onRowClick} footer={<>Показано {filteredPayments.length} из {paymentsTotal}</>} />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="h-36" />)}
        </div>
      ) : filteredPayments.length === 0 ? (
        <p className="text-sm text-text-sub">Нет платежей</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPayments.map((p) => (
            <Card key={p.id} padding="none" className="p-5 flex flex-col gap-3 cursor-pointer hover:border-text-sub transition-colors" onClick={() => paymentDetail.onRowClick(p)}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-text-main">{TARGET_LABELS[p.targetType ?? ''] ?? 'Платёж'}</span>
                <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'}>{STATUS_LABELS[p.status] ?? p.status}</Badge>
              </div>
              <span className="text-lg font-bold text-text-main">{formatAmount(p.amount)} ₽</span>
              <span className="text-sm text-text-sub">{formatDate(p.paidAt || p.createdAt)}</span>
            </Card>
          ))}
        </div>
      )}

      {/* Detail modals */}
      <EntityDetailModal
        open={pointsDetail.open}
        onClose={pointsDetail.onClose}
        item={pointsDetail.selectedItem}
        title="Детали операции"
        renderContent={(item) => (
          <div className="flex flex-col">
            <DetailRow label="Описание" value={item.reason ?? '-'} />
            <DetailRow label="Сумма" value={<span className={item.amount > 0 ? 'text-success' : 'text-brand-red'}>{item.amount > 0 ? '+' : ''}{formatAmount(item.amount)}</span>} />
            <DetailRow label="Тип" value={<Badge variant={POINTS_TX_BADGE_VARIANT[item.type] ?? 'neutral'}>{POINTS_TX_LABELS[item.type] ?? item.type}</Badge>} />
            <DetailRow label="Дата" value={formatDate(item.createdAt)} />
          </div>
        )}
      />
      <EntityDetailModal
        open={paymentDetail.open}
        onClose={paymentDetail.onClose}
        item={paymentDetail.selectedItem}
        title="Детали платежа"
        renderContent={(item) => (
          <div className="flex flex-col">
            <DetailRow label="Тип" value={TARGET_LABELS[item.targetType ?? ''] ?? 'Платёж'} />
            <DetailRow label="Сумма" value={`${formatAmount(item.amount)} ₽`} />
            <DetailRow label="Статус" value={<Badge variant={STATUS_BADGE_VARIANT[item.status] ?? 'neutral'}>{STATUS_LABELS[item.status] ?? item.status}</Badge>} />
            <DetailRow label="Дата" value={formatDate(item.paidAt || item.createdAt)} />
          </div>
        )}
      />

      <WithdrawModal open={withdrawOpen} onClose={() => { setWithdrawOpen(false); fetchData(); dispatch(getMyWithdraws()); }} maxAmount={pointsBalance} />
      <DateRangeModal open={dateModalOpen} onClose={() => setDateModalOpen(false)} range={dateRange} onApply={(r) => { if (r) setDateRange(r); }} showAllTime={false} />
    </PageContainer>
  );
}
