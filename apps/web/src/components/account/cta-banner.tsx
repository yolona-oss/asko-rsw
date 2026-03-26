import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface CTABannerProps {
  title: ReactNode;
  description: string;
  linkHref: string;
  linkLabel: string;
  /** "default" - horizontal with appliance images; "compact" - vertical centered, no images */
  variant?: 'default' | 'compact';
  className?: string;
}

export function CTABanner({ title, description, linkHref, linkLabel, variant = 'default', className = '' }: CTABannerProps) {
  if (variant === 'compact') {
    return (
      <div className={`relative overflow-hidden bg-[#151515] rounded-sm ${className}`}>
        {/* Decorative red glow - top right */}
        <div className="absolute -top-[100px] -right-[100px] w-[800px] h-[500px] -rotate-[150deg] pointer-events-none animate-[glow-drift-1_8s_ease-in-out_infinite]">
          <div className="size-full bg-[radial-gradient(ellipse_at_center,_rgba(235,0,28,0.38)_0%,_transparent_70%)] blur-[69px]" />
        </div>
        {/* Decorative red glow - bottom left */}
        <div className="absolute -top-[200px] -left-[200px] w-[600px] h-[500px] rotate-[60deg] pointer-events-none animate-[glow-drift-2_10s_ease-in-out_infinite]">
          <div className="size-full bg-[radial-gradient(ellipse_at_center,_rgba(235,0,28,0.3)_0%,_transparent_70%)] blur-[62px]" />
        </div>

        {/* Content - centered */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center gap-6 p-6 h-full">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-medium leading-[28px] tracking-[-0.01em] text-white">
              {title}
            </h3>
            <p className="text-lg leading-[22px] tracking-[-0.01em] text-white">
              {description}
            </p>
          </div>
          <Link
            href={linkHref}
            className="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-brand-red shadow-sm cursor-pointer"
          >
            {linkLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#151515] rounded-sm ${className}`}>
      {/* Decorative red glow - top right */}
      <div className="absolute -top-[100px] -right-[100px] w-[800px] h-[500px] -rotate-[150deg] pointer-events-none animate-[glow-drift-1_8s_ease-in-out_infinite]">
        <div className="size-full bg-[radial-gradient(ellipse_at_center,_rgba(235,0,28,0.38)_0%,_transparent_70%)] blur-[69px]" />
      </div>
      {/* Decorative red glow - bottom left */}
      <div className="absolute -top-[200px] -left-[200px] w-[600px] h-[500px] rotate-[60deg] pointer-events-none animate-[glow-drift-2_10s_ease-in-out_infinite]">
        <div className="size-full bg-[radial-gradient(ellipse_at_center,_rgba(235,0,28,0.3)_0%,_transparent_70%)] blur-[62px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 lg:py-6 lg:px-10 flex flex-col gap-6 max-w-[480px]">
        <div className="flex flex-col gap-2">
          <h3 className="text-[32px] font-medium leading-[36px] tracking-[-0.01em] text-white">
            {title}
          </h3>
          <p className="text-lg leading-[22px] tracking-[-0.01em] text-white">
            {description}
          </p>
        </div>
        <Link
          href={linkHref}
          className="flex items-center justify-center w-full lg:w-fit h-[46px] lg:h-auto px-6 py-2.5 text-sm font-medium text-white bg-brand-red shadow-sm cursor-pointer"
        >
          {linkLabel}
        </Link>
      </div>

      {/* Appliance images - desktop: absolute right; mobile: stacked below */}
      <div className="relative h-[280px] lg:absolute lg:right-0 lg:top-0 lg:w-[430px] lg:h-full">
        <Image
          src="/images/cta-stove.webp"
          alt=""
          width={205}
          height={179}
          className="absolute left-[calc(50%+40px)] lg:left-0 bottom-0 lg:bottom-auto lg:top-[102px] opacity-64 blur-[0.55px]"
        />
        <Image
          src="/images/cta-oven.webp"
          alt=""
          width={188}
          height={183}
          className="absolute left-[-24px] lg:left-[217px] bottom-0 lg:bottom-auto lg:top-[102px] opacity-64 blur-[0.55px] object-cover"
        />
        <Image
          src="/images/cta-washing-machine.webp"
          alt=""
          width={215}
          height={302}
          className="absolute left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-[135px] bottom-0 lg:bottom-auto lg:top-[34px] rounded-[10px] object-cover lg:w-[180px] lg:h-[252px]"
        />
      </div>
    </div>
  );
}
