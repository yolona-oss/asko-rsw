'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  Badge,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  DataTableFooter,
  DataSearch,
  DataFilter,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
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

const STATUS_BADGE_VARIANT: Record<CertTab, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success',
  pending_payment: 'warning',
  validation_error: 'error',
  expired: 'neutral',
  revoked: 'error',
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
      <DataTableCell mobileLabel="Статус:" className="lg:w-[130px] lg:px-4">
        <Badge variant={STATUS_BADGE_VARIANT[cert.status as CertTab] ?? 'neutral'}>
          {STATUS_LABELS[cert.status] ?? cert.status}
        </Badge>
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
    <Card padding="none" className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-text-main">{cert.certificateNumber}</p>
        <Badge variant={STATUS_BADGE_VARIANT[cert.status as CertTab] ?? 'neutral'}>
          {STATUS_LABELS[cert.status] ?? cert.status}
        </Badge>
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
    </Card>
  );
}

export function AdminCertificates() {
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: 'active' });
  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await certificateApi.getAll({ limit: 200 });
      setCertificates(data.data ?? []);
    } catch {
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
    }
  };

  const filteredCerts = useMemo(() => {
    let result = certificates.filter((c) => c.status === filterValues.status);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const userName = [c.user?.lastName, c.user?.firstName].filter(Boolean).join(' ').toLowerCase();
        const deviceName = (c.userDevice?.device?.name ?? '').toLowerCase();
        const dealerName = (c.dealer?.companyName ?? '').toLowerCase();
        const certNum = c.certificateNumber.toLowerCase();
        return userName.includes(q) || deviceName.includes(q) || dealerName.includes(q) || certNum.includes(q);
      });
    }
    return result;
  }, [certificates, filterValues.status, search]);

  const totalInStatus = certificates.filter((c) => c.status === filterValues.status).length;

  return (
    <PageContainer>
      <PageHeader>Управление сертификатами</PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <DataSearch value={search} onChange={setSearch} placeholder="Поиск" className="lg:w-[320px] flex-shrink-0" />
        <div className="flex-1 flex items-center gap-3">
          <DataFilter
            filters={[STATUS_FILTER]}
            values={filterValues}
            onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
          />
          <div className="ml-auto flex-shrink-0 flex items-center gap-2">
            <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      ) : view === 'table' ? (
        <DataTable>
          <DataTableHeader>
            <div className="w-[140px] flex-shrink-0">Номер</div>
            <div className="flex-1 px-4">Пользователь</div>
            <div className="flex-1 px-4">Устройство</div>
            <div className="w-[150px] px-4">Дилер</div>
            <div className="w-[130px] px-4">Статус</div>
            <div className="w-[100px] px-4">Выдан</div>
            <div className="w-[100px] px-4">Истекает</div>
            <div className="w-[120px] flex-shrink-0" />
          </DataTableHeader>

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

          <DataTableFooter>
            Показано {filteredCerts.length} из {totalInStatus}
          </DataTableFooter>
        </DataTable>
      ) : (
        <>
          {filteredCerts.length === 0 ? (
            <p className="text-sm text-text-sub text-center py-8">Нет сертификатов в этой категории</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCerts.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  cert={cert}
                  onRevoke={handleRevoke}
                />
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
