'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Badge,
  Card,
  Modal,
  Button,
  Input,
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
import { paymentApi, type PaymentRecord } from '@/lib/api/payment';
import { repairRequestApi } from '@/lib/api/repair-request';
import { certificateApi } from '@/lib/api/certificate';

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

const TARGET_TYPE_LABELS: Record<string, string> = {
  repairRequest: 'Заявка на ремонт',
  certificate: 'Сертификат',
  dealerWithdrawal: 'Вывод средств дилера',
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

// ── Date helpers ──

type ChartStyle = 'bar' | 'line';

interface DateRange {
  start: Date;
  end: Date;
}

const RANGE_PRESETS: { key: string; label: string; ms: number }[] = [
  { key: '1h', label: '1ч', ms: 60 * 60 * 1000 },
  { key: '6h', label: '6ч', ms: 6 * 60 * 60 * 1000 },
  { key: '12h', label: '12ч', ms: 12 * 60 * 60 * 1000 },
  { key: '1d', label: '1д', ms: 24 * 60 * 60 * 1000 },
  { key: '7d', label: '7д', ms: 7 * 24 * 60 * 60 * 1000 },
  { key: '1m', label: '1м', ms: 30 * 24 * 60 * 60 * 1000 },
  { key: '1y', label: '1г', ms: 365 * 24 * 60 * 60 * 1000 },
];

function defaultRange(): DateRange {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
}

function formatDateFull(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatAmount(amount: number) {
  return amount.toLocaleString('ru-RU');
}

function formatRangeLabel(range: DateRange) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  const startStr = range.start.toLocaleDateString('ru-RU', opts);
  const endStr = range.end.toLocaleDateString('ru-RU', { ...opts, year: 'numeric' });
  return `С ${startStr} по ${endStr} г.`;
}

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function payerName(user?: PaymentRecord['user']) {
  if (!user) return '-';
  return [user.lastName, user.firstName].filter(Boolean).join(' ') || user.email || '-';
}

// ── Bucketing ──

interface Bucket {
  start: Date;
  end: Date;
  total: number;
  label: string;
}

function bucketPayments(
  payments: PaymentRecord[],
  range: DateRange,
): Bucket[] {
  const rangeMs = range.end.getTime() - range.start.getTime();

  // Determine bucket size
  let bucketMs: number;
  let labelFn: (d: Date) => string;

  if (rangeMs <= 6 * 60 * 60 * 1000) {
    // ≤6h: 30min buckets
    bucketMs = 30 * 60 * 1000;
    labelFn = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } else if (rangeMs <= 24 * 60 * 60 * 1000) {
    // ≤1d: 1h buckets
    bucketMs = 60 * 60 * 1000;
    labelFn = (d) => `${String(d.getHours()).padStart(2, '0')}:00`;
  } else if (rangeMs <= 7 * 24 * 60 * 60 * 1000) {
    // ≤7d: 6h buckets
    bucketMs = 6 * 60 * 60 * 1000;
    labelFn = (d) => `${d.getDate()} ${d.toLocaleDateString('ru-RU', { month: 'short' })}`;
  } else if (rangeMs <= 60 * 24 * 60 * 60 * 1000) {
    // ≤60d: 1d buckets
    bucketMs = 24 * 60 * 60 * 1000;
    labelFn = (d) => `${d.getDate()} ${d.toLocaleDateString('ru-RU', { month: 'short' })}`;
  } else {
    // >60d: 7d buckets
    bucketMs = 7 * 24 * 60 * 60 * 1000;
    labelFn = (d) => `${d.getDate()} ${d.toLocaleDateString('ru-RU', { month: 'short' })}`;
  }

  // Create buckets
  const buckets: Bucket[] = [];
  let t = range.start.getTime();
  while (t < range.end.getTime()) {
    const bEnd = Math.min(t + bucketMs, range.end.getTime());
    buckets.push({
      start: new Date(t),
      end: new Date(bEnd),
      total: 0,
      label: labelFn(new Date(t)),
    });
    t += bucketMs;
  }

  // Fill buckets
  for (const p of payments) {
    const ts = new Date(p.paidAt ?? p.createdAt).getTime();
    if (ts < range.start.getTime() || ts > range.end.getTime()) continue;
    const idx = Math.min(
      Math.floor((ts - range.start.getTime()) / bucketMs),
      buckets.length - 1,
    );
    if (idx >= 0 && idx < buckets.length) {
      buckets[idx].total += p.amount;
    }
  }

  return buckets;
}

// ── Chart rendering ──

function BarChart({ buckets, color }: { buckets: Bucket[]; color: string }) {
  const max = Math.max(...buckets.map((b) => b.total), 1);
  const showEvery = buckets.length > 15 ? Math.ceil(buckets.length / 10) : 1;

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-end gap-[2px] h-[120px]">
        {buckets.map((b, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 rounded-t-sm transition-all"
            style={{
              height: `${Math.max((b.total / max) * 100, b.total > 0 ? 4 : 0)}%`,
              backgroundColor: color,
            }}
            title={`${b.label}: ${formatAmount(b.total)} ₽`}
          />
        ))}
      </div>
      <div className="flex gap-[2px]">
        {buckets.map((b, i) => (
          <div key={i} className="flex-1 min-w-0 text-center overflow-hidden">
            {i % showEvery === 0 ? (
              <span className="text-[9px] text-text-sub leading-none whitespace-nowrap">{b.label}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ buckets, color }: { buckets: Bucket[]; color: string }) {
  const max = Math.max(...buckets.map((b) => b.total), 1);
  const showEvery = buckets.length > 15 ? Math.ceil(buckets.length / 10) : 1;
  const h = 120;
  const w = buckets.length > 1 ? buckets.length - 1 : 1;

  const points = buckets
    .map((b, i) => {
      const x = (i / w) * 100;
      const y = h - (b.total / max) * h;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${h} ${points} 100,${h}`;

  return (
    <div className="flex flex-col gap-1 w-full">
      <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: h }}>
        <polygon points={areaPoints} fill={color} opacity={0.1} />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex">
        {buckets.map((b, i) => (
          <div key={i} className="flex-1 min-w-0 text-center overflow-hidden">
            {i % showEvery === 0 ? (
              <span className="text-[9px] text-text-sub leading-none whitespace-nowrap">{b.label}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Payment chart card ──

function PaymentChartCard({
  title,
  total,
  prevTotal,
  buckets,
  color,
  chartStyle,
  rangeLabel,
  onRangeClick,
  onStyleToggle,
}: {
  title: string;
  total: number;
  prevTotal: number;
  buckets: Bucket[];
  color: string;
  chartStyle: ChartStyle;
  rangeLabel: string;
  onRangeClick: () => void;
  onStyleToggle: () => void;
}) {
  const pctChange = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : total > 0 ? 100 : 0;
  const pctColor = pctChange >= 0 ? 'text-[#108b00]' : 'text-brand-red';

  return (
    <div className="bg-white border border-border-light rounded-sm p-5 lg:p-8 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-2xl lg:text-[52px] font-bold italic text-text-main leading-tight tracking-tight">
            {formatAmount(total)} ₽
          </p>
          <p className="text-base lg:text-xl text-text-main">{title}</p>
          <p className="text-sm">
            <span className={pctColor}>{pctChange >= 0 ? '+' : ''}{pctChange}%</span>
            <span className="text-text-sub"> за период</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onStyleToggle}
          className="text-text-sub hover:text-text-main transition-colors cursor-pointer p-1"
          title={chartStyle === 'bar' ? 'Линейный график' : 'Столбчатый график'}
        >
          {chartStyle === 'bar' ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          )}
        </button>
      </div>

      {buckets.length > 0 && (
        chartStyle === 'bar'
          ? <BarChart buckets={buckets} color={color} />
          : <LineChart buckets={buckets} color={color} />
      )}

      <button
        type="button"
        onClick={onRangeClick}
        className="text-sm text-text-sub hover:text-text-main transition-colors cursor-pointer text-left"
      >
        {rangeLabel}
      </button>
    </div>
  );
}

// ── Date range modal ──

function DateRangeModal({
  open,
  onClose,
  range,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  range: DateRange;
  onApply: (range: DateRange) => void;
}) {
  const [startStr, setStartStr] = useState(toInputDate(range.start));
  const [endStr, setEndStr] = useState(toInputDate(range.end));
  const [activePreset, setActivePreset] = useState<string | null>('1m');

  useEffect(() => {
    if (open) {
      setStartStr(toInputDate(range.start));
      setEndStr(toInputDate(range.end));
    }
  }, [open, range]);

  const handlePreset = (preset: typeof RANGE_PRESETS[number]) => {
    const end = new Date();
    const start = new Date(end.getTime() - preset.ms);
    setStartStr(toInputDate(start));
    setEndStr(toInputDate(end));
    setActivePreset(preset.key);
  };

  const handleApply = () => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start < end) {
      end.setHours(23, 59, 59, 999);
      onApply({ start, end });
      onClose();
    }
  };

  const handleSetNow = () => {
    setEndStr(toInputDate(new Date()));
    setActivePreset(null);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col gap-5 p-6 w-full sm:w-[400px]">
        <h2 className="text-lg font-medium text-text-main">Период</h2>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePreset(p)}
              className={`px-3 py-1.5 text-sm rounded-sm border transition-colors cursor-pointer ${
                activePreset === p.key
                  ? 'border-brand-red bg-brand-red/5 text-brand-red font-medium'
                  : 'border-border-light text-text-main hover:border-text-sub'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom range */}
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-text-sub">Начало</label>
            <Input
              type="date"
              value={startStr}
              onChange={(e) => { setStartStr(e.target.value); setActivePreset(null); }}
            />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-text-sub">Конец</label>
              <button
                type="button"
                onClick={handleSetNow}
                className="text-xs text-brand-red hover:underline cursor-pointer"
              >
                Сейчас
              </button>
            </div>
            <Input
              type="date"
              value={endStr}
              onChange={(e) => { setEndStr(e.target.value); setActivePreset(null); }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={handleApply}>Применить</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Detail row helper ──

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border-light last:border-b-0">
      <span className="text-sm text-text-sub flex-shrink-0">{label}</span>
      <span className="text-sm text-text-main text-right">{value}</span>
    </div>
  );
}

// ── Payment detail modal ──

function PaymentDetailModal({
  payment,
  open,
  onClose,
}: {
  payment: PaymentRecord | null;
  open: boolean;
  onClose: () => void;
}) {
  const [target, setTarget] = useState<any>(null);
  const [targetLoading, setTargetLoading] = useState(false);

  useEffect(() => {
    if (!open || !payment?.targetId || !payment?.targetType) {
      setTarget(null);
      return;
    }
    setTargetLoading(true);
    setTarget(null);

    if (payment.targetType === 'repairRequest') {
      repairRequestApi.getOne(payment.targetId)
        .then(({ data }) => setTarget((data as any)?.request ?? data))
        .catch(() => {})
        .finally(() => setTargetLoading(false));
    } else if (payment.targetType === 'certificate') {
      certificateApi.getOne(payment.targetId)
        .then(({ data }) => setTarget((data as any)?.certificate ?? data))
        .catch(() => {})
        .finally(() => setTargetLoading(false));
    } else {
      setTargetLoading(false);
    }
  }, [open, payment?.targetId, payment?.targetType]);

  if (!payment) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col gap-5 p-6 w-full sm:w-[520px]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-text-main">Детали платежа</h2>
          <Badge variant={STATUS_BADGE_VARIANT[payment.status] ?? 'neutral'}>
            {STATUS_LABELS[payment.status] ?? payment.status}
          </Badge>
        </div>

        <div className="flex flex-col">
          <DetailRow label="ID платежа" value={payment.id} />
          <DetailRow label="Плательщик" value={payerName(payment.user)} />
          {payment.user?.email && <DetailRow label="Email" value={payment.user.email} />}
          {payment.user?.phone && <DetailRow label="Телефон" value={payment.user.phone} />}
          <DetailRow
            label="Сумма"
            value={
              <Badge
                variant={payment.status === 'refunded' ? 'error' : payment.status === 'pending' ? 'warning' : 'success'}
                className="text-xs"
              >
                {formatAmount(payment.amount)} ₽
              </Badge>
            }
          />
          <DetailRow label="Валюта" value={payment.currency?.toUpperCase() ?? 'RUB'} />
          <DetailRow label="Способ оплаты" value={PROVIDER_LABELS[payment.provider ?? ''] ?? payment.provider ?? '-'} />
          {payment.providerPaymentId && <DetailRow label="ID провайдера" value={payment.providerPaymentId} />}
          <DetailRow label="Создан" value={formatDateFull(payment.createdAt)} />
          {payment.paidAt && <DetailRow label="Оплачен" value={formatDateFull(payment.paidAt)} />}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-text-main">
            {TARGET_TYPE_LABELS[payment.targetType] ?? 'Назначение платежа'}
          </h3>

          {targetLoading ? (
            <p className="text-sm text-text-sub">Загрузка...</p>
          ) : !target ? (
            <p className="text-sm text-text-sub">ID: {payment.targetId}</p>
          ) : payment.targetType === 'repairRequest' ? (
            <div className="flex flex-col bg-gray-50 rounded-sm p-4">
              <DetailRow label="ID заявки" value={`#${target.id?.slice(0, 8)}`} />
              <DetailRow label="Статус" value={target.status ?? '-'} />
              {target.description && <DetailRow label="Описание" value={target.description} />}
              {target.userDevice?.device?.name && <DetailRow label="Устройство" value={target.userDevice.device.name} />}
              {target.address && (
                <DetailRow
                  label="Адрес"
                  value={[target.address.city, target.address.street, target.address.house ? `д. ${target.address.house}` : ''].filter(Boolean).join(', ') || '-'}
                />
              )}
              {target.repairer?.user && (
                <DetailRow
                  label="Мастер"
                  value={[target.repairer.user.lastName, target.repairer.user.firstName].filter(Boolean).join(' ') || '-'}
                />
              )}
              {target.totalCost != null && <DetailRow label="Стоимость ремонта" value={`${formatAmount(target.totalCost)} ₽`} />}
              <div className="mt-3">
                <Link href={`/account/requests/${target.id}`} className="text-sm text-brand-red hover:underline">
                  Перейти к заявке
                </Link>
              </div>
            </div>
          ) : payment.targetType === 'certificate' ? (
            <div className="flex flex-col bg-gray-50 rounded-sm p-4">
              <DetailRow label="Номер сертификата" value={target.certificateNumber ?? '-'} />
              <DetailRow label="Статус" value={target.status ?? '-'} />
              {target.userDevice?.device?.name && <DetailRow label="Устройство" value={target.userDevice.device.name} />}
              {target.issuedAt && <DetailRow label="Выдан" value={formatDateFull(target.issuedAt)} />}
              {target.expiresAt && <DetailRow label="Истекает" value={formatDateFull(target.expiresAt)} />}
              {target.dealer?.companyName && <DetailRow label="Дилер" value={target.dealer.companyName} />}
              {target.price != null && <DetailRow label="Стоимость" value={`${formatAmount(target.price)} ₽`} />}
            </div>
          ) : (
            <div className="flex flex-col bg-gray-50 rounded-sm p-4">
              <DetailRow label="ID" value={payment.targetId} />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="self-end px-5 py-2 text-sm font-medium border border-border-light text-text-main hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Закрыть
        </button>
      </div>
    </Modal>
  );
}

// ── Main component ──

export function ManagerPayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: '', provider: '' });
  const [page, setPage] = useState(0);
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
          offset: page * pageSize,
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

      {/* Chart cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PaymentChartCard
          title="Подтверждено"
          total={confirmedTotal}
          prevTotal={prevConfirmedTotal}
          buckets={confirmedBuckets}
          color="#108b00"
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
