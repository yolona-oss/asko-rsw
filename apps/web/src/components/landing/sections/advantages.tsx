import { Container } from '@asko/ui';

const advantages = [
  {
    keyword: 'Опытные',
    subtitle: 'Специалисты\nсервиса',
    description: 'Мастера с опытом работы с техникой ASKO.  Работаем по стандартам бренда.',
  },
  {
    keyword: 'Оригинал',
    subtitle: 'Запчасти\nот производителя',
    description: 'Мастера с опытом работы с техникой ASKO.  Работаем по стандартам бренда.',
  },
  {
    keyword: 'Сервис',
    subtitle: 'премиального\nуровня',
    description: 'Мастера с опытом работы с техникой ASKO.  Работаем по стандартам бренда.',
  },
];

export function AdvantagesSection() {
  return (
    <section className="py-8 md:py-12 lg:py-16">
      <Container>
        <div className="flex flex-col gap-2 md:grid md:grid-cols-3 md:gap-1">
          {advantages.map((item) => (
            <div key={item.keyword} className="flex flex-col gap-2 md:gap-1">
              {/* Mobile: dark bg, white text. Desktop: bordered */}
              <div className="bg-dark md:bg-transparent md:border-[7px] md:border-border-light/54 flex flex-col items-center justify-center py-16 md:py-12 px-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-[42px] leading-[46px] md:text-5xl lg:text-[64px] font-bold md:font-medium md:leading-[68px] tracking-[-0.01em] text-white md:text-brand-red">
                    {item.keyword}
                  </span>
                  <span className="text-[32px] leading-9 tracking-[-0.01em] text-white md:text-text-main whitespace-pre-wrap">
                    {item.subtitle}
                  </span>
                </div>
              </div>
              <div className="border-2 border-border-light/54 flex items-center justify-center py-8 px-8">
                <p className="text-lg leading-[18px] tracking-[-0.01em] text-text-sub text-center max-w-[284px]">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
