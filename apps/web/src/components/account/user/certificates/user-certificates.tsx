'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Badge,
  Button,
  DataGrid,
  DataToolbar,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
} from '@asko/ui';
import type { DataGridColumn, SortOrder, DropdownMenuEntry } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { CTABanner } from '@/components/account/cta-banner';
import { PaymentModal } from '@/components/account/user/payment-modal';
import { certificateApi } from '@/lib/api/certificate';
import { userDeviceApi } from '@/lib/api/user-device';
import { CertificateStatus } from '@asko/shared/client';
import type { ICertificate } from '@/lib/api/types';
import { CertificateCard } from './certificate-card';
import { DeviceSlider } from './device-slider';
import { AddDeviceForm } from './add-device-form';
import { AddCertificateForm } from './add-certificate-form';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, formatDate, formatDateLong } from './constants';
import type { UserDevice } from './types';

const PAGE_SIZE = 20;

export function UserCertificates() {
  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [paymentCert, setPaymentCert] = useState<ICertificate | null>(null);
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  const handlePay = (cert: ICertificate) => {
    setPaymentCert(cert);
  };

  const handlePaymentClose = () => {
    setPaymentCert(null);
    fetchCertificates();
  };

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const { data } = await certificateApi.getMy();
      setCertificates(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      const { data } = await userDeviceApi.getMy();
      setDevices(data);
    } catch {
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
    fetchDevices();
  }, []);

  const filteredCertificates = useMemo(() => {
    if (!search) return certificates;
    const q = search.toLowerCase();
    return certificates.filter((cert) => {
      const certNum = (cert.certificateNumber ?? '').toLowerCase();
      const device = cert.userDevice?.device;
      const deviceName = (device?.name ?? '').toLowerCase();
      const brand = (device?.brand ?? '').toLowerCase();
      const model = (device?.model ?? '').toLowerCase();
      return certNum.includes(q) || deviceName.includes(q) || brand.includes(q) || model.includes(q);
    });
  }, [certificates, search]);

  // Reset page on search change
  useEffect(() => { setPage(1); }, [search]);

  const sortedCertificates = useMemo(() => {
    if (!sortBy) return filteredCertificates;
    return [...filteredCertificates].sort((a, b) => {
      const av = (a as any)[sortBy] ?? '';
      const bv = (b as any)[sortBy] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [filteredCertificates, sortBy, sortOrder]);

  const totalPages = Math.ceil(sortedCertificates.length / PAGE_SIZE);
  const paginatedCertificates = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedCertificates.slice(start, start + PAGE_SIZE);
  }, [sortedCertificates, page]);

  const exportPdf = useCallback((cert: ICertificate) => {
    const device = cert.userDevice?.device;
    const deviceName = device?.name ?? 'Устройство';
    const brandModel = [device?.brand, device?.model].filter(Boolean).join(' ');
    const deviceDesc = device?.description
      ?? 'Устройство зарегистрировано и защищено расширенной гарантией ASKO.\nСертификат подтверждает право на обслуживание и ремонт.';
    const isActive = cert.status === CertificateStatus.ACTIVE;
    const durationMs = new Date(cert.expiresAt).getTime() - new Date(cert.issuedAt).getTime();
    const durationMonths = Math.round(durationMs / (1000 * 60 * 60 * 24 * 30));

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
  }, []);

  const certificateColumns: DataGridColumn<ICertificate>[] = [
    {
      key: 'number',
      header: 'Номер',
      width: 180,
      mobileLabel: 'Номер:',
      render: (cert) => <p className="text-sm font-medium text-text-main">{cert.certificateNumber}</p>,
    },
    {
      key: 'device',
      header: 'Устройство',
      mobileLabel: 'Устройство:',
      render: (cert) => {
        const device = cert.userDevice?.device;
        const deviceName = device ? `${device.name ?? ''} ${device.brand ?? ''} ${device.model ?? ''}`.trim() : 'Устройство';
        return <p className="text-sm text-text-main truncate">{deviceName}</p>;
      },
    },
    {
      key: 'status',
      header: 'Статус',
      width: 160,
      mobileLabel: 'Статус:',
      render: (cert) => (
        <Badge variant={STATUS_BADGE_VARIANT[cert.status] ?? 'neutral'}>
          {STATUS_LABELS[cert.status] ?? cert.status}
        </Badge>
      ),
    },
    {
      key: 'issuedAt',
      header: 'Выдан',
      width: 110,
      mobileLabel: 'Выдан:',
      render: (cert) => <p className="text-sm text-text-sub">{formatDate(cert.issuedAt)}</p>,
    },
    {
      key: 'expiresAt',
      header: 'Истекает',
      width: 110,
      mobileLabel: 'Истекает:',
      render: (cert) => <p className="text-sm text-text-sub">{formatDate(cert.expiresAt)}</p>,
    },
  ];

  return (
    <PageContainer>
      <PageHeader>Мои сертификаты</PageHeader>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Поиск по номеру или устройству" }}
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
            Добавить сертификат
          </Button>
        }
      />

      {/* ViewSwitcher — above data view */}
      <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />

      {view === 'card' ? (
        <>
          <DeviceSlider devices={devices} loading={loadingDevices} />

          {/* Certificates + CTA banner row */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Certificate cards */}
            <div className="flex flex-col gap-6 flex-1 min-w-0">
              {loading ? (
                <p className="text-sm text-text-sub">Загрузка...</p>
              ) : paginatedCertificates.length === 0 ? (
                <p className="text-sm text-text-sub">У вас нет сертификатов</p>
              ) : (
                <>
                  {paginatedCertificates.map((cert) => (
                    <CertificateCard key={cert.id} cert={cert} onPay={handlePay} onExportPdf={exportPdf} />
                  ))}
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
                </>
              )}
            </div>

            {/* CTA Banner - sidebar */}
            <CTABanner
              variant="compact"
              className="hidden lg:flex lg:w-[262px] lg:flex-shrink-0 lg:self-start"
              title={<>Возникла проблема с устройством?</>}
              description="Создайте заявку, и специалист сервисного центра ASKO свяжется с вами для диагностики и согласования ремонта."
              linkHref="/account/requests/create"
              linkLabel="Создать заявку"
            />
          </div>

          {/* Add new device section */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-[32px] font-medium leading-[36px] tracking-tight text-text-main">
                Новое устройство?
              </h2>
              <p className="text-lg leading-[22px] tracking-tight text-text-main">
                Зарегистрируйте устройство, чтобы активировать сертификат и получить доступ к обслуживанию
              </p>
            </div>
            <Button variant="primary" className="w-full lg:w-fit h-[46px] lg:h-auto" onClick={() => setShowAddDevice(true)}>
              Добавить устройство
            </Button>
          </div>

          {/* Mobile CTA - after "Новое устройство?", with appliance images */}
          <CTABanner
            className="lg:hidden"
            title={<>Возникла проблема{'\n'}с техникой?</>}
            description="Создайте заявку, и наш специалист свяжется с вами для диагностики и согласования ремонта."
            linkHref="/account/requests/create"
            linkLabel="Создать заявку"
          />
        </>
      ) : (
        <>
          {loading ? (
            <p className="text-sm text-text-sub">Загрузка...</p>
          ) : (
            <DataGrid<ICertificate>
              columns={certificateColumns}
              data={paginatedCertificates}
              keyExtractor={(cert) => cert.id}
              emptyContent="У вас нет сертификатов"
              sortKey={sortBy ?? undefined}
              sortOrder={sortOrder ?? undefined}
              onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
              rowMenu={(cert) => {
                const items: DropdownMenuEntry[] = [];
                if (cert.status === CertificateStatus.PENDING_PAYMENT) {
                  items.push({ key: 'pay', label: 'Оплатить', onClick: () => handlePay(cert) });
                }
                items.push({ key: 'pdf', label: 'Скачать PDF', onClick: () => exportPdf(cert) });
                return items;
              }}
              footer={
                <div className="flex items-center justify-between w-full">
                  <span>Показано {paginatedCertificates.length} из {sortedCertificates.length}</span>
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              }
            />
          )}
        </>
      )}

      <AddCertificateForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={(cert) => {
          fetchCertificates();
          if (cert.status === CertificateStatus.PENDING_PAYMENT && cert.price) {
            setPaymentCert(cert);
          }
        }}
        onOpenAddDevice={() => setShowAddDevice(true)}
      />

      <AddDeviceForm
        open={showAddDevice}
        onClose={() => setShowAddDevice(false)}
        onSuccess={() => { fetchCertificates(); fetchDevices(); }}
      />

      {paymentCert && (
        <PaymentModal
          open={!!paymentCert}
          onClose={handlePaymentClose}
          targetType="certificate"
          targetId={paymentCert.id}
          amount={paymentCert.price ?? 0}
        />
      )}
    </PageContainer>
  );
}
