'use client';

import { useState } from 'react';
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

type CertTab = 'pending' | 'active' | 'expired' | 'revoked';

const TABS: { key: CertTab; label: string }[] = [
  { key: 'pending', label: 'Ожидающие' },
  { key: 'active', label: 'Активные' },
  { key: 'expired', label: 'Истекшие' },
  { key: 'revoked', label: 'Отозванные' },
];

const STATUS_COLORS: Record<CertTab, string> = {
  pending: 'text-yellow-600',
  active: 'text-green-600',
  expired: 'text-text-sub',
  revoked: 'text-brand-red',
};

const STATUS_LABELS: Record<CertTab, string> = {
  pending: 'Ожидает',
  active: 'Активен',
  expired: 'Истек',
  revoked: 'Отозван',
};

interface Certificate {
  id: string;
  number: string;
  userName: string;
  device: string;
  dealer: string;
  status: CertTab;
  issuedAt: string;
  expiresAt: string;
}

const MOCK_CERTIFICATES: Certificate[] = [
  { id: 'c1', number: 'CERT-001', userName: 'Иванов И.И.', device: 'ASKO W4114C.W', dealer: 'ООО "АскоСервис"', status: 'pending', issuedAt: '10.03.2026', expiresAt: '10.03.2027' },
  { id: 'c2', number: 'CERT-002', userName: 'Петров П.П.', device: 'ASKO T408HD.W', dealer: 'ИП Сидоров', status: 'active', issuedAt: '01.02.2026', expiresAt: '01.02.2027' },
  { id: 'c3', number: 'CERT-003', userName: 'Козлов А.В.', device: 'ASKO DFI746U', dealer: 'ООО "ТехноМаркет"', status: 'pending', issuedAt: '12.03.2026', expiresAt: '12.03.2027' },
  { id: 'c4', number: 'CERT-004', userName: 'Морозова А.С.', device: 'ASKO OCS8664S', dealer: 'ООО "АскоСервис"', status: 'active', issuedAt: '15.01.2026', expiresAt: '15.01.2027' },
  { id: 'c5', number: 'CERT-005', userName: 'Волков Д.О.', device: 'ASKO HI1611G', dealer: 'ИП Новиков', status: 'expired', issuedAt: '01.01.2025', expiresAt: '01.01.2026' },
  { id: 'c6', number: 'CERT-006', userName: 'Соколова Е.Д.', device: 'ASKO R22838S', dealer: 'ООО "АскоСервис"', status: 'revoked', issuedAt: '20.12.2025', expiresAt: '20.12.2026' },
];

function CertificateRow({ cert }: { cert: Certificate }) {
  const showApprove = cert.status === 'pending';
  const showRevoke = cert.status === 'active';

  return (
    <DataTableRow>
      <DataTableCell mobileLabel="Номер:" className="lg:w-[100px] lg:flex-shrink-0">
        <p className="text-sm font-medium text-text-main">{cert.number}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Пользователь:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{cert.userName}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Устройство:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{cert.device}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Дилер:" className="lg:w-[150px] lg:px-4">
        <p className="text-sm text-text-main">{cert.dealer}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Статус:" className="lg:w-[90px] lg:px-4">
        <span className={`text-sm font-medium ${STATUS_COLORS[cert.status]}`}>
          {STATUS_LABELS[cert.status]}
        </span>
      </DataTableCell>
      <DataTableCell mobileLabel="Выдан:" className="lg:w-[100px] lg:px-4">
        <p className="text-sm text-text-main">{cert.issuedAt}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Истекает:" className="lg:w-[100px] lg:px-4">
        <p className="text-sm text-text-main">{cert.expiresAt}</p>
      </DataTableCell>
      <DataTableCell className="lg:w-[120px] lg:flex-shrink-0 lg:text-right">
        {showApprove && (
          <Button variant="success" size="sm">
            Одобрить
          </Button>
        )}
        {showRevoke && (
          <Button variant="danger" size="sm">
            Отозвать
          </Button>
        )}
      </DataTableCell>
    </DataTableRow>
  );
}

export function AdminCertificates() {
  const [activeTab, setActiveTab] = useState<CertTab>('pending');
  const [autoVerify, setAutoVerify] = useState(false);

  const filteredCerts = MOCK_CERTIFICATES.filter((c) => c.status === activeTab);

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

      {/* Desktop table header */}
      <DataTableHeader>
        <div className="w-[100px] flex-shrink-0">Номер</div>
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
            <CertificateRow key={cert.id} cert={cert} />
          ))
        )}
      </DataTable>
    </PageContainer>
  );
}
