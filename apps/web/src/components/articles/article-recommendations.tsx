import type { IArticle } from '@/lib/api/types';
import { ArticlePreviewCard } from './article-preview-card';

interface ArticleRecommendationsProps {
    articles: IArticle[];
    imageMap: Map<string, string | null>;
    title?: string;
}

export function ArticleRecommendations({
    articles,
    imageMap,
    title = 'Рекомендации по обслуживанию техники',
}: ArticleRecommendationsProps) {
    if (articles.length === 0) return null;

    return (
        <section className="flex flex-col gap-12 items-start">
            <h2 className="text-[32px] leading-[36px] font-medium tracking-[-0.32px] text-[#323232]">
                {title}
            </h2>

            {/* Mobile: horizontal scroll */}
            <div
                className="lg:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide flex gap-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
                {articles.map((a) => (
                    <ArticlePreviewCard
                        key={a.id}
                        slug={a.slug}
                        title={a.title}
                        text={a.text}
                        description={a.description}
                        imageUrl={imageMap.get(a.id)}
                        previewLength={180}
                        imageSizes="263px"
                        className="flex-shrink-0 w-[263px] snap-start mr-6"
                    />
                ))}
            </div>

            {/* Desktop: 4-column grid */}
            <div className="hidden lg:grid grid-cols-4 gap-6">
                {articles.map((a) => (
                    <ArticlePreviewCard
                        key={a.id}
                        slug={a.slug}
                        title={a.title}
                        text={a.text}
                        description={a.description}
                        imageUrl={imageMap.get(a.id)}
                    />
                ))}
            </div>
        </section>
    );
}
