'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge, Modal, DetailRow, DetailSection } from '@asko/ui';
import type { PaymentRecord } from '@/lib/api/payment';
import { repairRequestApi } from '@/lib/api/repair-request';
import { certificateApi } from '@/lib/api/certificate';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, PROVIDER_LABELS, TARGET_TYPE_LABELS } from './constants';
import { formatDateFull, formatAmount, payerName } from './utils';

export function PaymentDetailModal({
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
            <p className="text-sm text-text-sub">Загрузка...</p>
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
