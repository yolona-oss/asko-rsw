'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAccount } from '@/components/account/layout/provider';
import { getGreeting, displayName } from '@/lib/account';
import { Card, Button, Modal } from '@asko/ui';
import { X } from 'lucide-react';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { CTABanner } from '@/components/account/layout/cta-banner';
import { PaymentModal } from '@/components/account/payments/user/payment-modal';
import { repairRequestApi } from '@/lib/api/repair-request';
import { certificateApi } from '@/lib/api/certificate';
import { paymentApi, type PaymentRecord } from '@/lib/api/payment';
import { RepairRequestStatus } from '@asko/shared/client';
import { TARGET_LABELS, pluralPayments, formatAmount, formatDate } from './constants';
import type { RequestSummary } from './types';

const STATUS_LABELS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'В обработке',
  [RepairRequestStatus.PAID]: 'Оплачена',
  [RepairRequestStatus.ASSIGNED]: 'Назначен мастер',
  [RepairRequestStatus.ACCEPTED]: 'Мастер выехал',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Завершается',
  [RepairRequestStatus.COMPLETED]: 'Завершена',
  [RepairRequestStatus.CANCELLED]: 'Отменена',
  [RepairRequestStatus.REFUSED]: 'Отказ мастера',
  [RepairRequestStatus.REFUND_REQUESTED]: 'Запрос возврата',
  [RepairRequestStatus.REFUNDED]: 'Возврат',
};

const STATUS_COLOR: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'bg-warning',
  [RepairRequestStatus.PAID]: 'bg-warning',
  [RepairRequestStatus.ASSIGNED]: 'bg-info',
  [RepairRequestStatus.ACCEPTED]: 'bg-info',
  [RepairRequestStatus.IN_PROGRESS]: 'bg-info',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'bg-info',
  [RepairRequestStatus.COMPLETED]: 'bg-success',
  [RepairRequestStatus.CANCELLED]: 'bg-text-muted',
  [RepairRequestStatus.REFUSED]: 'bg-error',
  [RepairRequestStatus.REFUND_REQUESTED]: 'bg-warning',
  [RepairRequestStatus.REFUNDED]: 'bg-text-muted',
};

