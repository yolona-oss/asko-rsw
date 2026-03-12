'use client';

import Image from 'next/image';
import Link from 'next/link';

const MOCK_CERTIFICATE = {
  id: 'ASKO-4582-9384',
  status: 'active' as const,
  activationDate: '12.03.2025',
  duration: '36 месяцев',
  validUntil: '12.08.2028',
  devicesCount: 1,
  device: {
    name: 'Стиральная машина ASKO W2086C',
    description:
      'Устройство зарегистрировано и защищено расширенной гарантией ASKO. Сертификат подтверждает право на обслуживание и ремонт.',
    image: '/images/b9fd50ea648ab558085721e0f33610b5b0b61bac.png',
  },
};

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

export function UserCertificates() {
  const cert = MOCK_CERTIFICATE;

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      {/* Page title */}
      <h1 className="text-[28px] lg:text-[36px] font-medium tracking-[-0.01em] text-text-main">
        Активные сертификаты
      </h1>

      {/* Status pills */}
      <div className="flex flex-wrap gap-3">
        <StatusPill label="Сертификат" value="Активен" active />
        <StatusPill label="Срок действия" value={`до ${cert.validUntil}`} />
        <StatusPill label="Добавленно" value={`${cert.devicesCount} устройство`} />
      </div>

      {/* Certificate card + sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main certificate card */}
        <div className="flex-1 bg-white rounded-sm border border-border-light p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Info */}
            <div className="flex-1 flex flex-col gap-4">
              <h2 className="text-2xl lg:text-[32px] font-bold leading-tight text-text-main">
                {cert.device.name}
              </h2>
              <p className="text-sm leading-relaxed text-text-sub">
                {cert.device.description}
              </p>

              <div className="flex flex-col gap-2 mt-2">
                <p className="text-sm text-text-main">
                  Номер сертификата: <strong>{cert.id}</strong>
                </p>
                <p className="text-sm text-text-main">
                  Дата активации: <strong>{cert.activationDate}</strong>
                </p>
                <p className="text-sm text-text-main">
                  Срок действия: <strong>{cert.duration}</strong>
                </p>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm">
                  Статус: <span className="text-green-600 font-medium">Активен</span>
                </span>
                <span className="text-sm text-text-sub">
                  Действителен до {cert.validUntil}
                </span>
              </div>
              <p className="text-sm text-text-main">Расширенная гарантия активна</p>

              {/* Download PDF */}
              <button
                type="button"
                className="flex items-center gap-2 mt-4 px-5 py-2.5 border border-border-light rounded-sm text-sm font-medium text-text-main hover:bg-gray-50 transition-colors w-fit"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Скачать сертификат PDF
              </button>
            </div>

            {/* Device image */}
            <div className="w-full lg:w-[240px] flex-shrink-0">
              <div className="relative w-full aspect-[3/4]">
                <Image
                  src={cert.device.image}
                  alt={cert.device.name}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>

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

      {/* Add new device section */}
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl lg:text-[28px] font-bold text-text-main">
          Новое устройство?
        </h2>
        <p className="text-sm text-text-sub max-w-md">
          Зарегистрируйте устройство, чтобы активировать сертификат и получить доступ к
          обслуживанию
        </p>
        <button
          type="button"
          className="flex items-center justify-center w-full lg:w-fit px-8 py-2.5 text-sm font-medium text-white bg-brand-red mt-2 cursor-pointer"
        >
          Добавить устройство
        </button>
      </div>
    </div>
  );
}
