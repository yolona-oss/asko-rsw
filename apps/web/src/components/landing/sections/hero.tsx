import Link from 'next/link';
import { Container } from '@asko/ui';
import { SkeletonImage } from '@/components/landing/skeleton-image';

export function HeroSection() {
  return (
    <section className="pt-8 md:pt-12 lg:pt-16">
      <Container>
        <div className="flex flex-col gap-8 md:gap-12">
          {/* Header row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-[63px]">
            <h1 className="text-[32px] leading-[36px] md:text-[42px] md:leading-[46px] lg:text-[56px] lg:leading-[60px] font-normal tracking-[-0.01em] lg:tracking-[-0.56px] lg:uppercase text-[#323232]">
              Ремонт бытовой техники<br className="hidden lg:block" /> на дому с гарантией
            </h1>
            <div className="flex flex-col gap-2 lg:w-[261px] lg:flex-shrink-0">
              <p className="text-sm leading-[18px] tracking-[-0.14px] text-[#515151]">
                Для заказа услуг компании &quot;Ремонт бытовой техники Москва&quot; вам потребуется всего несколько простых шагов.
              </p>
              <Link
                href="#services"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#D7102A] underline tracking-[-0.14px] leading-[18px]"
              >
                Узнать больше...
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Hero image */}
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
