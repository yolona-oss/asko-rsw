import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@asko/ui';
import {
  fetchArticle,
  fetchArticleImages,
  fetchArticlePreviewImage,
  fetchRelatedArticles,
} from '@/lib/api/article.server';
import {
  ArticleBreadcrumb,
  ArticleHeroImage,
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

  const [article, images] = await Promise.all([
    fetchArticle(slug),
    fetchArticleImages(slug),
  ]);

  if (!article) notFound();

  const otherArticles = await fetchRelatedArticles(slug);
  const otherImageMap = new Map<string, string | null>();
  const otherImageResults = await Promise.all(
    otherArticles.map((a) => fetchArticlePreviewImage(a.slug)),
  );
  otherArticles.forEach((a, i) => otherImageMap.set(a.id, otherImageResults[i]));

  const nextArticle = otherArticles[0] ?? null;

  return (
    <div className="bg-page-bg">
      <ArticleViewTracker slug={slug} />
      <Container>
        <div className="py-8 md:py-12">
          <ArticleBreadcrumb />

          {/* Article — max-width 738px, gap 32px between title and content block */}
          <div className="flex flex-col gap-8 max-w-[738px] mb-12 md:mb-16">
            {/* Title */}
            <h1 className="text-[32px] md:text-[42px] leading-[36px] md:leading-[46px] font-normal tracking-[-0.01em] text-[#323232]">
              {article.title}
            </h1>

            {/* Image + text block — gap 32px between image and paragraphs */}
            <div className="flex flex-col gap-8">
              <ArticleHeroImage images={images} alt={article.title} />

              {/* Text paragraphs — gap 24px between paragraphs */}
              <div className="flex flex-col gap-6">
                <ArticleContent content={article.content} text={article.text} />
              </div>
            </div>

            {nextArticle && (
              <Link
                href={`/articles/${nextArticle.slug}`}
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-[#D7102A] shadow-sm w-full md:w-auto self-start"
              >
                Следующая статья
              </Link>
            )}
          </div>

          <ArticleRecommendations articles={otherArticles} imageMap={otherImageMap} />
        </div>
      </Container>
    </div>
  );
}
