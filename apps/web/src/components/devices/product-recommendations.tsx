'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const articles = [
  {
    image: '/images/aacceddc53458e64cbc550c02783fc474d29ac3a.webp',
    title: 'Почему техника ASKO требует профессионального ремонта',
    description: 'Техника ASKO отличается сложной инженерией и требует точной диагностики. Использование оригинальных комплектующих и соблюдение стандартов производителя обеспечивает надёжную и стабильную работу оборудования.',
  },
  {
    image: '/images/b9702e3c768dd388a49acb4be05c6b9e9e479151.webp',
    title: 'Признаки неисправности, которые нельзя игнорировать',
    description: 'Посторонние шумы, ошибки на дисплее или снижение эффективности работы могут указывать на неисправность. Своевременная диагностика позволяет избежать серьёзных поломок и дорогостоящего ремонта.',
  },
  {
    image: '/images/2927a2727c7df46ae968c1155cd7e6c670e76449.webp',
    title: 'Преимущества использования оригинальных запчастей',
    description: 'Оригинальные комплектующие полностью совместимы с техникой ASKO и гарантируют корректную работу всех систем. Это продлевает срок службы оборудования и исключает повторные неисправности.',
  },
  {
    image: '/images/29309b9087a9ff8ae0e635c97d719c7bf82ed757.webp',
    title: 'Как продлить срок службы бытовой техники ASKO',
    description: 'Регулярное обслуживание, правильная эксплуатация и своевременная диагностика помогают сохранить работоспособность техники на долгие годы и избежать непредвиденных поломок.',
  },
];

export function ProductRecommendations() {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    setActiveSlide(idx);
  }, []);

  const goToSlide = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.offsetWidth, behavior: 'smooth' });
    setActiveSlide(index);
  }, []);

  return (
    <div className="flex flex-col gap-8 md:gap-12">
      <h2 className="text-[32px] leading-9 font-medium tracking-[-0.01em] text-text-main">
        Рекомендации по обслуживанию техники
      </h2>

      {/* Mobile: slider */}
      <div className="lg:hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {articles.map((article) => (
            <article
              key={article.title}
              className="flex-shrink-0 w-full snap-start flex flex-col gap-4 pr-4"
            >
              <div className="relative w-full aspect-[263/204] overflow-hidden">
                <Image src={article.image} alt={article.title} fill className="object-cover" />
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-medium leading-6 tracking-[-0.01em] text-[#150F0F] max-w-[204px]">
                  {article.title}
                </h3>
                <p className="text-base leading-[22px] tracking-[-0.01em] text-[#150F0F]">
                  {article.description}
                </p>
                <Link href="#" className="text-sm font-bold text-text-main underline tracking-[-0.01em]">
                  Читать статью...
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="flex justify-center gap-[6px] mt-6">
          {articles.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToSlide(i)}
              className={`w-[13px] h-[13px] rounded-full ${
                activeSlide === i ? 'bg-brand-red' : 'bg-[#A6A6A6]'
              }`}
              aria-label={`Слайд ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: 4-column grid */}
      <div className="hidden lg:grid grid-cols-4 gap-6">
        {articles.map((article) => (
          <article key={article.title} className="flex flex-col gap-6">
            <div className="relative w-full aspect-[262/204] overflow-hidden">
              <Image src={article.image} alt={article.title} fill className="object-cover" />
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#150F0F] max-w-[204px]">
                  {article.title}
                </h3>
                <p className="text-base leading-[22px] tracking-[-0.01em] text-[#150F0F]">
                  {article.description}
                </p>
              </div>
              <Link href="#" className="text-sm font-bold text-text-main underline tracking-[-0.01em]">
                Читать статью...
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
