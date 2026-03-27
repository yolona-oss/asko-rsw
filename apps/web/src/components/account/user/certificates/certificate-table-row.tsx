'use client';

import { useCallback } from 'react';
import {
  Button,
  Badge,
  DataTableRow,
  DataTableCell,
} from '@asko/ui';
import { CertificateStatus } from '@asko/shared/client';
import type { ICertificate } from '@/lib/api/types';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, formatDate, formatDateLong } from './constants';

function useExportPdf(cert: ICertificate) {
  const device = cert.userDevice?.device;
  const deviceName = device?.name ?? 'Устройство';
  const brandModel = [device?.brand, device?.model].filter(Boolean).join(' ');
  const deviceDesc = device?.description
    ?? 'Устройство зарегистрировано и защищено расширенной гарантией ASKO.\nСертификат подтверждает право на обслуживание и ремонт.';
  const isActive = cert.status === CertificateStatus.ACTIVE;
  const durationMs = new Date(cert.expiresAt).getTime() - new Date(cert.issuedAt).getTime();
  const durationMonths = Math.round(durationMs / (1000 * 60 * 60 * 24 * 30));

  return useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Сертификат ${cert.certificateNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; padding: 40px; color: #323232; }
          .card { border: 1px solid #eaeaea; border-radius: 8px; padding: 24px; }
          .title { font-size: 32px; font-weight: 400; line-height: 1.12; margin-bottom: 8px; letter-spacing: -0.01em; }
          .title strong { font-weight: 500; }
          .desc { font-size: 14px; color: #979797; line-height: 1.3; margin-bottom: 24px; max-width: 527px; }
          .details { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
          .details p { font-size: 18px; line-height: 1.22; letter-spacing: -0.01em; }
          .details strong { font-weight: 500; }
          .status-line { display: flex; align-items: center; gap: 8px; font-size: 14px; margin-bottom: 8px; }
          .status-active { color: #108b00; font-weight: 500; }
          .warranty { font-size: 14px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="title">${deviceName} ${brandModel ? `<strong>${brandModel}</strong>` : ''}</div>
          <div class="desc">${deviceDesc.replace(/\n/g, '<br>')}</div>
          <div class="details">
            <p>Номер сертификата: <strong>${cert.certificateNumber}</strong></p>
            <p>Дата активации: <strong>${formatDate(cert.issuedAt)}</strong></p>
            <p>Срок действия: <strong>${durationMonths} месяцев</strong></p>
          </div>
          <div class="status-line">
            <span>Статус: <span class="${isActive ? 'status-active' : ''}">${STATUS_LABELS[cert.status] ?? cert.status}</span></span>
            <span style="color:#979797">Действителен до ${formatDateLong(cert.expiresAt)}</span>
          </div>
          ${isActive ? '<div class="warranty">Расширенная гарантия активна</div>' : ''}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [cert, deviceName, brandModel, deviceDesc, durationMonths, isActive]);
}

export function CertificateTableRow({ cert, onPay }: { cert: ICertificate; onPay?: (cert: ICertificate) => void }) {
  const isPendingPayment = cert.status === CertificateStatus.PENDING_PAYMENT;
  const device = cert.userDevice?.device;
  const deviceName = device ? `${device.name ?? ''} ${device.brand ?? ''} ${device.model ?? ''}`.trim() : 'Устройство';
  const exportPdf = useExportPdf(cert);

  return (
    <DataTableRow>
      <DataTableCell mobileLabel="Номер:" className="lg:w-[180px] lg:flex-shrink-0">
        <p className="text-sm font-medium text-text-main">{cert.certificateNumber}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Устройство:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main truncate">{deviceName}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Статус:" className="lg:w-[160px] lg:px-4">
        <Badge variant={STATUS_BADGE_VARIANT[cert.status] ?? 'neutral'}>
          {STATUS_LABELS[cert.status] ?? cert.status}
        </Badge>
      </DataTableCell>
      <DataTableCell mobileLabel="Выдан:" className="lg:w-[110px] lg:px-4">
        <p className="text-sm text-text-sub">{formatDate(cert.issuedAt)}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Истекает:" className="lg:w-[110px] lg:px-4">
        <p className="text-sm text-text-sub">{formatDate(cert.expiresAt)}</p>
      </DataTableCell>
      <DataTableCell className="lg:w-[220px] lg:flex-shrink-0 lg:text-right flex gap-2">
        {isPendingPayment && onPay && (
          <Button variant="primary" size="sm" onClick={() => onPay(cert)}>
            Оплатить
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={exportPdf}>
          PDF
        </Button>
      </DataTableCell>
    </DataTableRow>
  );
}
