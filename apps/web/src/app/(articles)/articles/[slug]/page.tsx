import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Container } from '@asko/ui';
import { articleApi } from '@/lib/api/article';
import { generateArticleHTML } from '@/lib/lexical/generate-html';
import { ArticleViewTracker } from '@/components/articles/article-view-tracker';

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [article, images] = await Promise.all([
    articleApi.fetchArticle(slug),
    articleApi.fetchArticleImages(slug),
  ]);

  if (!article) notFound();

  const sortedImages = images.sort((a, b) => a.order - b.order);
  // Second image (order 1) is main hero, fallback to first
  const mainImage =
    sortedImages.length > 1
      ? sortedImages[1].imageJson.large?.secure_url ??
      sortedImages[1].imageJson.original.secure_url
      : sortedImages[0]
        ? sortedImages[0].imageJson.large?.secure_url ??
        sortedImages[0].imageJson.original.secure_url
        : null;

  // Render content: rich HTML or plain text fallback
  let richHTML: string | null = null;
  if (article.content) {
    try {
      richHTML = generateArticleHTML(article.content);
    } catch {
      // Lexical render failed (e.g., SSR without DOM) — fall back to plain text
    }
  }
  const paragraphs = !richHTML ? article.text.split('\n').filter((p: string) => p.trim()) : [];

  // Get related articles for recommendations
  const otherArticles = await articleApi.fetchRelatedArticles(slug);
  const otherImageMap = new Map<string, string | null>();
  const otherImageResults = await Promise.all(
    otherArticles.map((a) => articleApi.fetchArticlePreviewImage(a.slug)),
  );
  otherArticles.forEach((a, i) => otherImageMap.set(a.id, otherImageResults[i]));

  // Find next article for the "next article" button
  const nextArticle = otherArticles[0] ?? null;

  return (
    <div className="bg-page-bg">
      <ArticleViewTracker slug={slug} />
      <Container>
        <div className="py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-text-sub mb-6 tracking-[-0.01em]">
            <Link href="/" className="hover:text-brand-red transition-colors">
              Главная
            </Link>
            <span className="mx-1">&mdash;</span>
            <Link
              href="/articles"
              className="hover:text-brand-red transition-colors"
            >
              Статьи
            </Link>
          </nav>

          {/* Mobile back link */}
          <Link
            href="/articles"
            className="lg:hidden flex items-center gap-2 text-sm font-bold text-text-main underline tracking-[-0.01em] mb-6"
          >
            <svg
              className="w-5 h-5 rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
            Вернуться назад на сайт
          </Link>

          {/* Article content */}
          <div className="flex flex-col gap-6 md:gap-8 mb-12 md:mb-16">
            <h1 className="text-[32px] md:text-[42px] leading-9 md:leading-[46px] font-normal tracking-[-0.01em] text-text-main">
              {article.title}
            </h1>

            {mainImage && (
              <div className="relative w-full h-[204px] md:h-[300px] lg:h-[400px] overflow-hidden">
                <Image
                  src={mainImage}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
              </div>
            )}

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs text-text-sub bg-white border border-border-light/30 rounded-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {richHTML ? (
              <div
                className="prose prose-lg max-w-none text-[#150F0F]"
                dangerouslySetInnerHTML={{ __html: richHTML }}
              />
            ) : (
              <div className="flex flex-col gap-6">
                {paragraphs.map((p: string, i: number) => (
                  <p
                    key={i}
                    className="text-lg leading-[22px] tracking-[-0.01em] text-[#150F0F]"
                  >
                    {p}
                  </p>
                ))}
              </div>
            )}

            {nextArticle && (
              <div>
                <Link
                  href={`/articles/${nextArticle.slug}`}
                  className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-[#D7102A] shadow-sm w-full md:w-auto"
                >
                  Следующая статья
                </Link>
              </div>
            )}
          </div>

          {/* Recommendations section */}
          {otherArticles.length > 0 && (
            <section className="py-8 md:py-12 border-t border-border-light/30">
              <h2 className="text-[32px] leading-9 font-medium tracking-[-0.01em] text-text-main mb-8 md:mb-12">
                Рекомендации по обслуживанию техники
              </h2>

              {/* Mobile: horizontal scroll */}
              <div className="lg:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide flex gap-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {otherArticles.map((a) => {
                  const imgUrl = otherImageMap.get(a.id);
                  const previewText =
                    a.text.length > 180
                      ? a.text.slice(0, 180) + '...'
                      : a.text;
                  return (
                    <Link
                      key={a.id}
                      href={`/articles/${a.slug}`}
                      className="flex-shrink-0 w-[263px] snap-start flex flex-col gap-6 mr-6"
                    >
                      <div className="relative w-full aspect-[262/204] overflow-hidden">
                        {imgUrl ? (
                          <Image
                            src={imgUrl}
                            alt={a.title}
                            fill
                            className="object-cover"
                            sizes="263px"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-text-sub text-xs">
                            Нет фото
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                          <h3 className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#150F0F] max-w-[204px]">
                            {a.title}
                          </h3>
                          <p className="text-base leading-[22px] tracking-[-0.01em] text-[#150F0F]">
                            {previewText}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-text-main underline tracking-[-0.01em]">
                          Читать статью...
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Desktop: 4-column grid */}
              <div className="hidden lg:grid grid-cols-4 gap-6">
                {otherArticles.map((a) => {
                  const imgUrl = otherImageMap.get(a.id);
                  const previewText =
                    a.text.length > 200
                      ? a.text.slice(0, 200) + '...'
                      : a.text;
                  return (
                    <Link
                      key={a.id}
                      href={`/articles/${a.slug}`}
                      className="flex flex-col gap-6"
                    >
                      <div className="relative w-full aspect-[262/204] overflow-hidden">
                        {imgUrl ? (
                          <Image
                            src={imgUrl}
                            alt={a.title}
                            fill
                            className="object-cover"
                            sizes="25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-text-sub text-xs">
                            Нет фото
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                          <h3 className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#150F0F] max-w-[204px]">
                            {a.title}
                          </h3>
                          <p className="text-base leading-[22px] tracking-[-0.01em] text-[#150F0F]">
                            {previewText}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-text-main underline tracking-[-0.01em]">
                          Читать статью...
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </Container>
    </div>
  );
}
