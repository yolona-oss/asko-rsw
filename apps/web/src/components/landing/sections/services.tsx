'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container, DataFilter } from '@asko/ui';
import type { FilterValues } from '@asko/ui';
import { SkeletonImage } from '@/components/skeleton';
import { useDeviceCategories } from '@/hooks/use-device-categories';

const fallbackService = {
  title: 'Ремонт бытовой техники ASKO',
  description: 'Диагностируем и устраняем неисправности техники любой сложности. Используем оригинальные комплектующие и соблюдаем стандарты производителя.',
  image: '/images/services-repair.webp',
};

function buildService(label: string) {
  return {
    title: `Ремонт: ${label}`,
    description: `Диагностируем и устраняем неисправности. Используем оригинальные комплектующие и соблюдаем стандарты производителя. Гарантируем стабильную и надёжную работу техники после ремонта.`,
    image: '/images/services-repair.webp',
  };
}

export function ServicesSection() {
  const { data: categories } = useDeviceCategories();
  const [filterValues, setFilterValues] = useState<FilterValues>({ category: '' });

  const filterDefs = useMemo(() => [{
    key: 'category',
    label: '',
    type: 'block' as const,
    options: (categories ?? []).map((c) => ({ value: c.name, label: c.labelPlural })),
  }], [categories]);

  const activeCategory = filterValues.category;
  const activeCategoryObj = categories?.find((c) => c.name === activeCategory);
  const service = activeCategoryObj
    ? buildService(activeCategoryObj.labelPlural)
    : fallbackService;

  return (
    <section id="services" className="py-8 md:py-12 lg:py-16">
      <Container>
        <div className="flex flex-col gap-8 md:gap-12">
          <div className="flex flex-col gap-6 md:gap-12">
            <h2 className="text-[32px] leading-9 md:text-[42px] md:leading-[46px] font-normal tracking-[-0.01em] text-text-main">
              Услуги ремонта
            </h2>

            <DataFilter
              filters={filterDefs}
              values={filterValues}
              onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
            />
          </div>

          {/* Content: text + image */}
          <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-[120px]">
            <div className="flex flex-col gap-4 lg:max-w-[357px] lg:flex-shrink-0">
              <h3 className="text-2xl leading-7 md:text-[32px] md:leading-9 font-normal tracking-[-0.01em] text-text-main">
                {service.title}
              </h3>
              <p className="text-lg leading-[22px] tracking-[-0.01em] text-text-sub">
                {service.description}
              </p>

              <Link
                href="#cta"
                className="flex md:hidden items-center justify-center w-full py-3 text-sm font-medium text-text-on-brand bg-brand-red shadow-sm"
              >
                Вызвать мастера
              </Link>
              <Link
                href="#cta"
                className="hidden md:inline-flex items-center justify-center w-fit px-6 py-2 text-sm font-medium text-text-on-dark bg-dark shadow-sm"
              >
                Вызвать мастера
              </Link>
            </div>

            <div className="relative w-full lg:flex-1 aspect-[358/231] lg:aspect-[643/413] overflow-hidden">
              <SkeletonImage
                src={service.image}
                alt={service.title}
                fill
                className="object-cover"
                style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2))' }}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
