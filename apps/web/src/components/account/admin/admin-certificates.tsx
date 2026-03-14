'use client';

import { useState } from 'react';

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
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0 px-5 py-4 border-b border-border-light last:border-b-0 bg-white">
      <div className="lg:w-[100px] lg:flex-shrink-0">
        <p className="text-xs text-text-sub lg:hidden">Номер:</p>
        <p className="text-sm font-medium text-text-main">{cert.number}</p>
      </div>
      <div className="lg:flex-1 lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Пользователь:</p>
        <p className="text-sm text-text-main">{cert.userName}</p>
      </div>
      <div className="lg:flex-1 lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Устройство:</p>
        <p className="text-sm text-text-main">{cert.device}</p>
      </div>
      <div className="lg:w-[150px] lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Дилер:</p>
        <p className="text-sm text-text-main">{cert.dealer}</p>
      </div>
      <div className="lg:w-[90px] lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Статус:</p>
        <span className={`text-sm font-medium ${STATUS_COLORS[cert.status]}`}>
          {STATUS_LABELS[cert.status]}
        </span>
      </div>
      <div className="lg:w-[100px] lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Выдан:</p>
        <p className="text-sm text-text-main">{cert.issuedAt}</p>
      </div>
      <div className="lg:w-[100px] lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Истекает:</p>
        <p className="text-sm text-text-main">{cert.expiresAt}</p>
      </div>
      <div className="lg:w-[120px] lg:flex-shrink-0 lg:text-right">
        {showApprove && (
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-sm cursor-pointer"
          >
            Одобрить
          </button>
        )}
        {showRevoke && (
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-brand-red border border-brand-red rounded-sm hover:bg-red-50 transition-colors cursor-pointer"
          >
            Отозвать
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminCertificates() {
  const [activeTab, setActiveTab] = useState<CertTab>('pending');
  const [autoVerify, setAutoVerify] = useState(false);

  const filteredCerts = MOCK_CERTIFICATES.filter((c) => c.status === activeTab);

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-[28px] lg:text-[36px] font-medium tracking-[-0.01em] text-text-main">
          Управление сертификатами
        </h1>
      </div>

      {/* Auto-verification toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <span className="text-sm font-medium text-text-main">Авто-верификация</span>
        <button
          type="button"
          role="switch"
          aria-checked={autoVerify}
          onClick={() => setAutoVerify(!autoVerify)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoVerify ? 'bg-green-600' : 'bg-[#C4C4C4]'
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoVerify ? 'translate-x-6' : 'translate-x-1'
              }`}
          />
        </button>
      </label>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-sm border transition-colors cursor-pointer ${activeTab === tab.key
              ? 'bg-dark-deep text-white border-dark-deep'
              : 'bg-white text-text-main border-border-light hover:border-text-main'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop table header */}
      <div className="hidden lg:flex items-center px-5 py-3 text-xs font-medium text-text-sub uppercase tracking-wider border-b border-border-light">
        <div className="w-[100px] flex-shrink-0">Номер</div>
        <div className="flex-1 px-4">Пользователь</div>
        <div className="flex-1 px-4">Устройство</div>
        <div className="w-[150px] px-4">Дилер</div>
        <div className="w-[90px] px-4">Статус</div>
        <div className="w-[100px] px-4">Выдан</div>
        <div className="w-[100px] px-4">Истекает</div>
        <div className="w-[120px] flex-shrink-0" />
      </div>

      <div className="flex flex-col border border-border-light rounded-sm overflow-hidden">
        {filteredCerts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-text-sub">
            Нет сертификатов в этой категории
          </div>
        ) : (
          filteredCerts.map((cert) => (
            <CertificateRow key={cert.id} cert={cert} />
          ))
        )}
      </div>
    </div>
  );
}