export function UserDashboard() {
  const { user } = useAccount();
  const greeting = getGreeting();

  const [requestsCount, setRequestsCount] = useState<number>(0);
  const [certsCount, setCertsCount] = useState<number>(0);
  const [lastRequest, setLastRequest] = useState<RequestSummary | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment modals
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectionOpen, setSelectionOpen] = useState(false);

  const fetchPendingPayments = useCallback(async () => {
    try {
      const { data: result } = await paymentApi.getMyPayments({ status: 'pending', limit: 50 });
      setPendingPayments(result.data ?? []);
    } catch (err: any) {
      console.error(`Cannot retrive payments: `, err)
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [reqRes, certRes] = await Promise.all([
          repairRequestApi.getMy({ page: 1, limit: 1 }),
          certificateApi.getMy(),
          fetchPendingPayments(),
        ]);

        const reqData = reqRes.data;
        setRequestsCount(reqData.overallCount ?? 0);
        if (reqData.data?.length > 0) {
          const r = reqData.data[0];
          const addr = (r as any).address;
          const addrStr = addr ? [addr.city, addr.street, addr.house].filter(Boolean).join(', ') : '';
          setLastRequest({
            id: r.id,
            status: r.status as RepairRequestStatus,
            deviceName: (r as any).userDevice?.device?.name ?? 'Устройство',
            address: addrStr,
          });
        }

        const certs = certRes.data ?? [];
        setCertsCount(certs.filter((c: any) => c.status === 'active').length);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [fetchPendingPayments]);

  const pendingTotal = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = pendingPayments.length;

  const handlePayClick = () => {
    if (pendingCount === 1) {
      setSelectedPayment(pendingPayments[0]);
      setPaymentModalOpen(true);
    } else if (pendingCount > 1) {
      setSelectionOpen(true);
    }
  };

  const handleSelectPayment = (p: PaymentRecord) => {
    setSelectedPayment(p);
    setSelectionOpen(false);
    setPaymentModalOpen(true);
  };

  const handlePaymentClose = () => {
    setPaymentModalOpen(false);
    setSelectedPayment(null);
    fetchPendingPayments();
  };

  return (
    <PageContainer>
      {/* Greeting */}
      <PageHeader size="large">
        {greeting},<br />
        {user && displayName(user)}!
      </PageHeader>

      {/* Stat cards - mobile stacked, desktop 3-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Мои заявки */}
        <Card className="flex flex-row items-center justify-between gap-4 lg:flex-col lg:items-start lg:gap-2">
          <div className="flex flex-col gap-2">
            <span className="text-[24px] font-normal leading-[28px] tracking-[-0.01em] text-text-main">
              Мои заявки:
            </span>
            <span className="text-[82px] font-medium leading-[86px] tracking-[-0.01em] text-text-main">
              {loading ? '-' : requestsCount}
            </span>
          </div>
          {lastRequest && (
            <div className="mt-8 flex flex-col gap-4 lg:hidden">
              <div className="flex flex-col gap-1">
                <p className="text-[24px] font-medium leading-[28px] tracking-[-0.01em] text-text-main">
                  Последняя заявка:
                </p>
                <p className="text-[18px] font-normal leading-[22px] tracking-[-0.01em] text-text-main">
                  {lastRequest.deviceName}
                </p>
              </div>
              <Link
                href="/account/requests"
                className="text-[14px] font-medium leading-[18px] tracking-[-0.01em] text-text-main"
              >
                Смотреть все заявки...
              </Link>
            </div>
          )}
        </Card>

        {/* Активные сертификаты */}
        <Card className="flex flex-row items-center justify-between gap-4 lg:flex-col lg:items-start lg:gap-2">
          <span className="text-[24px] font-normal leading-[28px] tracking-[-0.24px] text-text-main whitespace-pre-wrap">
            {'Активные\nсертификаты:'}
          </span>
          <span className="text-[82px] font-normal leading-[86px] tracking-[-0.82px] text-text-main">
            {loading ? '-' : certsCount}
          </span>
        </Card>

        {/* Счет на оплату */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[24px] font-medium leading-[28px] text-text-sub">Счет на оплату:</span>
            <span className="text-[24px] font-bold leading-[28px] text-text-main">
              {loading ? '-' : pendingCount === 0 ? '-' : pendingCount === 1
                ? `${formatAmount(pendingTotal)} ₽`
                : `${formatAmount(pendingTotal)}₽ x ${pendingCount} ${pluralPayments(pendingCount)}`
              }
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[14px] leading-[18px] font-bold text-text-main">Статус:</span>
            <span className="text-[14px] leading-[18px] text-text-sub">
              {pendingCount === 0 ? 'Нет активных счетов' : pendingCount === 1 ? 'Ожидает оплаты' : 'Ожидают оплаты'}
            </span>
          </div>
          <Button
            variant="primary"
            className="mt-auto w-full lg:w-fit"
            disabled={pendingCount === 0}
            onClick={handlePayClick}
          >
            Оплатить
          </Button>
        </Card>
      </div>

      {/* Last request card - desktop only */}
      {
        lastRequest && (
          <div className="hidden lg:block">
            <Card className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <p className="text-[24px] font-bold leading-[28px] text-text-main">Последняя заявка:</p>
                <p className="text-[14px] leading-[18px] text-text-main">{lastRequest.deviceName}</p>
                {lastRequest.address && (
                  <p className="text-[14px] leading-[18px] text-text-sub">{lastRequest.address}</p>
                )}
                <p className="text-[14px] leading-[18px] text-text-sub">
                  {STATUS_LABELS[lastRequest.status] ?? lastRequest.status}
                </p>
                <Link
                  href="/account/requests"
                  className="text-[14px] leading-[18px] text-text-sub underline mt-2"
                >
                  Смотреть все заявки...
                </Link>
              </div>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 ${STATUS_COLOR[lastRequest.status] ?? 'bg-text-muted'}`} />
            </Card>
          </div>
        )
      }

      {/* CTA Banner */}
      <CTABanner
        title={<>Возникла проблема<br />с техникой?</>}
        description="Создайте заявку, и наш специалист свяжется с вами для диагностики и согласования ремонта."
        linkHref="/account/requests/create"
        linkLabel="Создать заявку"
      />

      {/* Payment selection modal (multiple pending) */}
      <Modal open={selectionOpen} onClose={() => setSelectionOpen(false)} className="w-full max-w-[500px] p-6 lg:p-8">
        <button
          type="button"
          onClick={() => setSelectionOpen(false)}
          className="absolute top-4 right-4 text-text-sub hover:text-text-main"
          aria-label="Закрыть"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-text-main mb-4">Выберите платёж</h2>
        <div className="flex flex-col gap-3">
          {pendingPayments.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPayment(p)}
              className="flex items-center justify-between gap-4 p-4 border border-border-light hover:border-text-sub transition-colors cursor-pointer text-left"
            >
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium text-text-main">
                  {TARGET_LABELS[p.targetType ?? ''] ?? 'Платёж'}
                </span>
                <span className="text-[14px] leading-[18px] text-text-sub">{formatDate(p.createdAt)}</span>
              </div>
              <span className="text-lg font-bold text-text-main flex-shrink-0">
                {formatAmount(p.amount)} ₽
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Payment modal */}
      {
        selectedPayment && (
          <PaymentModal
            open={paymentModalOpen}
            onClose={handlePaymentClose}
            targetType={(selectedPayment.targetType as 'repairRequest' | 'certificate') ?? 'repairRequest'}
            targetId={selectedPayment.targetId ?? selectedPayment.id}
            amount={selectedPayment.amount}
          />
        )
      }
    </PageContainer >
  );
}
