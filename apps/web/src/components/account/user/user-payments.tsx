'use client';

import { useState, useEffect } from 'react';
import { Badge, Card, Button } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { PaymentModal } from '@/components/account/user/payment-modal';
import { paymentApi, type PaymentRecord } from '@/lib/api/payment';

const STATUS_LABELS: Record<string, string> = {
  paid: 'Оплачен',
  pending: 'Ожидает оплаты',
  refunded: 'Возвращён',
  failed: 'Ошибка',
};

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  paid: 'success',
  pending: 'warning',
  refunded: 'error',
  failed: 'neutral',
};

const TARGET_LABELS: Record<string, string> = {
  repairRequest: 'Заявка на ремонт',
  certificate: 'Сертификат',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatAmount(amount: number) {
  return amount.toLocaleString('ru-RU');
}

export function UserPayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Payment modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<{ targetType: 'repairRequest' | 'certificate'; targetId: string; amount: number } | null>(null);

  async function fetchPayments() {
    try {
      const { data: result } = await paymentApi.getMyPayments({
        offset: page * pageSize,
        limit: pageSize,
      });
      setPayments(result.data ?? []);
      setTotal(result.overallCount ?? 0);
    } catch {
      // silently fail
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
          {/* Pending payments */}
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
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-medium text-text-main">История платежей</h3>
              {otherPayments.map((p) => (
                <Card key={p.id} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-base font-medium text-text-main">
                        {TARGET_LABELS[p.targetType ?? ''] ?? 'Платёж'}
                      </p>
                      <p className="text-sm text-text-sub">{formatDate(p.paidAt ?? p.createdAt)}</p>
                    </div>
                    <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </Badge>
                  </div>
                  <span className="text-lg font-bold text-text-main">{formatAmount(p.amount)} ₽</span>
                </Card>
              ))}
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
