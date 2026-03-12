'use client';

import { useState } from 'react';
import { Container } from '@asko/ui';
import { SkeletonImage } from '@/components/landing/skeleton-image';

const faqs = [
  {
    question: 'Сколько стоит ремонт техники?',
    answer: null,
  },
  {
    question: 'Используете ли вы оригинальные запчасти?',
    answer: 'Да, мы используем только оригинальные комплектующие ASKO и проверенные детали от производителя. Это гарантирует полную совместимость, стабильную работу техники и длительный срок службы после ремонта.',
  },
  {
    question: 'Сколько времени занимает ремонт?',
    answer: null,
  },
  {
    question: 'Предоставляете ли вы гарантию на ремонт?',
    answer: null,
  },
  {
    question: 'Можно ли вызвать мастера на дом?',
    answer: null,
  },
  {
    question: 'Какие бренды техники вы ремонтируете?',
    answer: null,
  },
];

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string | null;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        className="w-full flex items-center justify-between py-4 text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-lg md:text-2xl font-medium leading-[22px] md:leading-9 tracking-[-0.01em] text-text-main pr-4">
          {question}
        </span>
        <svg
          className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 text-text-main transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div className="w-full h-px bg-border-light" />
      {isOpen && answer && (
        <p className="pt-4 pb-2 text-base md:text-lg leading-[22px] tracking-[-0.01em] text-text-sub">
          {answer}
        </p>
      )}
    </div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(1);

  return (
    <section id="faq" className="py-8 md:py-12 lg:py-16">
      <Container>
        <div className="flex flex-col gap-8 md:gap-12">
          <h2 className="text-[42px] leading-[46px] lg:text-[70px] font-medium lg:leading-[74px] tracking-[-0.01em] text-text-main lg:max-w-[739px]">
            Часто задаваемые вопросы
          </h2>

          {/* Desktop: FAQs left + image right */}
          <div className="hidden lg:flex items-start gap-8">
            <div className="flex flex-col flex-1 max-w-[548px]">
              {faqs.map((faq, i) => (
                <FaqItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))}
            </div>

            <div className="relative w-[548px] h-[616px] flex-shrink-0 overflow-hidden">
              <SkeletonImage
                src="/images/1731b900ff4fac95565c50b611fe49f94d6da6dd.jpg"
                alt="ASKO"
                fill
                className="object-cover brightness-[0.71]"
              />
              <div className="absolute bottom-12 right-12">
                <SkeletonImage
                  src="/images/logo.svg"
                  alt="ASKO"
                  width={360}
                  height={108}
                  className="brightness-0 invert opacity-90"
                />
              </div>
            </div>
          </div>

          {/* Mobile: single column FAQs, no image */}
          <div className="flex flex-col lg:hidden">
            {faqs.map((faq, i) => (
              <FaqItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
