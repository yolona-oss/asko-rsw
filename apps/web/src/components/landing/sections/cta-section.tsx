'use client';

import { useState } from 'react';
import { SkeletonImage } from '@/components/landing/skeleton-image';

export function CtaSection() {
  const [messenger, setMessenger] = useState('telegram');

  return (
    <section id="cta" className="relative">
      <SkeletonImage
        src="/images/91a976b91feaec523511756feaddfcb4585e85ff.webp"
        alt=""
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/62" />
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-32">
          <div className="flex flex-col gap-2 lg:max-w-[377px]">
            <h2 className="text-[32px] leading-9 md:text-[42px] md:leading-[46px] font-medium text-page-bg">
              Доверьте ремонт техники ASKO профессионалам
            </h2>
            <p className="text-base lg:text-lg leading-[22px] tracking-[-0.01em] text-page-bg/60">
              Используем оригинальные комплектующие и соблюдаем стандарты производителя. Мастер свяжется с вами для диагностики и согласования удобного времени выезда.
            </p>
          </div>

          <div className="flex flex-col gap-6 lg:gap-8 w-full lg:max-w-[452px]">
            <h3 className="text-[28px] leading-8 md:text-[42px] md:leading-[46px] font-medium text-page-bg">
              Оставить заявку на ремонт
            </h3>
            <div className="flex flex-col gap-6 lg:gap-10">
              <div className="flex flex-col gap-6 lg:gap-10">
                <input
                  type="text"
                  placeholder="Ваше имя"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] text-sm text-[#737373] placeholder:text-[#737373]"
                />
                <div className="flex flex-col gap-4">
                  <input
                    type="tel"
                    placeholder="Номер телефона или почта для связи"
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] text-sm text-[#737373] placeholder:text-[#737373]"
                  />
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="messenger"
                        checked={messenger === 'telegram'}
                        onChange={() => setMessenger('telegram')}
                        className="w-4 h-4 accent-[#193CB8]"
                      />
                      <span className="text-sm text-[#737373]">Telegram</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="messenger"
                        checked={messenger === 'whatsapp'}
                        onChange={() => setMessenger('whatsapp')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-[#737373]">Whatsapp</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="messenger"
                        checked={messenger === 'max'}
                        onChange={() => setMessenger('max')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-[#737373]">MAX</span>
                    </label>
                  </div>
                </div>
              </div>
              {/* Mobile: full-width red. Desktop: fit dark */}
              <button
                type="button"
                className="flex md:hidden items-center justify-center w-full py-3 text-sm font-medium text-white bg-brand-red shadow-sm"
              >
                Оставить заявку
              </button>
              <button
                type="button"
                className="hidden md:inline-flex items-center justify-center w-fit px-6 py-2 text-sm font-medium text-white bg-brand-red shadow-sm"
              >
                Оставить заявку
              </button>
            </div>
            <p className="text-sm leading-[22px] tracking-[-0.01em] text-page-bg/60">
              Мы ответим в течение 5 минут. Без обязательств.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
