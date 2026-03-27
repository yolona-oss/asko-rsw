'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { WithdrawModal } from '@/components/account/dealer/withdraw-modal';
import { paymentApi, type PaymentRecord } from '@/lib/api/payment';
import { dealerApi } from '@/lib/api/dealer';
import { useAppDispatch, useAppSelector } from '@/store';
import { getMyWithdraws } from '@/store/withdraw-slice';
import { formatAmount } from './constants';
import { WithdrawalHistory } from './withdrawal-history';
import { PaymentTable } from './payment-table';
import { PaymentCards } from './payment-cards';

export function DealerPayments() {
  const dispatch = useAppDispatch();
  const { withdrawals } = useAppSelector((s) => s.withdraw);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [view, setView] = useState('card');

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
            {loading ? '-' : `${formatAmount(pointsBalance)} ₽`}
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
      <WithdrawalHistory withdrawals={withdrawals} />

      {/* Payment history */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium text-text-main">История платежей</h3>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          <div className="flex-1 flex items-center gap-3">
            <div className="ml-auto flex-shrink-0 flex items-center gap-2">
              <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-text-sub">Загрузка...</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-text-sub">У вас пока нет платежей</p>
        ) : view === 'table' ? (
          <PaymentTable payments={payments} />
        ) : (
          <PaymentCards payments={payments} />
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
