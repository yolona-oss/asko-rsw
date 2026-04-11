'use client';

import { useState } from 'react';

type Messenger = 'telegram' | 'whatsapp' | 'max';

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-1 cursor-pointer select-none">
      <span
        onClick={onChange}
        className={`flex items-center justify-center w-4 h-4 border transition-colors ${
          checked
            ? 'bg-info-deep border-info-deep'
            : 'bg-surface border-border-light shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-text-on-dark" viewBox="0 0 14 14" fill="none">
            <path d="M11.667 3.5L5.25 9.917 2.333 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-sm leading-[21px] tracking-[0.005em] text-text-sub">{label}</span>
    </label>
  );
}

export function CtaSection() {
  const [messengers, setMessengers] = useState<Set<Messenger>>(new Set(['telegram']));

  const toggleMessenger = (m: Messenger) => {
    setMessengers((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  return (
    <section id="cta" className="bg-dark">
      <div className="relative overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src="/images/cta-bg.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-dark-deep/62" />
        </div>

        {/* Content — constrained width */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 py-12 lg:py-20">
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-24">
            {/* Left: headline + description */}
            <div className="flex flex-col gap-3 lg:w-[377px] lg:flex-shrink-0 lg:pt-8">
              <h2 className="text-[28px] leading-8 lg:text-[42px] lg:leading-[46px] font-medium text-text-on-dark">
                Доверьте ремонт техники ASKO профессионалам
              </h2>
              <p className="text-sm lg:text-base leading-[22px] tracking-[-0.01em] text-text-on-dark/60">
                Используем оригинальные комплектующие
                и&nbsp;соблюдаем стандарты производителя.
                Мастер свяжется с&nbsp;вами для диагностики
                и&nbsp;согласования удобного времени выезда.
              </p>
            </div>

            {/* Right: form */}
            <div className="flex flex-col gap-6 w-full lg:w-[452px] lg:flex-shrink-0">
              <h3 className="text-[24px] leading-7 lg:text-[36px] lg:leading-[40px] font-medium text-text-on-dark">
                Оставить заявку<br />на ремонт
              </h3>

              <div className="flex flex-col gap-6">
                {/* Inputs */}
                <div className="flex flex-col gap-6">
                  <input
                    type="text"
                    placeholder="Ваше имя..."
                    className="w-full px-3 py-2 min-h-[36px] bg-surface border border-border-light text-sm text-text-main placeholder:text-text-sub outline-none"
                  />
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Телефон или логин в мессенджере..."
                      className="w-full px-3 py-2 min-h-[36px] bg-surface border border-border-light text-sm text-text-main placeholder:text-text-sub outline-none"
                    />
                    <div className="flex items-center gap-6">
                      <Checkbox checked={messengers.has('telegram')} onChange={() => toggleMessenger('telegram')} label="Telegram" />
                      <Checkbox checked={messengers.has('whatsapp')} onChange={() => toggleMessenger('whatsapp')} label="Whatsapp" />
                      <Checkbox checked={messengers.has('max')} onChange={() => toggleMessenger('max')} label="MAX" />
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  className="flex items-center justify-center w-full lg:w-fit min-h-[40px] px-8 py-2.5 text-sm font-medium text-text-on-brand bg-brand-red-dark shadow-sm cursor-pointer"
                >
                  Вызвать мастера
                </button>
              </div>

              <p className="text-xs lg:text-sm leading-[18px] tracking-[-0.01em] text-text-on-dark/60 text-center lg:text-left">
                Мы ответим в течение 5 минут. Без обязательств.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
