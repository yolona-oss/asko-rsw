import Image from 'next/image';
import { Container } from '@asko/ui';

const features = [
  {
    title: 'Быстрый вход в личный кабинет',
    description: 'Получите доступ к информации о ремонте, истории обращений и статусу обслуживания. Все данные доступны в одном защищённом пространстве.',
    image: '/images/adv-1.jpg',
    imageLeft: true,
  },
  {
    title: 'Контроль статуса ремонта в реальном времени',
    description: 'Следите за статусом заявки, временем прибытия мастера и этапами ремонта. Вы всегда знаете, на каком этапе находится обслуживание.',
    image: '/images/adv-2.jpg',
    imageLeft: false,
  },
  {
    title: 'Система бонусов и привилегий',
    description: 'Получайте бонусные баллы за обслуживание и используйте их для получения скидок на ремонт и оригинальные комплектующие.',
    image: '/images/adv-3.jpg',
    imageLeft: true,
  },
];

export function PersonalAccountSection() {
  return (
    <section className="py-8 md:py-12 lg:py-16">
      <Container>
        <div className="flex flex-col gap-8 md:gap-12">
          <h2 className="text-[32px] leading-9 md:text-[42px] md:leading-[46px] font-normal tracking-[-0.01em] text-text-main md:max-w-[537px]">
            Контроль обслуживания через личный кабинет
          </h2>

          <div className="flex flex-col gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`flex flex-col lg:flex-row items-center gap-4 lg:gap-10 ${!feature.imageLeft ? 'lg:flex-row-reverse' : ''
                  }`}
              >
                <div className="relative w-full lg:w-[547px] flex-shrink-0 aspect-[332/319] lg:aspect-[547/478] overflow-hidden">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-4 lg:max-w-[357px]">
                  <h3 className="text-2xl leading-7 md:text-[32px] md:leading-9 font-medium tracking-[-0.01em] text-text-main">
                    {feature.title}
                  </h3>
                  <p className="text-lg leading-[22px] tracking-[-0.01em] text-text-sub">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
