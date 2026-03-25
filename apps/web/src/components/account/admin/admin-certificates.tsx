'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  DataFilter,
} from '@asko/ui';
import type { FilterDefinition, FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { certificateApi } from '@/lib/api/certificate';
import { CertificateStatus } from '@asko/shared/client';
import type { ICertificate } from '@/lib/api/types';

type CertTab = 'pending_payment' | 'validation_error' | 'active' | 'expired' | 'revoked';

const STATUS_FILTER: FilterDefinition = {
  key: 'status',
  label: '',
  type: 'tabs',
  options: [
    { value: 'active', label: 'Активные' },
    { value: 'pending_payment', label: 'Ожидают оплаты' },
    { value: 'validation_error', label: 'Ошибка валидации' },
    { value: 'expired', label: 'Истекшие' },
    { value: 'revoked', label: 'Отозванные' },
  ],
};

const STATUS_COLORS: Record<CertTab, string> = {
  pending_payment: 'text-orange-600',
  validation_error: 'text-brand-red',
  active: 'text-green-600',
  expired: 'text-text-sub',
  revoked: 'text-brand-red',
};

const STATUS_LABELS: Record<string, string> = {
  [CertificateStatus.PENDING_PAYMENT]: 'Ожидает оплаты',
  [CertificateStatus.VALIDATION_ERROR]: 'Ошибка валидации',
  [CertificateStatus.ACTIVE]: 'Активен',
  [CertificateStatus.EXPIRED]: 'Истек',
  [CertificateStatus.REVOKED]: 'Отозван',
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function CertificateRow({
  cert,
  onRevoke,
}: {
  cert: ICertificate;
  onRevoke: (id: string) => void;
}) {
  const showRevoke = cert.status === CertificateStatus.ACTIVE;
  const userName = [cert.user?.lastName, cert.user?.firstName].filter(Boolean).join(' ') || '-';
  const deviceName = cert.userDevice?.device?.name ?? '-';
  const dealerName = cert.dealer?.companyName
    || [cert.dealer?.user?.lastName, cert.dealer?.user?.firstName].filter(Boolean).join(' ')
    || '-';

  return (
    <DataTableRow>
      <DataTableCell mobileLabel="Номер:" className="lg:w-[140px] lg:flex-shrink-0">
        <p className="text-sm font-medium text-text-main">{cert.certificateNumber}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Пользователь:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{userName}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Устройство:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{deviceName}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Дилер:" className="lg:w-[150px] lg:px-4">
        <p className="text-sm text-text-main">{dealerName}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Статус:" className="lg:w-[90px] lg:px-4">
        <span className={`text-sm font-medium ${STATUS_COLORS[cert.status as CertTab] ?? 'text-text-main'}`}>
          {STATUS_LABELS[cert.status] ?? cert.status}
        </span>
      </DataTableCell>
      <DataTableCell mobileLabel="Выдан:" className="lg:w-[100px] lg:px-4">
        <p className="text-sm text-text-main">{formatDate(cert.issuedAt)}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Истекает:" className="lg:w-[100px] lg:px-4">
        <p className="text-sm text-text-main">{formatDate(cert.expiresAt)}</p>
      </DataTableCell>
      <DataTableCell className="lg:w-[120px] lg:flex-shrink-0 lg:text-right">
        {showRevoke && (
          <Button variant="danger" size="sm" onClick={() => onRevoke(cert.id)}>
            Отозвать
          </Button>
        )}
      </DataTableCell>
    </DataTableRow>
  );
}

function CertificateCard({
  cert,
  onRevoke,
}: {
  cert: ICertificate;
  onRevoke: (id: string) => void;
}) {
  const showRevoke = cert.status === CertificateStatus.ACTIVE;
  const userName = [cert.user?.lastName, cert.user?.firstName].filter(Boolean).join(' ') || '-';
  const deviceName = cert.userDevice?.device?.name ?? '-';
  const dealerName = cert.dealer?.companyName
    || [cert.dealer?.user?.lastName, cert.dealer?.user?.firstName].filter(Boolean).join(' ')
    || '-';

  return (
    <div className="bg-white border border-border-light rounded-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-text-main">{cert.certificateNumber}</p>
        <span className={`text-xs font-medium flex-shrink-0 ${STATUS_COLORS[cert.status as CertTab] ?? 'text-text-main'}`}>
          {STATUS_LABELS[cert.status] ?? cert.status}
        </span>
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-text-sub">Пользователь</span>
          <span className="text-text-main">{userName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-sub">Устройство</span>
          <span className="text-text-main">{deviceName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-sub">Дилер</span>
          <span className="text-text-main">{dealerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-sub">Действие</span>
          <span className="text-text-main">{formatDate(cert.issuedAt)} — {formatDate(cert.expiresAt)}</span>
        </div>
      </div>
      {showRevoke && (
        <div className="pt-1">
          <Button variant="danger" size="sm" onClick={() => onRevoke(cert.id)}>
            Отозвать
          </Button>
        </div>
      )}
    </div>
  );
}

export function AdminCertificates() {
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: 'active' });
  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await certificateApi.getAll({ limit: 200 });
      setCertificates(data.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleRevoke = async (id: string) => {
    try {
      await certificateApi.revoke(id);
      await fetchCertificates();
    } catch {
      // silently fail
    }
  };

  const filteredCerts = certificates.filter((c) => c.status === filterValues.status);

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader>Управление сертификатами</PageHeader>
        <ViewSwitcher
          views={[VIEW_TABLE, VIEW_CARD]}
          activeView={view}
          onViewChange={setView}
        />
      </div>

      {/* Status filter tabs */}
      <DataFilter
        filters={[STATUS_FILTER]}
        values={filterValues}
        onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
      />

      {loading ? (
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      ) : view === 'table' ? (
        <>
          <DataTableHeader>
            <div className="w-[140px] flex-shrink-0">Номер</div>
            <div className="flex-1 px-4">Пользователь</div>
            <div className="flex-1 px-4">Устройство</div>
            <div className="w-[150px] px-4">Дилер</div>
            <div className="w-[90px] px-4">Статус</div>
            <div className="w-[100px] px-4">Выдан</div>
            <div className="w-[100px] px-4">Истекает</div>
            <div className="w-[120px] flex-shrink-0" />
          </DataTableHeader>

          <DataTable>
            {filteredCerts.length === 0 ? (
              <DataTableEmpty>
                Нет сертификатов в этой категории
              </DataTableEmpty>
            ) : (
              filteredCerts.map((cert) => (
                <CertificateRow
                  key={cert.id}
                  cert={cert}
                  onRevoke={handleRevoke}
                />
              ))
            )}
          </DataTable>
        </>
      ) : (
        filteredCerts.length === 0 ? (
          <p className="text-sm text-text-sub text-center py-8">Нет сертификатов в этой категории</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCerts.map((cert) => (
              <CertificateCard
                key={cert.id}
                cert={cert}
                onRevoke={handleRevoke}
              />
            ))}
          </div>
        )
      )}
    </PageContainer>
  );
}
