'use client';

import { useState, useEffect } from 'react';
import { Badge, Card, Button } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { WithdrawModal } from '@/components/account/dealer/withdraw-modal';
import { paymentApi, type PaymentRecord } from '@/lib/api/payment';
import { dealerApi } from '@/lib/api/dealer';
import { useAppDispatch, useAppSelector } from '@/store';
import { getMyWithdraws } from '@/store/withdraw-slice';

const STATUS_LABELS: Record<string, string> = {
  paid: 'Оплачен',
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

const WITHDRAW_STATUS_LABELS: Record<string, string> = {
  pending: 'В обработке',
  approved: 'Выполнен',
  rejected: 'Отклонён',
};

const WITHDRAW_BADGE_VARIANT: Record<string, BadgeVariant> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
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

export function DealerPayments() {
  const dispatch = useAppDispatch();
  const { withdrawals } = useAppSelector((s) => s.withdraw);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [paymentsRes, profileRes] = await Promise.all([
          paymentApi.getMyPayments({ limit: 50 }),
          dealerApi.getProfile(),
        ]);
        setPayments(paymentsRes.data.data ?? []);
        setPointsBalance(profileRes.data?.pointsBalance ?? 0);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    dispatch(getMyWithdraws());
  }, [dispatch]);

  const handleWithdrawClose = () => {
    setWithdrawOpen(false);
    // Refresh data
    dealerApi.getProfile().then(({ data }) => setPointsBalance(data?.pointsBalance ?? 0));
    dispatch(getMyWithdraws());
  };

  return (
    <PageContainer>
      <PageHeader>Платежи</PageHeader>

      {/* Balance card */}
      <Card className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-text-sub">Баланс баллов</span>
          <span className="text-3xl lg:text-[48px] font-bold text-text-main leading-tight">
            {loading ? '—' : `${formatAmount(pointsBalance)} ₽`}
          </span>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setWithdrawOpen(true)}
          disabled={pointsBalance <= 0}
        >
          Вывести на карту
        </Button>
      </Card>

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-medium text-text-main">Запросы на вывод</h3>
          {withdrawals.map((w) => (
            <Card key={w.id} className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium text-text-main">{formatAmount(w.amount)} ₽</span>
                <span className="text-sm text-text-sub">{formatDate(w.requestedAt)}</span>
              </div>
              <Badge variant={WITHDRAW_BADGE_VARIANT[w.status] ?? 'neutral'}>
                {WITHDRAW_STATUS_LABELS[w.status] ?? w.status}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      {/* Payment history */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-medium text-text-main">История платежей</h3>
        {loading ? (
          <p className="text-sm text-text-sub">Загрузка...</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-text-sub">У вас пока нет платежей</p>
        ) : (
          payments.map((p) => (
            <Card key={p.id} className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <p className="text-base font-medium text-text-main">
                  {p.targetType === 'certificate' ? 'Сертификат' : 'Заявка на ремонт'}
                </p>
                <p className="text-sm text-text-sub">{formatDate(p.paidAt ?? p.createdAt)}</p>
                <span className="text-base font-bold text-text-main">{formatAmount(p.amount)} ₽</span>
              </div>
              <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'}>
                {STATUS_LABELS[p.status] ?? p.status}
              </Badge>
            </Card>
          ))
        )}
      </div>

      {/* Withdraw modal */}
      <WithdrawModal
        open={withdrawOpen}
        onClose={handleWithdrawClose}
        maxAmount={pointsBalance}
      />
    </PageContainer>
  );
}
