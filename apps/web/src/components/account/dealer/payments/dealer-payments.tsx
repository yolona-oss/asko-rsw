'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Badge,
  Button,
  Card,
  DataToolbar,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { WithdrawModal } from '@/components/account/dealer/withdraw-modal';
import { paymentApi, type PaymentRecord } from '@/lib/api/payment';
import { dealerApi } from '@/lib/api/dealer';
import type { IPointsTransaction } from '@/lib/api/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { getMyWithdraws } from '@/store/withdraw-slice';
import { formatAmount, formatDate, POINTS_TX_LABELS, POINTS_TX_BADGE_VARIANT } from './constants';
import { WithdrawalHistory } from './withdrawal-history';
import { PaymentTable } from './payment-table';
import { PaymentCards } from './payment-cards';

export function DealerPayments() {
  const dispatch = useAppDispatch();
  const { withdrawals } = useAppSelector((s) => s.withdraw);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [pointsHistory, setPointsHistory] = useState<IPointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [view, setView] = useState('card');

  const fetchData = useCallback(async () => {
    try {
      const [paymentsRes, profileRes, pointsRes] = await Promise.all([
        paymentApi.getMyPayments({ limit: 50 }),
        dealerApi.getProfile(),
        dealerApi.getPointsHistory({ limit: 20 }),
      ]);
      setPayments(paymentsRes.data.data ?? []);
      setPaymentsTotal(paymentsRes.data.overallCount ?? 0);
      setPointsBalance(profileRes.data.profile?.pointsBalance ?? 0);
      setPointsHistory(pointsRes.data.data ?? []);
    } catch { /* non-critical */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    dispatch(getMyWithdraws());
  }, [dispatch, fetchData]);

  const handleWithdrawClose = () => {
    setWithdrawOpen(false);
    fetchData();
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
            {loading ? '-' : formatAmount(pointsBalance)}
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

      {/* Points history */}
      {pointsHistory.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-medium text-text-main">История баллов</h3>
          {pointsHistory.map((tx) => (
            <Card key={tx.id} className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-text-main">{tx.reason}</span>
                <span className="text-xs text-text-sub">{formatDate(tx.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-base font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-brand-red'}`}>
                  {tx.amount > 0 ? '+' : ''}{formatAmount(tx.amount)}
                </span>
                <Badge variant={POINTS_TX_BADGE_VARIANT[tx.type] ?? 'neutral'}>
                  {POINTS_TX_LABELS[tx.type] ?? tx.type}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Payment history */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium text-text-main">История платежей</h3>

        <DataToolbar
          viewSwitcher={<ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />}
        />

        {loading ? (
          <p className="text-sm text-text-sub">Загрузка...</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-text-sub">У вас пока нет платежей</p>
        ) : view === 'table' ? (
          <PaymentTable payments={payments} totalCount={paymentsTotal} />
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
