'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Badge,
  Card,
  Button,
  DataGrid,
  DataSearch,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
} from '@asko/ui';
import type { DataGridColumn, SortOrder } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { PaymentModal } from '@/components/account/user/payment-modal';
import { paymentApi, type PaymentRecord } from '@/lib/api/payment';
import {
  STATUS_LABELS,
  STATUS_BADGE_VARIANT,
  TARGET_LABELS,
  formatDate,
  formatAmount,
} from './constants';

export function UserPayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Payment modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<{ targetType: 'repairRequest' | 'certificate'; targetId: string; amount: number } | null>(null);

  // View state
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  async function fetchPayments() {
    try {
      const { data: result } = await paymentApi.getMyPayments({
        page: page,
        limit: pageSize,
        sortBy: sortBy ?? undefined,
        sortOrder: sortOrder ?? undefined,
      });
      setPayments(result.data ?? []);
      setTotal(result.overallCount ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchPayments();
  }, [page, sortBy, sortOrder]);

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const otherPayments = payments.filter((p) => p.status !== 'pending');

  const filteredHistory = useMemo(() => {
    if (!search) return otherPayments;
    const q = search.toLowerCase();
    return otherPayments.filter((p) => {
      const type = (TARGET_LABELS[p.targetType ?? ''] ?? 'Платёж').toLowerCase();
      const status = (STATUS_LABELS[p.status] ?? p.status).toLowerCase();
      const amount = String(p.amount);
      return type.includes(q) || status.includes(q) || amount.includes(q);
    });
  }, [otherPayments, search]);

  const totalPages = Math.ceil(total / pageSize);

  const paymentColumns: DataGridColumn<PaymentRecord>[] = [
    {
      key: 'id',
      header: 'ID',
      width: 120,
      mobileLabel: 'ID:',
      render: (p) => <p className="text-sm text-text-sub font-mono truncate">{p.id.slice(0, 8)}</p>,
    },
    {
      key: 'type',
      header: 'Тип',
      mobileLabel: 'Тип:',
      render: (p) => (
        <p className="text-sm font-medium text-text-main">
          {TARGET_LABELS[p.targetType ?? ''] ?? 'Платёж'}
        </p>
      ),
    },
    {
      key: 'amount',
      header: 'Сумма',
      width: 140,
      mobileLabel: 'Сумма:',
      render: (p) => <p className="text-sm font-bold text-text-main">{formatAmount(p.amount)} ₽</p>,
    },
    {
      key: 'status',
      header: 'Статус',
      width: 140,
      mobileLabel: 'Статус:',
      render: (p) => (
        <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'}>
          {STATUS_LABELS[p.status] ?? p.status}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Дата',
      width: 160,
      mobileLabel: 'Дата:',
      render: (p) => <p className="text-sm text-text-sub">{formatDate(p.paidAt ?? p.createdAt)}</p>,
    },
  ];

  const handlePay = (p: PaymentRecord) => {
    if (p.targetType && p.targetId) {
      setPayTarget({
        targetType: p.targetType as 'repairRequest' | 'certificate',
        targetId: p.targetId,
        amount: p.amount,
      });
      setPayModalOpen(true);
    }
  };

  const handlePayClose = () => {
    setPayModalOpen(false);
    setPayTarget(null);
    fetchPayments();
  };

  return (
    <PageContainer>
      <PageHeader>Платежи</PageHeader>

      {loading ? (
        <p className="text-sm text-text-sub">Загрузка...</p>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-base text-text-sub">У вас пока нет платежей</p>
        </div>
      ) : (
        <>
          {/* Pending payments (always cards) */}
          {pendingPayments.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-medium text-text-main">Ожидают оплаты</h3>
              {pendingPayments.map((p) => (
                <Card key={p.id} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-medium text-text-main">
                        {TARGET_LABELS[p.targetType ?? ''] ?? 'Платёж'}
                      </p>
                      <p className="text-sm text-text-sub">{formatDate(p.createdAt)}</p>
                    </div>
                    <Badge variant="warning">Ожидает оплаты</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-text-main">{formatAmount(p.amount)} ₽</span>
                    <Button
                      variant="primary"
                      onClick={() => handlePay(p)}
                    >
                      Оплатить
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Payment history */}
          {otherPayments.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium text-text-main">История платежей</h3>

              {/* Toolbar */}
              <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                <DataSearch value={search} onChange={setSearch} placeholder="Поиск" className="lg:w-[320px] flex-shrink-0" />
              </div>

              {/* ViewSwitcher — above data view */}
              <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />

              {view === 'table' ? (
                <DataGrid<PaymentRecord>
                  columns={paymentColumns}
                  data={filteredHistory}
                  keyExtractor={(p) => p.id}
                  emptyContent="Нет платежей"
                  sortKey={sortBy ?? undefined}
                  sortOrder={sortOrder ?? undefined}
                  onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
                  footer={
                    <div className="flex items-center justify-between w-full">
                      <span>Показано {filteredHistory.length} из {total}</span>
                      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                  }
                />
              ) : (
                <>
                  {filteredHistory.length === 0 ? (
                    <p className="text-sm text-text-sub text-center py-8">Нет платежей</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredHistory.map((p) => (
                        <Card key={p.id} padding="none" className="p-5 flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-base font-medium text-text-main">
                              {TARGET_LABELS[p.targetType ?? ''] ?? 'Платёж'}
                            </p>
                            <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'}>
                              {STATUS_LABELS[p.status] ?? p.status}
                            </Badge>
                          </div>
                          <span className="text-lg font-bold text-text-main">{formatAmount(p.amount)} ₽</span>
                          <p className="text-sm text-text-sub">{formatDate(p.paidAt ?? p.createdAt)}</p>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Pagination */}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
        </>
      )}

      {/* Payment modal */}
      {payTarget && (
        <PaymentModal
          open={payModalOpen}
          onClose={handlePayClose}
          targetType={payTarget.targetType}
          targetId={payTarget.targetId}
          amount={payTarget.amount}
        />
      )}
    </PageContainer>
  );
}
