import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@asko/ui';
import {
  fetchArticle,
  fetchArticlePreviewImage,
  fetchRelatedArticles,
} from '@/lib/api/article.server';
import {
  ArticleBreadcrumb,
  ArticleContent,
  ArticleRecommendations,
  ArticleViewTracker,
} from '@/components/articles';

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) notFound();

  const otherArticles = await fetchRelatedArticles(slug);
  const otherImageMap = new Map<string, string | null>();
  const otherImageResults = await Promise.all(
    otherArticles.map((a) => fetchArticlePreviewImage(a.slug)),
  );
  otherArticles.forEach((a, i) => otherImageMap.set(a.id, otherImageResults[i]));

  const nextArticle = otherArticles[0] ?? null;

  return (
    <div className="bg-[#f1f1f1]">
      <ArticleViewTracker slug={slug} />
      <Container>
        <div className="py-8 md:py-12 px-4 md:px-0">
          <ArticleBreadcrumb />

          {/* Article content — 738px max on desktop, full width on mobile */}
          <div className="max-w-[738px]">
            <h1 className="text-[32px] leading-[36px] tracking-[-0.32px] md:text-[42px] md:leading-[46px] md:tracking-[-0.42px] font-normal text-[#323232]">
              {article.title}
            </h1>

            {/* Article body — images are inline in the Lexical content */}
            <div className="mt-4 md:mt-8">
              <ArticleContent content={article.content} text={article.text} />
            </div>

            {nextArticle && (
              <div className="mt-8">
                <Link
                  href={`/articles/${nextArticle.slug}`}
                  className="inline-flex items-center justify-center px-6 py-[9.5px] min-h-[40px] h-[46px] md:h-auto md:w-auto w-full text-sm font-medium text-white bg-[#D7102A] shadow-sm tracking-[0.07px]"
                >
                  Следующая статья
                </Link>
              </div>
            )}
          </div>

          <div className="mt-12 md:mt-16">
            <ArticleRecommendations articles={otherArticles} imageMap={otherImageMap} />
          </div>
        </div>
      </Container>
    </div>
  );
}
