import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Article, ArticleView } from 'entities';
import { CreateArticleDto, UpdateArticleDto, PaginationDto } from '@asko/shared';
import { AppErrors } from 'common/error';
import { extractPlainText } from '../utils/extract-plain-text';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .slice(0, 200);
}

@Injectable()
export class ArticlesService {
    constructor(private readonly em: EntityManager) {}

    async create(dto: CreateArticleDto): Promise<Article> {
        const baseSlug = slugify(dto.title);
        let slug = baseSlug;
        let counter = 1;
        while (await this.em.findOne(Article, { slug })) {
            slug = `${baseSlug}-${counter++}`;
        }

        const text = dto.text || (dto.content ? extractPlainText(dto.content) : '');

        const article = this.em.create(Article, {
            title: dto.title,
            slug,
            text,
            content: dto.content,
            tags: dto.tags,
        });
        await this.em.persistAndFlush(article);
        return article;
    }

    async update(id: string, dto: UpdateArticleDto): Promise<Article> {
        const article = await this.em.findOne(Article, { id });
        if (!article) throw AppErrors.dbEntityNotFound('Article not found');

        if (dto.title && dto.title !== article.title) {
            const baseSlug = slugify(dto.title);
            let slug = baseSlug;
            let counter = 1;
            while (true) {
                const existing = await this.em.findOne(Article, { slug });
                if (!existing || existing.id === id) break;
                slug = `${baseSlug}-${counter++}`;
            }
            article.slug = slug;
        }

        if (dto.content && !dto.text) {
            dto.text = extractPlainText(dto.content);
        }

        this.em.assign(article, dto);
        await this.em.flush();
        return article;
    }

    async delete(id: string): Promise<void> {
        const article = await this.em.findOne(Article, { id });
        if (!article) throw AppErrors.dbEntityNotFound('Article not found');
        await this.em.removeAndFlush(article);
    }

    async deleteAll(): Promise<number> {
        return this.em.nativeDelete(Article, {});
    }

    async findAll(pagination: PaginationDto): Promise<{ data: Article[]; total: number }> {
        const [data, total] = await this.em.findAndCount(
            Article,
            pagination.search
                ? { title: { $ilike: `%${pagination.search}%` } }
                : {},
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.offset ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: { createdAt: 'DESC' },
            },
        );
        return { data, total };
    }

    async findById(id: string): Promise<Article> {
        const article = await this.em.findOne(Article, { id });
        if (!article) throw AppErrors.dbEntityNotFound('Article not found');
        return article;
    }

    async findBySlug(slug: string): Promise<Article> {
        // Try slug first, then fall back to id lookup (for admin API calls)
        const article = await this.em.findOne(Article, { slug })
            ?? await this.em.findOne(Article, { id: slug });
        if (!article) throw AppErrors.dbEntityNotFound('Article not found');
        return article;
    }

    async recordView(slug: string, userId: string | undefined, sessionId: string): Promise<void> {
        const article = await this.findBySlug(slug);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Deduplicate: 1 view per user/session per article per hour
        const dedup = userId
            ? { articleId: article.id, userId, viewedAt: { $gte: oneHourAgo } }
            : { articleId: article.id, sessionId, viewedAt: { $gte: oneHourAgo } };

        const existing = await this.em.findOne(ArticleView, dedup);
        if (existing) return;

        const view = this.em.create(ArticleView, {
            articleId: article.id,
            userId,
            sessionId,
        });
        article.viewCount += 1;
        await this.em.persistAndFlush(view);
    }

    async findRelated(slug: string, limit = 4): Promise<Article[]> {
        const article = await this.findBySlug(slug);
        const tags = article.tags ?? [];

        if (tags.length === 0) {
            // No tags — fall back to latest articles excluding current
            return this.em.find(
                Article,
                { id: { $ne: article.id } },
                { orderBy: { createdAt: 'DESC' }, limit },
            );
        }

        // Find articles that share at least one tag, sorted by viewCount
        const all = await this.em.find(
            Article,
            { id: { $ne: article.id } },
            { orderBy: { viewCount: 'DESC', createdAt: 'DESC' } },
        );

        // Score by number of overlapping tags
        const scored = all
            .map((a) => {
                const overlap = (a.tags ?? []).filter((t) => tags.includes(t)).length;
                return { article: a, overlap };
            })
            .filter((s) => s.overlap > 0)
            .sort((a, b) => b.overlap - a.overlap || b.article.viewCount - a.article.viewCount);

        if (scored.length >= limit) {
            return scored.slice(0, limit).map((s) => s.article);
        }

        // Pad with other articles if not enough tag-related ones
        const relatedIds = new Set(scored.map((s) => s.article.id));
        const remaining = all
            .filter((a) => !relatedIds.has(a.id))
            .slice(0, limit - scored.length);

        return [...scored.map((s) => s.article), ...remaining];
    }

    async findRecommended(userId: string | undefined, limit = 8): Promise<Article[]> {
        if (!userId) {
            // Anonymous: return popular articles
            return this.em.find(Article, {}, {
                orderBy: { viewCount: 'DESC', createdAt: 'DESC' },
                limit,
            });
        }

        // Get tags from articles the user has recently viewed
        const recentViews = await this.em.find(
            ArticleView,
            { userId },
            { orderBy: { viewedAt: 'DESC' }, limit: 50 },
        );

        if (recentViews.length === 0) {
            return this.em.find(Article, {}, {
                orderBy: { viewCount: 'DESC', createdAt: 'DESC' },
                limit,
            });
        }

        const viewedArticleIds = [...new Set(recentViews.map((v) => v.articleId))];
        const viewedArticles = await this.em.find(Article, { id: { $in: viewedArticleIds } });

        // Collect tag frequency from reading history
        const tagFreq = new Map<string, number>();
        for (const a of viewedArticles) {
            for (const tag of a.tags ?? []) {
                tagFreq.set(tag, (tagFreq.get(tag) ?? 0) + 1);
            }
        }

        if (tagFreq.size === 0) {
            return this.em.find(Article, {}, {
                orderBy: { viewCount: 'DESC', createdAt: 'DESC' },
                limit,
            });
        }

        // Find unread articles, score by tag relevance + popularity
        const candidates = await this.em.find(
            Article,
            { id: { $nin: viewedArticleIds } },
            { orderBy: { viewCount: 'DESC', createdAt: 'DESC' } },
        );

        const scored = candidates.map((a) => {
            const tagScore = (a.tags ?? []).reduce(
                (sum, t) => sum + (tagFreq.get(t) ?? 0), 0,
            );
            return { article: a, tagScore };
        });

        scored.sort((a, b) => b.tagScore - a.tagScore || b.article.viewCount - a.article.viewCount);

        return scored.slice(0, limit).map((s) => s.article);
    }
}
