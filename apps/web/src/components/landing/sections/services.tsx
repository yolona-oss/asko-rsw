'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@asko/ui';
import { SkeletonImage } from '@/components/landing/skeleton-image';

const categories = [
  'Холодильники',
  'Посудомоечные машины',
  'Стиральные машины',
  'Варочные панели',
  'Духовые шкафы',
  'Сушильные машины',
  'Кофемашины',
];

const serviceData: Record<string, { title: string; description: string; image: string }> = {
  'Холодильники': {
    title: 'Ремонт холодильников в Москве',
    description: 'Диагностируем и устраняем неисправности холодильников любой сложности. Используем оригинальные комплектующие и соблюдаем стандарты производителя. Гарантируем стабильную и надёжную работу техники после ремонта.',
    image: '/images/04f9946e5d2fbe57ef5062dd4a4e7ce3ab905b81.png',
  },
  'Посудомоечные машины': {
    title: 'Ремонт посудомоечных машин в Москве',
    description: 'Восстанавливаем работоспособность посудомоечных машин ASKO. Замена деталей, устранение протечек, ремонт электроники с гарантией качества.',
    image: '/images/04f9946e5d2fbe57ef5062dd4a4e7ce3ab905b81.png',
  },
  'Стиральные машины': {
    title: 'Ремонт стиральных машин в Москве',
    description: 'Профессиональный ремонт стиральных машин ASKO с выездом на дом. Замена подшипников, ТЭНов, модулей управления.',
    image: '/images/04f9946e5d2fbe57ef5062dd4a4e7ce3ab905b81.png',
  },
  'Варочные панели': {
    title: 'Ремонт варочных панелей в Москве',
    description: 'Ремонт индукционных и газовых варочных панелей ASKO. Диагностика, замена конфорок и электронных блоков.',
    image: '/images/04f9946e5d2fbe57ef5062dd4a4e7ce3ab905b81.png',
  },
  'Духовые шкафы': {
    title: 'Ремонт духовых шкафов в Москве',
    description: 'Устранение неисправностей духовых шкафов ASKO. Ремонт электроники, замена нагревательных элементов.',
    image: '/images/04f9946e5d2fbe57ef5062dd4a4e7ce3ab905b81.png',
  },
  'Сушильные машины': {
    title: 'Ремонт сушильных машин в Москве',
    description: 'Профессиональный ремонт сушильных машин ASKO с использованием оригинальных комплектующих.',
    image: '/images/04f9946e5d2fbe57ef5062dd4a4e7ce3ab905b81.png',
  },
  'Кофемашины': {
    title: 'Ремонт кофемашин в Москве',
    description: 'Ремонт и обслуживание кофемашин ASKO. Чистка, замена деталей, настройка.',
    image: '/images/04f9946e5d2fbe57ef5062dd4a4e7ce3ab905b81.png',
  },
};

export function ServicesSection() {
  const [active, setActive] = useState('Холодильники');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const service = serviceData[active];

  return (
    <section id="services" className="py-8 md:py-12 lg:py-16">
      <Container>
        <div className="flex flex-col gap-12">
          {/* Mobile: heading + dropdown. Desktop: tab buttons */}
          <div className="flex flex-col gap-6">
            <h2 className="text-[32px] leading-9 md:text-[42px] md:leading-[46px] font-normal tracking-[-0.01em] text-text-main">
              Услуги ремонта
            </h2>

            {/* Mobile dropdown */}
            <div className="md:hidden relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-between w-fit px-4 py-2 text-lg font-medium text-text-main bg-white border border-border-light"
              >
                <span>{active}</span>
                <svg className={`w-4 h-4 ml-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-border-light shadow-lg">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => { setActive(cat); setDropdownOpen(false); }}
                      className={`block w-full px-4 py-2 text-left text-base ${active === cat ? 'bg-dark text-white' : 'text-text-main hover:bg-page-bg'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop tabs */}
            <div className="hidden md:flex flex-wrap gap-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActive(cat)}
                  className={`px-6 py-2 text-lg tracking-[-0.01em] transition-colors ${active === cat
                    ? 'bg-dark text-page-bg'
                    : 'bg-page-bg text-text-main border border-border-light hover:bg-border-light'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: stacked column. Desktop: side by side */}
          <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-[120px]">
            <div className="flex flex-col gap-4 lg:max-w-[357px] lg:flex-shrink-0">
              <h3 className="text-2xl leading-7 md:text-[32px] md:leading-9 font-normal tracking-[-0.01em] text-text-main">
                {service.title}
              </h3>
              <p className="text-lg leading-[22px] tracking-[-0.01em] text-text-sub">
                {service.description}
              </p>

              {/* Mobile: full-width red CTA. Desktop: dark button */}
              <Link
                href="#cta"
                className="flex md:hidden items-center justify-center w-full py-3 text-sm font-medium text-white bg-brand-red shadow-sm"
              >
                Вызвать мастера
              </Link>
              <Link
                href="#cta"
                className="hidden md:inline-flex items-center justify-center w-fit px-6 py-2 text-sm font-medium text-white bg-dark shadow-sm"
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
