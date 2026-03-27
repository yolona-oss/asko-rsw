'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Badge,
  Card,
  Button,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  DataTableFooter,
  DataSearch,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
} from '@asko/ui';
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
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Payment modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<{ targetType: 'repairRequest' | 'certificate'; targetId: string; amount: number } | null>(null);

  // View state
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');

  async function fetchPayments() {
    try {
      const { data: result } = await paymentApi.getMyPayments({
        offset: page * pageSize,
        limit: pageSize,
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
  }, [page]);

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
                <div className="flex-1 flex items-center gap-3">
                  <div className="ml-auto flex-shrink-0 flex items-center gap-2">
                    <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
                  </div>
                </div>
              </div>

              {view === 'table' ? (
                <DataTable>
                  <DataTableHeader>
                    <div className="w-[120px] flex-shrink-0">ID</div>
                    <div className="flex-1 px-4">Тип</div>
                    <div className="w-[140px] px-4">Сумма</div>
                    <div className="w-[140px] px-4">Статус</div>
                    <div className="w-[160px] px-4">Дата</div>
                  </DataTableHeader>

                  {filteredHistory.length === 0 ? (
                    <DataTableEmpty>Нет платежей</DataTableEmpty>
                  ) : (
                    filteredHistory.map((p) => (
                      <DataTableRow key={p.id}>
                        <DataTableCell mobileLabel="ID:" className="lg:w-[120px] lg:flex-shrink-0">
                          <p className="text-sm text-text-sub font-mono truncate">{p.id.slice(0, 8)}</p>
                        </DataTableCell>
                        <DataTableCell mobileLabel="Тип:" className="lg:flex-1 lg:px-4">
                          <p className="text-sm font-medium text-text-main">
                            {TARGET_LABELS[p.targetType ?? ''] ?? 'Платёж'}
                          </p>
                        </DataTableCell>
                        <DataTableCell mobileLabel="Сумма:" className="lg:w-[140px] lg:px-4">
                          <p className="text-sm font-bold text-text-main">{formatAmount(p.amount)} ₽</p>
                        </DataTableCell>
                        <DataTableCell mobileLabel="Статус:" className="lg:w-[140px] lg:px-4">
                          <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'}>
                            {STATUS_LABELS[p.status] ?? p.status}
                          </Badge>
                        </DataTableCell>
                        <DataTableCell mobileLabel="Дата:" className="lg:w-[160px] lg:px-4">
                          <p className="text-sm text-text-sub">{formatDate(p.paidAt ?? p.createdAt)}</p>
                        </DataTableCell>
                      </DataTableRow>
                    ))
                  )}

                  <DataTableFooter>
                    Показано {filteredHistory.length} из {otherPayments.length}
                  </DataTableFooter>
                </DataTable>
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-text-sub">
              <span>Показаны платежи {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} из {total}</span>
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
