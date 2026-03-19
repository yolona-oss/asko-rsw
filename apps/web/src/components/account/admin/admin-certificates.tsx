'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Toggle,
  TabList,
  Tab,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { adminApi } from '@/lib/api/admin';
import { CertificateStatus } from '@asko/shared/client';

type CertTab = 'pending_payment' | 'pending_approval' | 'active' | 'expired' | 'revoked';

const TABS: { key: CertTab; label: string }[] = [
  { key: 'pending_payment', label: 'Ожидают оплаты' },
  { key: 'pending_approval', label: 'Ожидающие' },
  { key: 'active', label: 'Активные' },
  { key: 'expired', label: 'Истекшие' },
  { key: 'revoked', label: 'Отозванные' },
];

const STATUS_COLORS: Record<CertTab, string> = {
  pending_payment: 'text-orange-600',
  pending_approval: 'text-yellow-600',
  active: 'text-green-600',
  expired: 'text-text-sub',
  revoked: 'text-brand-red',
};

const STATUS_LABELS: Record<string, string> = {
  [CertificateStatus.PENDING_PAYMENT]: 'Ожидает оплаты',
  [CertificateStatus.PENDING_APPROVAL]: 'Ожидает',
  [CertificateStatus.ACTIVE]: 'Активен',
  [CertificateStatus.EXPIRED]: 'Истек',
  [CertificateStatus.REVOKED]: 'Отозван',
};

interface Certificate {
  id: string;
  certificateNumber: string;
  status: CertificateStatus;
  issuedAt: string;
  expiresAt: string;
  user?: { firstName?: string; lastName?: string };
  userDevice?: { device?: { name?: string } };
  dealer?: { companyName?: string; user?: { firstName?: string; lastName?: string } };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function CertificateRow({
  cert,
  onApprove,
  onRevoke,
}: {
  cert: Certificate;
  onApprove: (id: string) => void;
  onRevoke: (id: string) => void;
}) {
  const showApprove = cert.status === CertificateStatus.PENDING_APPROVAL;
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
        {showApprove && (
          <Button variant="success" size="sm" onClick={() => onApprove(cert.id)}>
            Одобрить
          </Button>
        )}
        {showRevoke && (
          <Button variant="danger" size="sm" onClick={() => onRevoke(cert.id)}>
            Отозвать
          </Button>
        )}
      </DataTableCell>
    </DataTableRow>
  );
}

export function AdminCertificates() {
  const [activeTab, setActiveTab] = useState<CertTab>('pending_approval');
  const [autoVerify, setAutoVerify] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getCertificates({ limit: 200 });
      const list = data.data ?? (Array.isArray(data) ? data : []);
      setCertificates(list);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveCertificate(id);
      await fetchCertificates();
    } catch {
      // silently fail
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await adminApi.revokeCertificate(id);
      await fetchCertificates();
    } catch {
      // silently fail
    }
  };

  const filteredCerts = certificates.filter((c) => c.status === activeTab);

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader>Управление сертификатами</PageHeader>
      </div>

      {/* Auto-verification toggle */}
      <Toggle
        checked={autoVerify}
        onChange={setAutoVerify}
        label="Авто-верификация"
      />

      {/* Tabs */}
      <TabList>
        {TABS.map((tab) => (
          <Tab
            key={tab.key}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>

      {loading ? (
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      ) : (
        <>
          {/* Desktop table header */}
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
                  onApprove={handleApprove}
                  onRevoke={handleRevoke}
                />
              ))
            )}
          </DataTable>
        </>
      )}
    </PageContainer>
  );
}
