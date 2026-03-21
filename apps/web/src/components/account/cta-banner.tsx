import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface CTABannerProps {
  title: ReactNode;
  description: string;
  linkHref: string;
  linkLabel: string;
}

export function CTABanner({ title, description, linkHref, linkLabel }: CTABannerProps) {
  return (
    <div className="relative overflow-hidden bg-[#151515] rounded-sm">
      {/* Decorative red glow - top right */}
      <div className="absolute -top-[100px] -right-[100px] w-[800px] h-[500px] -rotate-[150deg] pointer-events-none">
        <div className="size-full bg-[radial-gradient(ellipse_at_center,_rgba(235,0,28,0.38)_0%,_transparent_70%)] blur-[69px]" />
      </div>
      {/* Decorative red glow - bottom left */}
      <div className="absolute -top-[200px] -left-[200px] w-[600px] h-[500px] rotate-[60deg] pointer-events-none">
        <div className="size-full bg-[radial-gradient(ellipse_at_center,_rgba(235,0,28,0.3)_0%,_transparent_70%)] blur-[62px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 lg:py-6 lg:px-10 flex flex-col gap-6 max-w-[480px]">
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl lg:text-[32px] font-medium lg:leading-[36px] tracking-[-0.01em] text-white">
            {title}
          </h3>
          <p className="text-base lg:text-lg lg:leading-[22px] tracking-[-0.01em] text-white">
            {description}
          </p>
        </div>
        <Link
          href={linkHref}
          className="flex items-center justify-center w-full lg:w-fit px-6 py-2.5 text-sm font-medium text-white bg-brand-red shadow-sm cursor-pointer"
        >
          {linkLabel}
        </Link>
      </div>

      {/* Appliance images - desktop only */}
      <div className="hidden lg:block absolute right-0 top-0 w-[430px] h-full">
        <Image
          src="/images/cta-stove.webp"
          alt=""
          width={205}
          height={179}
          className="absolute left-0 top-[102px] opacity-64 blur-[0.55px]"
        />
        <Image
          src="/images/cta-oven.webp"
          alt=""
          width={188}
          height={183}
          className="absolute left-[217px] top-[102px] opacity-64 blur-[0.55px] object-cover"
        />
        <Image
          src="/images/cta-washing-machine.webp"
          alt=""
          width={180}
          height={252}
          className="absolute left-[135px] top-[34px] rounded-[10px] object-cover"
        />
      </div>
    </div>
  );
}
