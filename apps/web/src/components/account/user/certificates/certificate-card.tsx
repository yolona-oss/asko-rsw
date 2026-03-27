'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CertificateStatus } from '@asko/shared/client';
import { deviceApi } from '@/lib/api/device';
import type { ICertificate } from '@/lib/api/types';
import { STATUS_LABELS, formatDate, formatDateLong } from './constants';

function FileTextIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 13H8" />
      <path d="M16 17H8" />
      <path d="M16 13h-2" />
    </svg>
  );
}

export function CertificateCard({ cert, onPay }: { cert: ICertificate; onPay?: (cert: ICertificate) => void }) {
  const isActive = cert.status === CertificateStatus.ACTIVE;
  const isPendingPayment = cert.status === CertificateStatus.PENDING_PAYMENT;
  const device = cert.userDevice?.device;
  const deviceName = device?.name ?? 'Устройство';
  const brandModel = [device?.brand, device?.model].filter(Boolean).join(' ');
  const deviceDesc = device?.description
    ?? 'Устройство зарегистрировано и защищено расширенной гарантией ASKO.\nСертификат подтверждает право на обслуживание и ремонт.';

  const durationMs = new Date(cert.expiresAt).getTime() - new Date(cert.issuedAt).getTime();
  const durationMonths = Math.round(durationMs / (1000 * 60 * 60 * 24 * 30));

  const [deviceImageUrl, setDeviceImageUrl] = useState('/images/placeholder.webp');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!device?.id) return;
    deviceApi.getImages(device.id).then(({ data }) => {
      const images = Array.isArray(data) ? data : [];
      if (images.length > 0) {
        const img = images[0];
        const url = img.imageJson?.medium?.secure_url ?? img.imageJson?.original?.secure_url;
        if (url) setDeviceImageUrl(url);
      }
    }).catch(() => { });
  }, [device?.id]);

  const handleExportPdf = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;

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
          .card { border: 1px solid #eaeaea; border-radius: 8px; padding: 24px; min-height: 420px; }
          .title { font-size: 32px; font-weight: 400; line-height: 1.12; margin-bottom: 8px; letter-spacing: -0.01em; }
          .title strong { font-weight: 500; }
          .desc { font-size: 14px; color: #979797; line-height: 1.3; margin-bottom: 24px; max-width: 527px; }
          .row { display: flex; gap: 24px; }
          .left { flex: 1; min-width: 0; }
          .details { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
          .details p { font-size: 18px; line-height: 1.22; letter-spacing: -0.01em; }
          .details strong { font-weight: 500; }
          .status-line { display: flex; align-items: center; gap: 8px; font-size: 14px; margin-bottom: 8px; }
          .status-active { color: #108b00; font-weight: 500; }
          .warranty { font-size: 14px; }
          .device-img { width: 236px; height: auto; max-height: 332px; object-fit: contain; border-radius: 10px; flex-shrink: 0; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="title">${deviceName} ${brandModel ? `<strong>${brandModel}</strong>` : ''}</div>
          <div class="desc">${deviceDesc.replace(/\n/g, '<br>')}</div>
          <div class="row">
            <div class="left">
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
            <img class="device-img" src="${deviceImageUrl}" alt="${deviceName}" />
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for image to load before printing
    const img = printWindow.document.querySelector('img');
    if (img) {
      img.onload = () => { printWindow.print(); };
      img.onerror = () => { printWindow.print(); };
    } else {
      printWindow.print();
    }
  }, [cert, deviceName, brandModel, deviceDesc, durationMonths, isActive, deviceImageUrl]);

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden border border-border-light bg-white rounded-sm p-6 shadow-[0_10px_60px_0_rgba(226,236,249,0.5)]"
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
        {/* Left: details, status, image (mobile), actions */}
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
              className="w-full h-auto max-h-[448px] object-contain rounded-lg"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-3 mt-10 lg:mt-6">
            {isPendingPayment && onPay && (
              <button
                type="button"
                onClick={() => onPay(cert)}
                className="flex items-center justify-center gap-2 bg-brand-red text-white px-6 py-2.5 h-[46px] lg:h-auto text-sm font-medium cursor-pointer hover:bg-brand-red/90 transition-colors"
              >
                Оплатить {cert.price ? `${cert.price.toLocaleString('ru-RU')} ₽` : ''}
              </button>
            )}
            <button
              type="button"
              onClick={handleExportPdf}
              className="flex items-center justify-center gap-2 border border-slate-300 px-6 py-2.5 text-sm font-medium text-text-main cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <FileTextIcon />
              Скачать сертификат PDF
            </button>
          </div>
        </div>

        {/* Device image - desktop only, sidebar */}
        <div className="hidden lg:flex flex-shrink-0 w-[236px] items-start">
          <img
            src={deviceImageUrl}
            alt={deviceName}
            className="w-full h-auto max-h-[332px] object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
