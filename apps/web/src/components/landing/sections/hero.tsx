import Link from 'next/link';
import { Container } from '@asko/ui';
import { SkeletonImage } from '@/components/landing/skeleton-image';

export function HeroSection() {
  return (
    <section className="pt-8 md:pt-12 lg:pt-16">
      <Container>
        <div className="flex flex-col gap-8 md:gap-12">
          {/* Mobile: stacked column. Desktop: row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-16">
            <h1 className="text-[42px] leading-15 md:text-5xl lg:text-[56px] font-normal lg:leading-[60px] tracking-[-0.01em] uppercase text-text-main">
              Ремонт бытовой техники <br className="hidden lg:block" />на дому с гарантией
            </h1>
            <div className="flex flex-col gap-4 lg:max-w-[261px]">
              <p className="text-sm leading-4.5 tracking-[-0.01em] text-text-sub">
                Для заказа услуг компании &quot;Ремонт бытовой техники Москва&quot; вам потребуется всего несколько простых шагов.
              </p>
              <Link
                href="#services"
                className="inline-flex items-center gap-2 text-sm font-bold text-brand-red underline tracking-[-0.01em]"
              >
                Узнать больше...
                <svg className="w-6 h-6 text-text-main" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="relative w-full aspect-[358/159] md:aspect-[1120/486] overflow-hidden">
            <SkeletonImage
              src="/images/hero-bg.webp"
              alt="Ремонт бытовой техники ASKO"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
