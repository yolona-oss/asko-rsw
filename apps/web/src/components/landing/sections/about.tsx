import { Container } from '@asko/ui';
import { SkeletonImage } from '@/components/landing/skeleton-image';

const stats = [
  {
    value: '1000+',
    label: 'Довольных клиентов',
    sublabel: 'доверили ремонт премиальной техники',
  },
  {
    value: '100%',
    label: 'Оригинальные комплектующие',
    sublabel: 'Используем детали от производителя ASKO.',
  },
  {
    value: '10+',
    label: 'лет опыта',
    sublabel: 'в ремонте премиальной техники',
  },
];

export function AboutSection() {
  return (
    <section id="about" className="py-8 md:py-12 lg:py-16">
      <Container>
        <div className="flex flex-col gap-4 md:gap-12">
          {/* Mobile: stacked. Desktop: side by side */}
          <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-14">
            <div className="flex flex-col gap-4 lg:gap-11 lg:max-w-[464px]">
              <h2 className="text-[42px] leading-[46px] md:text-5xl lg:text-[70px] font-medium lg:leading-[74px] tracking-[-0.01em] text-text-main">
                О компании ремонт <span className="text-[#EB001C]">ASKO</span>
              </h2>
              <p className="text-lg leading-[22px] tracking-[-0.01em] text-text-sub">
                Компания специализируется на профессиональном ремонте техники ASKO и других премиальных брендов, обеспечивая точную диагностику, качественное восстановление и надёжную работу оборудования.
              </p>
            </div>

            {/* Desktop: 3 stats in a row */}
            <div className="hidden lg:flex flex-wrap gap-12">
              {stats.map((stat) => (
                <div key={stat.value} className="flex flex-col gap-2 max-w-[175px]">
                  <div className="flex flex-col gap-1">
                    <span className="text-[54px] font-medium leading-[58px] tracking-[-0.01em] text-text-main">
                      {stat.value}
                    </span>
                    <span className="text-lg font-medium leading-[22px] tracking-[-0.01em] text-text-main">
                      {stat.label}
                    </span>
                  </div>
                  <span className="text-base leading-[22px] tracking-[-0.01em] text-text-sub">
                    {stat.sublabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: single image */}
          <div className="lg:hidden relative w-full aspect-[358/190] overflow-hidden">
            <SkeletonImage
              src="/images/about-components.webp"
              alt="Комплектующие ASKO"
              fill
              className="object-cover"
            />
          </div>

          {/* Mobile: stats in 2-col grid */}
          <div className="lg:hidden grid grid-cols-2 gap-x-16 gap-y-6">
            {stats.map((stat) => (
              <div key={stat.value} className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[28px] font-medium leading-8 tracking-[-0.01em] text-text-main">
                    {stat.value}
                  </span>
                  <span className="text-lg font-medium leading-[22px] tracking-[-0.01em] text-text-main">
                    {stat.label}
                  </span>
                </div>
                <span className="text-sm leading-[18px] tracking-[-0.01em] text-text-sub">
                  {stat.sublabel}
                </span>
              </div>
            ))}
          </div>

          {/* Desktop: 3 images row */}
          <div className="hidden lg:flex flex-row items-center gap-8 lg:gap-[306px]">
            <div className="flex gap-6">
              <div className="relative w-[262px] h-[262px] flex-shrink-0 overflow-hidden">
                <SkeletonImage src="/images/about-drum.webp" alt="Барабан ASKO" fill className="object-cover" />
              </div>
              <div className="relative w-[262px] h-[262px] flex-shrink-0 overflow-hidden">
                <SkeletonImage src="/images/about-parts.webp" alt="Запчасти ASKO" fill className="object-cover" />
              </div>
            </div>
            <div className="relative w-[262px] h-[262px] flex-shrink-0 overflow-hidden">
              <SkeletonImage src="/images/about-components.webp" alt="Комплектующие ASKO" fill className="object-cover" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
