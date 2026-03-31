'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
  title: string;
  mobile?: boolean;
}

export function ProductGallery({ images, title, mobile }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    setActiveIndex(idx);
  }, []);

  const goToSlide = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.offsetWidth, behavior: 'smooth' });
    setActiveIndex(index);
  }, []);

  // Mobile: horizontal slider with arrows and dots
  if (mobile) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={() => goToSlide(Math.max(0, activeIndex - 1))}
            className="flex-shrink-0"
            aria-label="Предыдущее фото"
          >
            <svg className="w-6 h-6 text-text-main" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory flex-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {images.map((img, i) => (
              <div key={i} className="flex-shrink-0 w-full snap-start">
                <div className="relative w-full aspect-[293/410]">
                  <Image src={img} alt={`${title} ${i + 1}`} fill className="object-cover" />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => goToSlide(Math.min(images.length - 1, activeIndex + 1))}
            className="flex-shrink-0"
            aria-label="Следующее фото"
          >
            <svg className="w-6 h-6 text-text-main" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex gap-[6px]">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToSlide(i)}
              className={`w-[13px] h-[13px] rounded-full ${
                activeIndex === i ? 'bg-brand-red' : 'bg-[#A6A6A6]'
              }`}
              aria-label={`Фото ${i + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop: vertical thumbnails + main image
  return (
    <div className="flex gap-[23px] flex-shrink-0">
      {/* Thumbnails column */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
          aria-label="Предыдущее фото"
        >
          <svg className="w-6 h-6 text-text-main" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </button>

        <div className="flex flex-col gap-4">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative w-[107px] h-[144px] overflow-hidden ${
                activeIndex === i
                  ? 'border-2 border-text-main/49'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={img} alt={`${title} ${i + 1}`} fill className="object-cover p-1" />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setActiveIndex(Math.min(images.length - 1, activeIndex + 1))}
          aria-label="Следующее фото"
        >
          <svg className="w-6 h-6 text-text-main" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Main image */}
      <div className="relative w-[468px] h-[656px] flex-shrink-0">
        <Image
          src={images[activeIndex]}
          alt={title}
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
