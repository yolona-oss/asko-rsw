'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from '@/components/account/account-provider';
import { getGreeting, displayName } from '@/lib/account';

export function DealerDashboard() {
  const { user } = useAccount();
  const greeting = getGreeting();

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      {/* Greeting */}
      <h1 className="text-[32px] lg:text-[42px] font-medium leading-tight tracking-[-0.01em] text-text-main">
        {greeting},<br />
        {user && displayName(user)}!
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Мои клиенты */}
        <div className="bg-white rounded-sm border border-border-light p-6 flex flex-col gap-2">
          <span className="text-base font-medium text-text-sub">Мои клиенты</span>
          <span className="text-[72px] lg:text-[96px] font-normal leading-none text-text-main">
            32
          </span>
        </div>

        {/* Заработанные баллы */}
        <div className="bg-white rounded-sm border border-border-light p-6 flex flex-col gap-2">
          <span className="text-base font-medium text-text-sub">Заработанные баллы</span>
          <span className="text-[72px] lg:text-[96px] font-normal leading-none text-text-main">
            3245
          </span>
        </div>
      </div>

      {/* CTA Banner - create certificate */}
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
              Необходимо выпустить
              <br />новый сертификат?
            </h3>
            <p className="text-base lg:text-lg lg:leading-[22px] tracking-[-0.01em] text-white">
              Создайте сертификат для клиента после продажи техники. Это позволит
              активировать гарантию и начислить бонусные баллы.
            </p>
          </div>
          <Link
            href="/account/certificates/create"
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
