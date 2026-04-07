'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ContextMenuArea, buildCardMenuItems } from '@asko/ui';
import type { DropdownMenuEntry } from '@asko/ui';
import { CertificateStatus } from '@asko/shared/client';
import { useClickHandlers } from '@/hooks/use-click-handlers';
import { deviceApi } from '@/lib/api/device';
import type { ICertificate } from '@/lib/api/types';
import { getPlaceholderSrc } from '@/lib/placeholders';
import { STATUS_LABELS, formatDate, formatDateLong } from './constants';
import { getImageUrl } from '@/lib/image-url';

export function CertificateCard({
  cert,
  onPay,
  onExportPdf,
  onClick,
}: {
  cert: ICertificate;
  onPay?: (cert: ICertificate) => void;
  onExportPdf?: (cert: ICertificate) => void;
  onClick?: () => void;
}) {
  const { handleClick } = useClickHandlers(onClick);
  const isActive = cert.status === CertificateStatus.ACTIVE;
  const isPendingPayment = cert.status === CertificateStatus.PENDING_PAYMENT;
  const device = cert.userDevice?.device;
  const deviceName = device?.name ?? 'Устройство';
  const brandModel = [device?.brand, device?.model].filter(Boolean).join(' ');
  const deviceDesc = device?.description
    ?? 'Устройство зарегистрировано и защищено расширенной гарантией ASKO.\nСертификат подтверждает право на обслуживание и ремонт.';

  const durationMs = new Date(cert.expiresAt).getTime() - new Date(cert.issuedAt).getTime();
  const durationMonths = Math.round(durationMs / (1000 * 60 * 60 * 24 * 30));

  const [deviceImageUrl, setDeviceImageUrl] = useState(() => getPlaceholderSrc('device', device?.id));
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!device?.id) return;
    deviceApi.getImages(device.id).then(({ data }) => {
      const images = Array.isArray(data) ? data : [];
      if (images.length > 0) {
        const img = images[0];
        const url = getImageUrl(img, 'medium')
        if (url) setDeviceImageUrl(url);
      }
    }).catch(() => { });
  }, [device?.id]);

  const customItems: DropdownMenuEntry[] = [];
  if (isPendingPayment && onPay) {
    customItems.push({ key: 'pay', label: 'Оплатить', onClick: () => onPay(cert) });
  }
  if (onExportPdf) {
    customItems.push({ key: 'pdf', label: 'Скачать PDF', onClick: () => onExportPdf(cert) });
  }
  const menuItems = buildCardMenuItems(onClick, undefined, customItems);

  return (
    <ContextMenuArea items={menuItems}>
      <div
        ref={cardRef}
        className={`relative overflow-hidden border border-border-light bg-white p-6 shadow-[0_10px_60px_0_rgba(226,236,249,0.5)]${onClick ? ' cursor-pointer' : ''}`}
        onClick={handleClick}
      >
        {/* Title + description - full width */}
        <div className="flex flex-col gap-2">
          <h2 className="text-[32px] leading-[36px] text-text-main tracking-tight">
            {deviceName}{' '}
            {brandModel && <span className="font-medium">{brandModel}</span>}
          </h2>
          <p className="text-sm leading-[18px] text-text-sub lg:max-w-[527px] whitespace-pre-line">
            {deviceDesc}
          </p>
        </div>

        {/* Details + image row */}
        <div className="flex flex-col lg:flex-row gap-6 mt-8 lg:mt-6">
          {/* Left: details, status, image (mobile) */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Certificate details */}
            <div className="flex flex-col gap-2">
              <p className="text-lg text-text-main tracking-tight">
                Номер сертификата: <span className="font-medium">{cert.certificateNumber}</span>
              </p>
              <p className="text-lg text-text-main tracking-tight">
                Дата активации: <span className="font-medium">{formatDate(cert.issuedAt)}</span>
              </p>
              <p className="text-lg text-text-main tracking-tight">
                Срок действия: <span className="font-medium">{durationMonths} месяцев</span>
              </p>
            </div>

            {/* Status line */}
            <div className="flex flex-col gap-2 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <span>
                  Статус:{' '}
                  <span className={
                    isActive ? 'text-[#108b00] font-medium'
                      : isPendingPayment ? 'text-orange-600 font-medium'
                        : 'text-text-sub font-medium'
                  }>
                    {STATUS_LABELS[cert.status] ?? cert.status}
                  </span>
                </span>
                <span className="text-text-sub">
                  Действителен до {formatDateLong(cert.expiresAt)}
                </span>
              </div>
              {isActive && <p className="text-sm text-text-main">Расширенная гарантия активна</p>}
            </div>

            {/* Device image - mobile only, between status and actions */}
            <div className="lg:hidden mt-7">
              <img
                src={deviceImageUrl}
                alt={deviceName}
                className="w-full h-auto max-h-[448px] object-contain"
              />
            </div>
          </div>

          {/* Device image - desktop only, sidebar */}
          <div className="hidden lg:flex flex-shrink-0 w-[236px] items-start">
            <img
              src={deviceImageUrl}
              alt={deviceName}
              className="w-full h-auto max-h-[332px] object-contain"
            />
          </div>
        </div>
      </div>
    </ContextMenuArea>
  );
}
