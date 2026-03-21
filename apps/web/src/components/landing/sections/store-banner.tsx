import Link from 'next/link';
import { Container } from '@asko/ui';
import { SkeletonImage } from '@/components/landing/skeleton-image';

export function StoreBannerSection() {
  return (
    <section className="py-8 md:py-12 lg:py-16">
      <Container>
        <div className="flex flex-col gap-6 md:gap-12">
          <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-40">
            <h2 className="text-[32px] leading-9 md:text-[42px] md:leading-[46px] font-normal tracking-[-0.01em] text-text-main lg:max-w-[643px]">
              Используем оригинальные запчасти
            </h2>
            <div className="flex flex-col gap-4 lg:max-w-[318px]">
              <p className="text-lg leading-[22px] tracking-[-0.01em] text-text-sub">
                Используем только оригинальные комплектующие от проверенных производителей, чтобы гарантировать точную совместимость и долгий срок службы техники. Это обеспечивает стабильную работу оборудования без сбоев и исключает повторные поломки.
              </p>
              <Link
                href="#"
                className="inline-flex items-center gap-2 text-sm font-bold text-text-main underline tracking-[-0.01em]"
              >
                Узнать больше...
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="relative w-full aspect-[358/190] md:aspect-[1120/466] overflow-hidden flex items-end justify-center">
            <SkeletonImage
              src="/images/1193d61dbf4fc3ce48ae2b59274b4402d2e0cf38.webp"
              alt=""
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/36" />
            <div className="relative py-6 md:py-12">
              <SkeletonImage
                src="/images/asko-undertext-logo.svg"
                alt="ASKO Официальный магазин"
                width={654}
                height={198}
                className="w-[200px] md:w-[400px] lg:w-[654px] h-auto"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
