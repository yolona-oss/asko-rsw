'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@asko/ui';
import { SkeletonImage } from '@/components/skeleton';
import { PlaceholderImage } from '@/components/placeholder-image';

import { articleApi } from '@/lib/api/article';

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  text: string;
  previewImage: string | null;
}

// Static fallback articles for when the API has no data
const FALLBACK_ARTICLES: ArticleData[] = [
  {
    id: '1',
    title: 'Почему техника ASKO требует профессионального ремонта',
    slug: '',
    text: 'Техника ASKO отличается сложной инженерией и требует точной диагностики. Использование оригинальных комплектующих и соблюдение стандартов производителя обеспечивает надёжную и стабильную работу оборудования.',
    previewImage: '/images/article-fallback-1.webp',
  },
  {
    id: '2',
    title: 'Признаки неисправности, которые нельзя игнорировать',
    slug: '',
    text: 'Посторонние шумы, ошибки на дисплее или снижение эффективности работы могут указывать на неисправность. Своевременная диагностика позволяет избежать серьёзных поломок и дорогостоящего ремонта.',
    previewImage: '/images/article-fallback-2.webp',
  },
  {
    id: '3',
    title: 'Преимущества использования оригинальных запчастей',
    slug: '',
    text: 'Оригинальные комплектующие полностью совместимы с техникой ASKO и гарантируют корректную работу всех систем. Это продлевает срок службы оборудования и исключает повторные неисправности.',
    previewImage: '/images/article-fallback-3.webp',
  },
  {
    id: '4',
    title: 'Как продлить срок службы бытовой техники ASKO',
    slug: '',
    text: 'Регулярное обслуживание, правильная эксплуатация и своевременная диагностика помогают сохранить работоспособность техники на долгие годы и избежать непредвиденных поломок.',
    previewImage: '/images/article-fallback-4.webp',
  },
];

export function ArticlesSection() {
  const [articles, setArticles] = useState<ArticleData[]>(FALLBACK_ARTICLES);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: resp } = await articleApi.getAll({ limit: 4, page: 1 });
        const data = resp.data;
        if (!data || data.length === 0) return;

        // Fetch preview images
        const articlesWithImages: ArticleData[] = await Promise.all(
          data.map(async (a) => {
            let previewImage: string | null = null;
            try {
              const { data: imgData } = await articleApi.getImages(a.id);
              const imgs = (imgData.images ?? []).sort((x, y) => x.order - y.order);
              if (imgs.length > 0) {
                previewImage = imgs[0].imageJson.medium?.secure_url ?? imgs[0].imageJson.original.secure_url;
              }
            } catch {
              // ignore
            }
            const preview = a.description || a.text;
            return {
              id: a.id,
              title: a.title,
              slug: a.slug,
              text: preview.length > 200 ? preview.slice(0, 200) + '...' : preview,
              previewImage,
            };
          }),
        );
        setArticles(articlesWithImages);
      } catch {
        // keep fallback
      }
    })();
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const slideWidth = el.offsetWidth;
    const index = Math.round(el.scrollLeft / slideWidth);
    setActiveSlide(index);
  }, []);

  const goToSlide = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.offsetWidth, behavior: 'smooth' });
    setActiveSlide(index);
  }, []);

  const articleLink = (a: ArticleData) =>
    a.slug ? `/articles/${a.slug}` : '#';

  return (
    <section id="articles" className="py-8 md:py-12 lg:py-16">
      <Container>
        <div className="flex flex-col gap-8 md:gap-12">
          <h2 className="text-[32px] leading-9 md:text-[42px] md:leading-[46px] font-normal tracking-[-0.01em] text-text-main">
            Статьи о ремонте
          </h2>

          {/* Mobile: horizontal slider */}
          <div className="lg:hidden">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="flex-shrink-0 w-full snap-start flex flex-col gap-4 pr-4"
                >
                  <Link href={articleLink(article)}>
                    <div className="relative w-full aspect-[320/250] overflow-hidden">
                      {article.previewImage ? (
                        <SkeletonImage
                          src={article.previewImage}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <PlaceholderImage category="article" idOrIndex={article.id} fill className="object-cover" />
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-medium leading-6 tracking-[-0.01em] text-text-main">
                      {article.title}
                    </h3>
                    <p className="text-sm leading-[18px] tracking-[-0.01em] text-text-sub">
                      {article.text}
                    </p>
                    <Link
                      href={articleLink(article)}
                      className="text-sm font-bold text-text-main underline tracking-[-0.01em]"
                    >
                      Читать статью...
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {articles.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToSlide(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    activeSlide === i ? 'bg-brand-red' : 'bg-border-light'
                  }`}
                  aria-label={`Слайд ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Desktop: 4-column grid */}
          <div className="hidden lg:grid grid-cols-4 gap-6">
            {articles.map((article) => (
              <article key={article.id} className="flex flex-col gap-6">
                <Link href={articleLink(article)}>
                  <div className="relative w-full aspect-[262/204] overflow-hidden">
                    {article.previewImage ? (
                      <SkeletonImage
                        src={article.previewImage}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <PlaceholderImage category="article" idOrIndex={article.id} fill className="object-cover" />
                    )}
                  </div>
                </Link>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#150F0F] max-w-[204px]">
                      {article.title}
                    </h3>
                    <p className="text-base leading-[22px] tracking-[-0.01em] text-[#150F0F]">
                      {article.text}
                    </p>
                  </div>
                  <Link
                    href={articleLink(article)}
                    className="text-sm font-bold text-text-main underline tracking-[-0.01em]"
                  >
                    Читать статью...
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
