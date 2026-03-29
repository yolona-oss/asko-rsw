import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@asko/ui';
import { articleApi } from '@/lib/api/article';

const LIMIT = 12;

export default async function ArticlesListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const { data: articles, overallCount: total } = await articleApi.fetchArticles(page, LIMIT);
  const totalPages = Math.ceil(total / LIMIT);

  const imageMap = new Map<string, string | null>();
  const imageResults = await Promise.all(
    articles.map((a) => articleApi.fetchArticlePreviewImage(a.slug)),
  );
  articles.forEach((a, i) => imageMap.set(a.id, imageResults[i]));

  return (
    <div className="bg-page-bg">
      <Container>
        <div className="py-8 md:py-12">
          <nav className="text-sm text-text-sub mb-6 tracking-[-0.01em]">
            <Link href="/" className="hover:text-brand-red transition-colors">
              Главная
            </Link>
            <span className="mx-1">&mdash;</span>
            <span className="text-text-main">Статьи</span>
          </nav>

          <h1 className="text-[32px] md:text-[42px] leading-9 md:leading-[46px] font-normal tracking-[-0.01em] text-text-main mb-8 md:mb-12">
            Статьи о ремонте
          </h1>

          <RecommendedSection currentArticleIds={articles.map((a) => a.id)} />

          {articles.length === 0 ? (
            <p className="text-text-sub text-sm">Статьи не найдены</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {articles.map((article) => {
                const imgUrl = imageMap.get(article.id);
                const previewText =
                  article.text.length > 200
                    ? article.text.slice(0, 200) + '...'
                    : article.text;
                return (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="group flex flex-col gap-6"
                  >
                    <div className="relative w-full aspect-[262/204] overflow-hidden">
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={article.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
                          {article.title}
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
          )}

          {totalPages > 1 && (
            <nav className="flex justify-center gap-2 mt-10">
              {page > 1 && (
                <Link
                  href={`/articles?page=${page - 1}`}
                  className="px-3 py-2 text-sm border border-border-light/30 rounded-sm hover:bg-gray-50 text-text-main"
                >
                  &larr;
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/articles?page=${p}`}
                  className={`px-3 py-2 text-sm rounded-sm ${p === page
                      ? 'bg-brand-red text-white'
                      : 'border border-border-light/30 hover:bg-gray-50 text-text-main'
                    }`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link
                  href={`/articles?page=${page + 1}`}
                  className="px-3 py-2 text-sm border border-border-light/30 rounded-sm hover:bg-gray-50 text-text-main"
                >
                  &rarr;
                </Link>
              )}
            </nav>
          )}
        </div>
      </Container>
    </div>
  );
}

async function RecommendedSection({ currentArticleIds }: { currentArticleIds: string[] }) {
  const recommended = await articleApi.fetchRecommendedArticles();
  const filtered = recommended.filter((a) => !currentArticleIds.includes(a.id)).slice(0, 4);

  if (filtered.length === 0) return null;

  const recImageResults = await Promise.all(
    filtered.map((a) => articleApi.fetchArticlePreviewImage(a.slug)),
  );

  return (
    <section className="mb-10 pb-10 border-b border-border-light/30">
      <h2 className="text-2xl font-medium tracking-[-0.01em] text-text-main mb-6">
        Рекомендуемые статьи
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((article, i) => {
          const imgUrl = recImageResults[i];
          const previewText =
            article.text.length > 200
              ? article.text.slice(0, 200) + '...'
              : article.text;
          return (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="group flex flex-col gap-4"
            >
              <div className="relative w-full aspect-[262/204] overflow-hidden">
                {imgUrl ? (
                  <Image
                    src={imgUrl}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-text-sub text-xs">
                    Нет фото
                  </div>
                )}
              </div>
              <h3 className="text-lg font-medium leading-6 tracking-[-0.01em] text-[#150F0F]">
                {article.title}
              </h3>
              <p className="text-sm leading-5 tracking-[-0.01em] text-[#150F0F]">
                {previewText}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
