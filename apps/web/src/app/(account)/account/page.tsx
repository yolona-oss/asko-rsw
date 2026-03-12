'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from '@/components/account/account-provider';
import { getGreeting } from '@/lib/account';
import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonCircle,
} from '@/components/account/skeleton';

/* ── Stat cards ─────────────────────────────────── */

function RequestsCard() {
  const { stage } = useAccount();

  if (stage === 'skeleton') {
    return <SkeletonCard className="h-[180px] lg:h-[200px]" />;
  }

  return (
    <div className="bg-[#E8E8E8] p-6 flex flex-col gap-2">
      <span className="text-lg font-medium leading-[22px] tracking-[-0.01em] text-text-main">
        Мои заявки:
      </span>
      <span className="text-[72px] lg:text-[96px] font-normal leading-none tracking-[-0.01em] text-text-main">
        0
      </span>
      <div className="mt-auto">
        <p className="text-base font-bold leading-5 tracking-[-0.01em] text-text-main">
          Последняя заявка:
        </p>
        <p className="text-sm leading-[18px] tracking-[-0.01em] text-text-main mt-1">
          Ремонт стиральной машины ASKO W2086C
        </p>
        <Link
          href="/account/requests"
          className="text-sm leading-[18px] tracking-[-0.01em] text-text-main underline mt-2 inline-block"
        >
          Смотреть все заявки...
        </Link>
      </div>
    </div>
  );
}

function CertificatesCard() {
  const { stage } = useAccount();

  if (stage === 'skeleton') {
    return <SkeletonCard className="h-[180px] lg:h-[200px]" />;
  }

  return (
    <div className="bg-[#E8E8E8] p-6 flex flex-col">
      <div className="flex items-start justify-between">
        <span className="text-lg font-medium leading-[22px] tracking-[-0.01em] text-text-main max-w-[140px]">
          Активные сертификаты:
        </span>
        <span className="text-[72px] lg:text-[96px] font-normal leading-none tracking-[-0.01em] text-text-main">
          1
        </span>
      </div>
    </div>
  );
}

function PaymentCard() {
  const { stage } = useAccount();

  if (stage === 'skeleton') {
    return <SkeletonCard className="h-[180px] lg:h-[200px]" />;
  }

  return (
    <div className="bg-[#E8E8E8] p-6 flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-medium leading-[22px] tracking-[-0.01em] text-text-main">
          Счет на оплату:
        </span>
        <span className="text-2xl font-bold leading-7 tracking-[-0.01em] text-text-main">
          14600
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-bold leading-[18px] tracking-[-0.01em] text-text-main">
          Статус:
        </span>
        <span className="text-sm leading-[18px] tracking-[-0.01em] text-brand-red">
          Ожидает оплаты...
        </span>
      </div>
      <button
        type="button"
        className="mt-auto flex items-center justify-center w-full lg:w-fit px-8 py-2 text-sm font-medium text-white bg-brand-red shadow-sm cursor-pointer"
      >
        Оплатить
      </button>
    </div>
  );
}

/* ── Last request card (desktop only) ──────────── */

function LastRequestCard() {
  const { stage } = useAccount();

  if (stage === 'skeleton') {
    return <SkeletonCard className="h-[140px]" />;
  }

  return (
    <div className="bg-[#E8E8E8] p-6 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-bold leading-[22px] tracking-[-0.01em] text-text-main">
            Последняя заявка:
          </p>
          <p className="text-base leading-[22px] tracking-[-0.01em] text-text-main">
            Ремонт стиральной машины ASKO W2086C
          </p>
        </div>
        {stage === 'loaded' ? (
          <div className="w-8 h-8 rounded-full bg-[#4ADE80]" />
        ) : (
          <SkeletonCircle className="w-8 h-8" />
        )}
      </div>
      <Link
        href="/account/requests"
        className="text-sm leading-[18px] tracking-[-0.01em] text-text-main underline mt-2"
      >
        Смотреть все заявки...
      </Link>
    </div>
  );
}

