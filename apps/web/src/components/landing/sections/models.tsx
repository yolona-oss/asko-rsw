'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@asko/ui';

const tabs = ['Стиральные машины', 'Посудомоечные машины', 'Электроплиты', 'Варочные панели'];

const models = [
  {
    image: '/images/7d57ebe13de0ab80138bca5f4062e2c0650cf8bb.png',
    title: 'Сушильные машины Asko -T108HBW',
    description: 'Сушильная машина ASKO T108HB.W — это современное решение для эффективного и бережного ухода за бельём в домашних условиях. Модель из серии Classic воплощает в себе скандинавский подход к дизайну: лаконичные формы, белоснежный цвет корпуса и панели управления органично впишутся в любой интерьер',
    column: 'left',
  },
  {
    image: '/images/00f921adbbe354ea048e60bb3ee0589764b18c7b.jpg',
    title: 'Стиральная машина Asko W4114C.W/3',
    description: 'Стиральная машина Asko W4114C. W/3 — стандартная по габаритам модель с дисплеем, который дополняет функционал оборудования и помогает увидеть всю необходимую информацию, такую как температуру стирки, количество установленных оборотов, а главное Вы всегда сможете посмотреть, сколько осталось времени до завершения стирки, что позволит спланировать свои дела.',
    column: 'right',
  },
  {
    image: '/images/c421a86e871ef4c3367e99cf70ea788325c0bfa2.png',
    title: 'Стиральная машина Asko WMC6863P.W/1',
    description: 'Стиральная машина Asko WMC6863P.W/1 — отдельностоящая модель белого цвета. Благодаря стильному и современному дизайну она впишется в интерьер любой ванной комнаты или постирочной. Внутри располагается бак из нержавеющей стали — надежного и функционального сплава, который не поддается коррозии.',
    column: 'left',
  },
  {
    image: '/images/b9fd50ea648ab558085721e0f33610b5b0b61bac.png',
    title: 'Стиральная машина Asko WMC6863P.W/1',
    description: 'Стиральная машина Asko WMC6863P.W/1 — отдельностоящая модель белого цвета. Благодаря стильному и современному дизайну она впишется в интерьер любой ванной комнаты или постирочной. Внутри располагается бак из нержавеющей стали — надежного и функционального сплава, который не поддается коррозии.',
    column: 'right',
  },
];

function ModelCard({ model }: { model: typeof models[number] }) {
  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <div className="relative w-full aspect-[358/400] lg:aspect-[548/769] overflow-hidden">
        <Image
          src={model.image}
          alt={model.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-col gap-4">
        <h3 className="text-2xl leading-7 md:text-[32px] md:leading-9 font-normal tracking-[-0.01em] text-text-main">
          {model.title}
        </h3>
        <div className="flex flex-col gap-4">
          <p className="text-base lg:text-lg leading-[22px] tracking-[-0.01em] text-text-sub">
            {model.description}
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-2 text-base lg:text-lg font-bold text-text-main underline tracking-[-0.01em]"
          >
            Узнать больше...
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ModelsSection() {
  const [activeTab, setActiveTab] = useState('Стиральные машины');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const leftModels = models.filter((m) => m.column === 'left');
  const rightModels = models.filter((m) => m.column === 'right');

  return (
    <section id="models" className="py-8 md:py-12 lg:py-16">
      <Container>
        <div className="flex flex-col gap-8 md:gap-12">
          <div className="flex flex-col gap-6 md:gap-12">
            <h2 className="text-[32px] leading-9 md:text-[42px] md:leading-[46px] font-normal tracking-[-0.01em] text-text-main">
              Описание моделей
            </h2>

            {/* Mobile dropdown */}
            <div className="md:hidden relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-between w-fit px-4 py-2 text-lg font-medium text-text-main bg-white border border-border-light"
              >
                <span>{activeTab}</span>
                <svg className={`w-4 h-4 ml-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-border-light shadow-lg">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => { setActiveTab(tab); setDropdownOpen(false); }}
                      className={`block w-full px-4 py-2 text-left text-base ${activeTab === tab ? 'bg-dark text-white' : 'text-text-main hover:bg-page-bg'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop tabs */}
            <div className="hidden md:flex flex-wrap gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-lg tracking-[-0.01em] ${activeTab === tab
                      ? 'bg-black text-page-bg border border-black'
                      : 'bg-page-bg text-text-main border border-border-light'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: single column */}
          <div className="flex flex-col gap-8 lg:hidden">
            {models.map((model) => (
              <ModelCard key={model.title + model.column} model={model} />
            ))}
          </div>

          {/* Desktop: staggered 2-col */}
          <div className="hidden lg:grid grid-cols-2 gap-x-14">
            <div className="flex flex-col gap-16">
              {leftModels.map((model) => (
                <ModelCard key={model.title + model.column} model={model} />
              ))}
            </div>
            <div className="flex flex-col gap-16 lg:mt-[350px]">
              {rightModels.map((model) => (
                <ModelCard key={model.title + model.column} model={model} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
