'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { userApi } from '@/lib/api/user';
import { CertificateStatus } from '@asko/shared/client';

const STATUS_LABELS: Record<string, string> = {
  [CertificateStatus.PENDING_APPROVAL]: 'На проверке',
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
  description?: string;
  userDevice?: {
    device?: {
      name?: string;
      description?: string;
    };
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function StatusPill({
  label,
  value,
  active = false,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="border border-border-light rounded-sm px-4 py-3 flex flex-col gap-0.5">
      <span className="text-xs text-text-sub">{label}</span>
      <span className={`text-sm font-medium ${active ? 'text-green-600' : 'text-text-main'}`}>
        {value}
      </span>
    </div>
  );
}

function CertificateCard({ cert }: { cert: Certificate }) {
  const isActive = cert.status === CertificateStatus.ACTIVE;
  const deviceName = cert.userDevice?.device?.name ?? 'Устройство';
  const deviceDesc = cert.userDevice?.device?.description
    ?? 'Устройство зарегистрировано и защищено расширенной гарантией ASKO.';

  const durationMs = new Date(cert.expiresAt).getTime() - new Date(cert.issuedAt).getTime();
  const durationMonths = Math.round(durationMs / (1000 * 60 * 60 * 24 * 30));

  return (
    <>
      {/* Status pills */}
      <div className="flex flex-wrap gap-3">
        <StatusPill
          label="Сертификат"
          value={STATUS_LABELS[cert.status] ?? cert.status}
          active={isActive}
        />
        <StatusPill label="Срок действия" value={`до ${formatDate(cert.expiresAt)}`} />
      </div>

      {/* Certificate card + sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        <Card padding="lg" className="flex-1">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl lg:text-[32px] font-bold leading-tight text-text-main">
              {deviceName}
            </h2>
            <p className="text-sm leading-relaxed text-text-sub">
              {deviceDesc}
            </p>

            <div className="flex flex-col gap-2 mt-2">
              <p className="text-sm text-text-main">
                Номер сертификата: <strong>{cert.certificateNumber}</strong>
              </p>
              <p className="text-sm text-text-main">
                Дата активации: <strong>{formatDate(cert.issuedAt)}</strong>
              </p>
              <p className="text-sm text-text-main">
                Срок действия: <strong>{durationMonths} месяцев</strong>
              </p>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm">
                Статус:{' '}
                <span className={isActive ? 'text-green-600 font-medium' : 'text-text-sub font-medium'}>
                  {STATUS_LABELS[cert.status] ?? cert.status}
                </span>
              </span>
              <span className="text-sm text-text-sub">
                Действителен до {formatDate(cert.expiresAt)}
              </span>
            </div>
            {isActive && <p className="text-sm text-text-main">Расширенная гарантия активна</p>}
          </div>
        </Card>

        {/* Sidebar CTA */}
        <div className="lg:w-[280px] flex-shrink-0 bg-dark-deep rounded-sm p-6 flex flex-col gap-4 text-white">
          <h3 className="text-xl font-bold leading-tight">
            Возникла проблема с устройством?
          </h3>
          <p className="text-sm leading-relaxed text-white/80">
            Создайте заявку, и специалист сервисного центра ASKO свяжется с вами для
            диагностики и согласования ремонта.
          </p>
          <Link
            href="/account/requests/create"
            className="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-brand-red mt-auto cursor-pointer"
          >
            Создать заявку
          </Link>
        </div>
      </div>
    </>
  );
}

export function UserCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const { data } = await userApi.getMyCertificates();
        const list = Array.isArray(data) ? data : data.data ?? [];
        setCertificates(list);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchCertificates();
  }, []);

  return (
    <PageContainer>
      <PageHeader>Активные сертификаты</PageHeader>

      {loading ? (
        <p className="text-sm text-text-sub">Загрузка...</p>
      ) : certificates.length === 0 ? (
        <p className="text-sm text-text-sub">У вас нет сертификатов</p>
      ) : (
        certificates.map((cert) => (
          <CertificateCard key={cert.id} cert={cert} />
        ))
      )}

      {/* Add new device section */}
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl lg:text-[28px] font-bold text-text-main">
          Новое устройство?
        </h2>
        <p className="text-sm text-text-sub max-w-md">
          Зарегистрируйте устройство, чтобы активировать сертификат и получить доступ к
          обслуживанию
        </p>
        <Button variant="primary" className="w-full lg:w-fit mt-2">
          Добавить устройство
        </Button>
      </div>
    </PageContainer>
  );
}
