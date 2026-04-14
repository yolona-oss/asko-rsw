'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge, Modal, DetailRow, DetailSection, SkeletonBlock } from '@asko/ui';
import type { PaymentRecord } from '@/lib/api/payment';
import { paymentApi } from '@/lib/api/payment';
import { repairRequestApi } from '@/lib/api/repair-request';
import { certificateApi } from '@/lib/api/certificate';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, PROVIDER_LABELS, TARGET_TYPE_LABELS } from './constants';
import { formatDateFull, formatAmount, payerName } from './utils';
import { PaymentSummary } from '@/components/account/shared/payment-summary';
import { PaymentTransactionList } from '@/components/account/shared/payment-transaction-list';

export function PaymentDetailModal({
  payment,
  groupPayments,
  open,
  onClose,
  onConfirm,
}: {
  payment: PaymentRecord | null;
  groupPayments?: PaymentRecord[];
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}) {
  const [target, setTarget] = useState<any>(null);
  const [targetLoading, setTargetLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [cashCode, setCashCode] = useState('');
  const [cashAmount, setCashAmount] = useState('');

  useEffect(() => {
    if (!open || !payment?.targetId || !payment?.targetType) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTarget(null);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargetLoading(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
          <DetailRow
            label="Сумма"
            value={
              <Badge
                variant={payment.status === 'refunded' ? 'error' : payment.status === 'partially_refunded' || payment.status === 'pending' ? 'warning' : 'success'}
                className="text-xs"
              >
                {formatAmount(payment.amount)} ₽
              </Badge>
            }
          />
          {(payment as any).refundedAmount > 0 && (
            <DetailRow
              label="Возвращено"
              value={
                <span className="text-sm font-medium text-error">{formatAmount((payment as any).refundedAmount)} ₽</span>
              }
            />
          )}
          <DetailRow label="Валюта" value={payment.currency?.toUpperCase() ?? 'RUB'} />
          <DetailRow label="Способ оплаты" value={PROVIDER_LABELS[payment.provider ?? ''] ?? payment.provider ?? '-'} />
          {payment.providerPaymentId && <DetailRow label="ID провайдера" value={payment.providerPaymentId} />}
          <DetailRow label="Создан" value={formatDateFull(payment.createdAt)} />
          {payment.paidAt && <DetailRow label="Оплачен" value={formatDateFull(payment.paidAt)} />}

          {payment.user && (
            <DetailSection label="Плательщик" summary={payerName(payment.user)}>
              <DetailRow label="Имя" value={payerName(payment.user)} />
              {payment.user.email && <DetailRow label="Email" value={payment.user.email} />}
              {payment.user.phone && <DetailRow label="Телефон" value={payment.user.phone} />}
            </DetailSection>
          )}
          {!payment.user && <DetailRow label="Плательщик" value="-" />}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-text-main">
            {TARGET_TYPE_LABELS[payment.targetType] ?? 'Назначение платежа'}
          </h3>

          {targetLoading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-5" />)}</div>
          ) : !target ? (
            <p className="text-sm text-text-sub">ID: {payment.targetId}</p>
          ) : payment.targetType === 'repairRequest' ? (
            <div className="flex flex-col">
              <DetailSection label="Заявка на ремонт" summary={`#${target.id?.slice(0, 8)} - ${target.status ?? '-'}`}>
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
              </DetailSection>
            </div>
          ) : payment.targetType === 'certificate' ? (
            <div className="flex flex-col">
              <DetailSection label="Сертификат" summary={target.certificateNumber ?? '-'}>
                <DetailRow label="Номер сертификата" value={target.certificateNumber ?? '-'} />
                <DetailRow label="Статус" value={target.status ?? '-'} />
                {target.userDevice?.device?.name && <DetailRow label="Устройство" value={target.userDevice.device.name} />}
                {target.issuedAt && <DetailRow label="Выдан" value={formatDateFull(target.issuedAt)} />}
                {target.expiresAt && <DetailRow label="Истекает" value={formatDateFull(target.expiresAt)} />}
                {target.dealer?.companyName && <DetailRow label="Дилер" value={target.dealer.companyName} />}
                {target.price != null && <DetailRow label="Стоимость" value={`${formatAmount(target.price)} ₽`} />}
              </DetailSection>
            </div>
          ) : (
            <div className="flex flex-col">
              <DetailRow label="ID" value={payment.targetId} />
            </div>
          )}
        </div>

        {groupPayments && groupPayments.length > 1 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-text-main">
              Все платежи по назначению ({groupPayments.length})
            </h3>
            <PaymentSummary payments={groupPayments} />
            <PaymentTransactionList payments={groupPayments} statusLabels={STATUS_LABELS} />
          </div>
        )}

        {payment.provider === 'cash' && payment.status === 'pending' && (
          <div className="flex flex-col gap-3 border-t border-border-divider pt-4">
            <h3 className="text-sm font-bold text-text-main">Подтверждение наличных</h3>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-text-sub">Код подтверждения от клиента</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={cashCode}
                onChange={(e) => setCashCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-значный код"
                className="w-full px-3 py-2 text-sm border border-border-light bg-surface text-text-main placeholder:text-text-sub focus:outline-none focus:border-brand-red"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-text-sub">Полученная сумма (₽)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="Введите сумму"
                className="w-full px-3 py-2 text-sm border border-border-light bg-surface text-text-main placeholder:text-text-sub focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>
        )}

        {confirmError && <p className="text-sm text-error">{confirmError}</p>}

        <div className="flex items-center justify-end gap-3">
          {payment.provider === 'cash' && payment.status === 'pending' && (
            <button
              type="button"
              disabled={confirming || cashCode.length !== 6 || !cashAmount}
              onClick={async () => {
                setConfirming(true);
                setConfirmError(null);
                try {
                  await paymentApi.confirmCashPayment(payment.id, cashCode, Number(cashAmount));
                  setCashCode('');
                  setCashAmount('');
                  onConfirm?.();
                } catch (e: any) {
                  setConfirmError(e?.response?.data?.message ?? 'Ошибка подтверждения');
                } finally {
                  setConfirming(false);
                }
              }}
              className="px-5 py-2 text-sm font-medium bg-success text-text-on-dark hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {confirming ? 'Подтверждение...' : 'Подтвердить получение наличных'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium border border-border-light text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Modal>
  );
}
