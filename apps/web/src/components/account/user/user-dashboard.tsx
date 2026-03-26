'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAccount } from '@/components/account/account-provider';
import { getGreeting, displayName } from '@/lib/account';
import { Card, Button, Modal } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { CTABanner } from '@/components/account/cta-banner';
import { PaymentModal } from '@/components/account/user/payment-modal';
import { repairRequestApi } from '@/lib/api/repair-request';
import { certificateApi } from '@/lib/api/certificate';
import { paymentApi, type PaymentRecord } from '@/lib/api/payment';
import type { RepairRequestStatus } from '@asko/shared/client';

const TARGET_LABELS: Record<string, string> = {
  repairRequest: 'Заявка на ремонт',
  certificate: 'Сертификат',
};

function pluralPayments(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'платежей';
  if (mod10 === 1) return 'платёж';
  if (mod10 >= 2 && mod10 <= 4) return 'платежа';
  return 'платежей';
}

function formatAmount(amount: number) {
  return amount.toLocaleString('ru-RU');
}

function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function StatCard({
  title,
  value,
  children,
}: {
  title: string;
  value?: string | number;
  children?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <span className="text-base font-medium leading-5 text-text-sub">{title}</span>
      {value !== undefined && (
        <span className="text-[56px] lg:text-[72px] font-normal leading-none text-text-main">
          {value}
        </span>
      )}
      {children}
    </Card>
  );
}

interface RequestSummary {
  id: string;
  description: string;
  status: RepairRequestStatus;
}

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
          repairRequestApi.getMy({ offset: 1, limit: 1 }),
          certificateApi.getMy(),
          fetchPendingPayments(),
        ]);

        const reqData = reqRes.data;
        setRequestsCount(reqData.overallCount ?? 0);
        if (reqData.data?.length > 0) {
          const r = reqData.data[0];
          setLastRequest({ id: r.id, description: r.description, status: r.status as RepairRequestStatus });
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
        <StatCard title="Мои заявки:" value={loading ? '-' : requestsCount}>
          {lastRequest && (
            <div className="mt-auto pt-4 flex flex-col gap-1">
              <p className="text-sm font-bold text-text-main">Последняя заявка:</p>
              <p className="text-sm text-text-main">
                {lastRequest.description}
              </p>
              <Link
                href="/account/requests"
                className="text-sm text-text-sub underline mt-1 lg:hidden"
              >
                Смотреть все заявки...
              </Link>
            </div>
          )}
        </StatCard>

        {/* Активные сертификаты */}
        <StatCard title="Активные сертификаты:">
          <div className="flex items-center justify-end">
            <span className="text-[56px] lg:text-[72px] font-normal leading-none text-text-main">
              {loading ? '-' : certsCount}
            </span>
          </div>
        </StatCard>

        {/* Счет на оплату */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-medium text-text-sub">Счет на оплату:</span>
            <span className="text-2xl font-bold text-text-main">
              {loading ? '-' : pendingCount === 0 ? '-' : pendingCount === 1
                ? `${formatAmount(pendingTotal)} ₽`
                : `${formatAmount(pendingTotal)}₽ x ${pendingCount} ${pluralPayments(pendingCount)}`
              }
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-text-main">Статус:</span>
            <span className="text-sm text-text-sub">
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
      {lastRequest && (
        <div className="hidden lg:block">
          <Card className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-lg font-bold text-text-main">Последняя заявка:</p>
              <p className="text-base text-text-main">
                {lastRequest.description}
              </p>
              <Link
                href="/account/requests"
                className="text-sm text-text-sub underline mt-2"
              >
                Смотреть все заявки...
              </Link>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#4ADE80] flex-shrink-0" />
          </Card>
        </div>
      )}

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
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
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
                <span className="text-sm text-text-sub">{formatDate(p.createdAt)}</span>
              </div>
              <span className="text-lg font-bold text-text-main flex-shrink-0">
                {formatAmount(p.amount)} ₽
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Payment modal */}
      {selectedPayment && (
        <PaymentModal
          open={paymentModalOpen}
          onClose={handlePaymentClose}
          targetType={(selectedPayment.targetType as 'repairRequest' | 'certificate') ?? 'repairRequest'}
          targetId={selectedPayment.targetId ?? selectedPayment.id}
          amount={selectedPayment.amount}
        />
      )}
    </PageContainer>
  );
}
