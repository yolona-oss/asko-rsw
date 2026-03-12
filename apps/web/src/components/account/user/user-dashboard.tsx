'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from '@/components/account/account-provider';
import { getGreeting } from '@/lib/account';

function StatCard({
  title,
  value,
  children,
}: {
  title: string;
  value?: string | number;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-sm border border-border-light p-6 flex flex-col gap-2">
      <span className="text-base font-medium leading-5 text-text-sub">{title}</span>
      {value !== undefined && (
        <span className="text-[56px] lg:text-[72px] font-normal leading-none text-text-main">
          {value}
        </span>
      )}
      {children}
    </div>
  );
}

export function UserDashboard() {
  const { user } = useAccount();
  const greeting = getGreeting();

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      {/* Greeting */}
      <h1 className="text-[32px] lg:text-[42px] font-medium leading-tight tracking-[-0.01em] text-text-main">
        {greeting},<br />
        {user?.name}!
      </h1>

      {/* Stat cards - mobile stacked, desktop 3-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Мои заявки */}
        <StatCard title="Мои заявки:" value={0}>
          <div className="mt-auto pt-4 flex flex-col gap-1">
            <p className="text-sm font-bold text-text-main">Последняя заявка:</p>
            <p className="text-sm text-text-main">
              Ремонт стиральной машины ASKO W2086C
            </p>
            <Link
              href="/account/requests"
              className="text-sm text-text-sub underline mt-1 lg:hidden"
            >
              Смотреть все заявки...
            </Link>
          </div>
        </StatCard>

        {/* Активные сертификаты */}
        <StatCard title="Активные сертификаты:">
          <div className="flex items-center justify-end">
            <span className="text-[56px] lg:text-[72px] font-normal leading-none text-text-main">
              1
            </span>
          </div>
        </StatCard>

        {/* Счет на оплату */}
        <div className="bg-white rounded-sm border border-border-light p-6 flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-medium text-text-sub">Счет на оплату:</span>
            <span className="text-2xl font-bold text-text-main">14600</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-text-main">Статус:</span>
            <span className="text-sm text-brand-red">Ожидает оплаты...</span>
          </div>
          <button
            type="button"
            className="mt-auto flex items-center justify-center w-full lg:w-fit px-8 py-2.5 text-sm font-medium text-white bg-brand-red cursor-pointer"
          >
            Оплатить
          </button>
        </div>
      </div>

      {/* Last request card - desktop only */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-sm border border-border-light p-6 flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-lg font-bold text-text-main">Последняя заявка:</p>
            <p className="text-base text-text-main">
              Ремонт стиральной машины ASKO W2086C
            </p>
            <Link
              href="/account/requests"
              className="text-sm text-text-sub underline mt-2"
            >
              Смотреть все заявки...
            </Link>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#4ADE80] flex-shrink-0" />
        </div>
      </div>

      {/* CTA Banner */}
      <div className="relative overflow-hidden bg-[#151515] rounded-sm">
        {/* Decorative red glow — top right */}
        <div className="absolute -top-[100px] -right-[100px] w-[800px] h-[500px] -rotate-[150deg] pointer-events-none">
          <div className="size-full bg-[radial-gradient(ellipse_at_center,_rgba(235,0,28,0.38)_0%,_transparent_70%)] blur-[69px]" />
        </div>
        {/* Decorative red glow — bottom left */}
        <div className="absolute -top-[200px] -left-[200px] w-[600px] h-[500px] rotate-[60deg] pointer-events-none">
          <div className="size-full bg-[radial-gradient(ellipse_at_center,_rgba(235,0,28,0.3)_0%,_transparent_70%)] blur-[62px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 lg:py-6 lg:px-10 flex flex-col gap-6 max-w-[480px]">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl lg:text-[32px] font-medium lg:leading-[36px] tracking-[-0.01em] text-white">
              Возникла проблема
              <br />с техникой?
            </h3>
            <p className="text-base lg:text-lg lg:leading-[22px] tracking-[-0.01em] text-white">
              Создайте заявку, и наш специалист свяжется с вами для диагностики
              и согласования ремонта.
            </p>
          </div>
          <Link
            href="/account/requests/create"
            className="flex items-center justify-center w-full lg:w-fit px-6 py-2.5 text-sm font-medium text-white bg-brand-red shadow-sm cursor-pointer"
          >
            Создать заявку
          </Link>
        </div>

        {/* Appliance images — desktop only */}
        <div className="hidden lg:block absolute right-0 top-0 w-[430px] h-full">
          <Image
            src="/images/cta-stove.png"
            alt=""
            width={205}
            height={179}
            className="absolute left-0 top-[102px] opacity-64 blur-[0.55px]"
          />
          <Image
            src="/images/cta-oven.png"
            alt=""
            width={188}
            height={183}
            className="absolute left-[217px] top-[102px] opacity-64 blur-[0.55px] object-cover"
          />
          <Image
            src="/images/cta-washing-machine.png"
            alt=""
            width={180}
            height={252}
            className="absolute left-[135px] top-[34px] rounded-[10px] object-cover"
          />
        </div>
      </div>
    </div>
  );
}
