'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Button,
  DataTable,
  DataTableHeader,
  DataTableEmpty,
  DataTableFooter,
  DataSearch,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { CTABanner } from '@/components/account/cta-banner';
import { PaymentModal } from '@/components/account/user/payment-modal';
import { certificateApi } from '@/lib/api/certificate';
import { userDeviceApi } from '@/lib/api/user-device';
import { CertificateStatus } from '@asko/shared/client';
import type { ICertificate } from '@/lib/api/types';
import { CertificateCard } from './certificate-card';
import { CertificateTableRow } from './certificate-table-row';
import { DeviceSlider } from './device-slider';
import { AddDeviceForm } from './add-device-form';
import { AddCertificateForm } from './add-certificate-form';
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

  const totalPages = Math.ceil(filteredCertificates.length / PAGE_SIZE);
  const paginatedCertificates = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCertificates.slice(start, start + PAGE_SIZE);
  }, [filteredCertificates, page]);

  return (
    <PageContainer>
      <PageHeader>Мои сертификаты</PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <DataSearch value={search} onChange={setSearch} placeholder="Поиск по номеру или устройству" className="lg:w-[320px] flex-shrink-0" />
        <div className="flex-1 flex items-center gap-3">
          <div className="ml-auto flex-shrink-0 flex items-center gap-2">
            <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
            <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
              Добавить сертификат
            </Button>
          </div>
        </div>
      </div>

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
                    <CertificateCard key={cert.id} cert={cert} onPay={handlePay} />
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
            <DataTable>
              <DataTableHeader>
                <div className="w-[180px] flex-shrink-0">Номер</div>
                <div className="flex-1 px-4">Устройство</div>
                <div className="w-[160px] px-4">Статус</div>
                <div className="w-[110px] px-4">Выдан</div>
                <div className="w-[110px] px-4">Истекает</div>
                <div className="w-[220px] flex-shrink-0" />
              </DataTableHeader>

              {paginatedCertificates.length === 0 ? (
                <DataTableEmpty>У вас нет сертификатов</DataTableEmpty>
              ) : (
                paginatedCertificates.map((cert) => (
                  <CertificateTableRow key={cert.id} cert={cert} onPay={handlePay} />
                ))
              )}

              <DataTableFooter>
                <div className="flex items-center justify-between w-full">
                  <span>Показано {paginatedCertificates.length} из {filteredCertificates.length}</span>
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              </DataTableFooter>
            </DataTable>
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