/* ── CTA banner ────────────────────────────────── */

function CtaBanner() {
  const { stage } = useAccount();

  if (stage === 'skeleton') {
    return (
      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-6 w-3/4" />
        <SkeletonBlock className="h-5 w-full" />
        <SkeletonBlock className="h-5 w-2/3" />
        <SkeletonBlock className="h-10 w-40 mt-2" red />
      </div>
    );
  }

  if (stage === 'partial') {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-2xl lg:text-[32px] font-bold leading-tight tracking-[-0.01em] text-text-main">
          Возникла проблема с техникой?
        </h3>
        <p className="text-base lg:text-lg leading-[22px] tracking-[-0.01em] text-text-main max-w-[500px]">
          Создайте заявку, и наш специалист свяжется с вами для диагностики и согласования ремонта.
        </p>
        <button
          type="button"
          className="flex items-center justify-center w-full lg:w-fit px-8 py-2 text-sm font-medium text-white bg-brand-red shadow-sm mt-2 cursor-pointer"
        >
          Создать заявку
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-[#6B1520]">
      <div className="relative z-10 p-6 lg:p-10 flex flex-col gap-4 max-w-[500px]">
        <h3 className="text-2xl lg:text-[32px] font-bold leading-tight tracking-[-0.01em] text-white">
          Возникла проблема с техникой?
        </h3>
        <p className="text-base lg:text-lg leading-[22px] tracking-[-0.01em] text-white/90">
          Создайте заявку, и наш специалист свяжется с вами для диагностики и согласования ремонта.
        </p>
        <button
          type="button"
          className="flex items-center justify-center w-full lg:w-fit px-8 py-2 text-sm font-medium text-white bg-brand-red shadow-sm cursor-pointer"
        >
          Создать заявку
        </button>
      </div>
      {/* Appliance images placeholder on the right */}
      <div className="hidden lg:block absolute right-0 top-0 w-[400px] h-full">
        <Image
          src="/images/asko-appliances-cta.png"
          alt=""
          fill
          className="object-contain object-right"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
    </div>
  );
}

/* ── Dashboard page ────────────────────────────── */

export default function AccountDashboardPage() {
  const { stage, user } = useAccount();
  const greeting = getGreeting();

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      {/* Greeting */}
      {stage === 'skeleton' ? (
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-8 w-[340px]" />
          <SkeletonBlock className="h-5 w-[180px]" />
        </div>
      ) : (
        <h1 className="text-[32px] lg:text-[42px] font-medium leading-tight tracking-[-0.01em] text-text-main">
          {greeting},<br />
          {user?.name}!
        </h1>
      )}

      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-4 lg:hidden">
        <RequestsCard />
        <CertificatesCard />
        <PaymentCard />
      </div>

      {/* Desktop: 3-column stat cards */}
      <div className="hidden lg:grid grid-cols-3 gap-6">
        <RequestsCardDesktop />
        <CertificatesCard />
        <PaymentCard />
      </div>

      {/* Desktop: last request card */}
      <div className="hidden lg:block">
        <LastRequestCard />
      </div>

      {/* CTA banner */}
      <CtaBanner />
    </div>
  );
}

/* Desktop version of requests card (without "Последняя заявка" inline) */
function RequestsCardDesktop() {
  const { stage } = useAccount();

  if (stage === 'skeleton') {
    return <SkeletonCard className="h-[200px]" />;
  }

  return (
    <div className="bg-[#E8E8E8] p-6 flex flex-col">
      <span className="text-lg font-medium leading-[22px] tracking-[-0.01em] text-text-main">
        Мои заявки:
      </span>
      <span className="text-[96px] font-normal leading-none tracking-[-0.01em] text-text-main mt-2">
        0
      </span>
    </div>
  );
}
