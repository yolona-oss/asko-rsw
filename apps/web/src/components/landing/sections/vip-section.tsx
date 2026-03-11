import Link from 'next/link';

const vipCards = [
  {
    title: 'Привилегии VIP клиентов сервиса ASKO',
    description: 'Специальные условия обслуживания и приоритетный доступ к сервису',
  },
  {
    title: 'Преимущества VIP обслуживания ASKO',
    description: 'Приоритетный выезд мастера и использование оригинальных комплектующих',
  },
  {
    title: 'Индивидуальное сопровождение на всех этапах',
    description: 'Персональный специалист контролирует процесс ремонта от диагностики до завершения',
  },
];

export function VipSection() {
  return (
    <section
      className="relative py-8 md:py-16 lg:py-24"
      style={{
        background: `linear-gradient(0deg, rgba(0,0,0,0.47), rgba(0,0,0,0.47)), url(/images/b5b74734a8947326bb92bf563b03dd350fa5f2dc.jpg) center/cover`,
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Mobile layout */}
        <div className="flex flex-col gap-6 lg:hidden">
          <h2 className="text-[42px] leading-[46px] font-medium text-page-bg">
            Станьте VIP клиентом ASKO
          </h2>
          <p className="text-lg font-bold leading-[22px] tracking-[-0.01em] text-page-bg">
            VIP клиенты получают приоритетный доступ к сервису, персональное сопровождение и обслуживание с использованием оригинальных комплектующих ASKO.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {vipCards.slice(0, 2).map((card) => (
              <div key={card.title} className="bg-page-bg/[0.19] p-4">
                <h3 className="text-lg font-normal leading-[22px] tracking-[-0.01em] text-page-bg mb-3">
                  {card.title}
                </h3>
                <p className="text-sm leading-[18px] tracking-[-0.01em] text-page-bg">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-page-bg/[0.19] p-4">
            <h3 className="text-lg font-normal leading-[22px] tracking-[-0.01em] text-page-bg mb-3">
              {vipCards[2].title}
            </h3>
            <p className="text-sm leading-[18px] tracking-[-0.01em] text-page-bg">
              {vipCards[2].description}
            </p>
          </div>

          <Link
            href="/register"
            className="flex items-center justify-center w-full py-3 text-sm font-medium text-white bg-brand-red shadow-sm"
          >
            Вступить
          </Link>
        </div>

        {/* Desktop layout: row 1 = text+button (right-aligned), row 2 = cards */}
        <div className="hidden lg:flex flex-col gap-12">
          {/* Row 1: text block aligned to the right */}
          <div className="flex justify-end">
            <div className="flex flex-col gap-8 max-w-[555px]">
              <div className="flex flex-col gap-6">
                <h2 className="text-[70px] font-medium leading-[74px] text-page-bg">
                  Станьте VIP клиентом ASKO
                </h2>
                <p className="text-lg font-bold leading-[22px] tracking-[-0.01em] text-page-bg">
                  VIP клиенты получают приоритетный доступ к сервису, персональное сопровождение и обслуживание с использованием оригинальных комплектующих ASKO.
                </p>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center justify-center w-fit px-6 py-2 text-sm font-medium text-white bg-brand-red shadow-sm"
              >
                Стать VIP
              </Link>
            </div>
          </div>

          {/* Row 2: first two cards together, third card pushed to the right */}
          <div className="flex items-start justify-between">
            <div className="flex gap-6">
              {vipCards.slice(0, 2).map((card) => (
                <div key={card.title} className="bg-page-bg/[0.19] p-6 w-[262px] h-[272px]">
                  <h3 className="text-2xl font-normal leading-7 tracking-[-0.01em] text-page-bg mb-4">
                    {card.title}
                  </h3>
                  <p className="text-base leading-[22px] tracking-[-0.01em] text-page-bg">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-page-bg/[0.19] p-6 w-[262px] h-[272px]">
              <h3 className="text-2xl font-normal leading-7 tracking-[-0.01em] text-page-bg mb-4">
                {vipCards[2].title}
              </h3>
              <p className="text-base leading-[22px] tracking-[-0.01em] text-page-bg">
                {vipCards[2].description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
