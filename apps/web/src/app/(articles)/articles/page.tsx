import Link from 'next/link';
import { Container } from '@asko/ui';
import { fetchArticles, fetchArticlePreviewImage, fetchRecommendedArticles } from '@/lib/api/article.server';
import { ArticlePreviewCard } from '@/components/articles';

const LIMIT = 12;

export default async function ArticlesListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const { data: articles, overallCount: total } = await fetchArticles(page, LIMIT);
  const totalPages = Math.ceil(total / LIMIT);

  const imageMap = new Map<string, string | null>();
  const imageResults = await Promise.all(
    articles.map((a) => fetchArticlePreviewImage(a.slug)),
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
              {articles.map((article) => (
                <ArticlePreviewCard
                  key={article.id}
                  slug={article.slug}
                  title={article.title}
                  text={article.text}
                  imageUrl={imageMap.get(article.id)}
                />
              ))}
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
  const recommended = await fetchRecommendedArticles();
  const filtered = recommended.filter((a) => !currentArticleIds.includes(a.id)).slice(0, 4);

  if (filtered.length === 0) return null;

  const recImageResults = await Promise.all(
    filtered.map((a) => fetchArticlePreviewImage(a.slug)),
  );

  return (
    <section className="mb-10 pb-10 border-b border-border-light/30">
      <h2 className="text-2xl font-medium tracking-[-0.01em] text-text-main mb-6">
        Рекомендуемые статьи
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((article, i) => (
          <ArticlePreviewCard
            key={article.id}
            slug={article.slug}
            title={article.title}
            text={article.text}
            imageUrl={recImageResults[i]}
          />
        ))}
      </div>
    </section>
  );
}
