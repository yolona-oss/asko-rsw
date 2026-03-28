import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Article } from 'entities/article.entity';
import { ArticleView } from 'entities/article-view.entity';
import { AppErrors } from 'common/error';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .slice(0, 200);
}

function extractPlainText(editorState: Record<string, any>): string {
    const root = editorState?.root;
    if (!root) return '';
    return extractFromNode(root).trim();
}

function extractFromNode(node: Record<string, any>): string {
    if (node.type === 'text') return node.text ?? '';
    if (!node.children || !Array.isArray(node.children)) return '';
    const isBlock = ['root', 'paragraph', 'heading', 'quote', 'list', 'listitem'].includes(node.type);
    const parts = node.children.map((child: Record<string, any>) => extractFromNode(child));
    const joined = parts.join('');
    if (isBlock && node.type !== 'root') return joined + '\n';
    return joined;
}

@Injectable()
export class ContentService {
    constructor(private readonly em: EntityManager) {}

    @CreateRequestContext()
    async create(dto: {
        title: string;
        text?: string;
        content?: Record<string, any>;
        tags?: string[];
    }): Promise<Article> {
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

    @CreateRequestContext()
    async update(id: string, dto: {
        title?: string;
        text?: string;
        content?: Record<string, any>;
        tags?: string[];
    }): Promise<Article> {
        const article = await this.em.findOne(Article, { id });
        if (!article) throw AppErrors.articleNotFound();

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

    @CreateRequestContext()
    async delete(id: string): Promise<void> {
        const article = await this.em.findOne(Article, { id });
        if (!article) throw AppErrors.articleNotFound();
        await this.em.removeAndFlush(article);
    }

    @CreateRequestContext()
    async deleteAll(): Promise<number> {
        return this.em.nativeDelete(Article, {});
    }

    @CreateRequestContext()
    async findAll(pagination: { offset?: number; limit?: number; search?: string }): Promise<{ data: Article[]; total: number }> {
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

    @CreateRequestContext()
    async findBySlug(slug: string): Promise<Article> {
        const article = await this.em.findOne(Article, { slug })
            ?? await this.em.findOne(Article, { id: slug });
        if (!article) throw AppErrors.articleNotFound();
        return article;
    }

    @CreateRequestContext()
    async recordView(slug: string, userId: string | undefined, sessionId: string): Promise<void> {
        const article = await this.findBySlugInternal(slug);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

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

    @CreateRequestContext()
    async findRelated(slug: string, limit = 4): Promise<Article[]> {
        const article = await this.findBySlugInternal(slug);
        const tags = article.tags ?? [];

        if (tags.length === 0) {
            return this.em.find(
                Article,
                { id: { $ne: article.id } },
                { orderBy: { createdAt: 'DESC' }, limit },
            );
        }

        const all = await this.em.find(
            Article,
            { id: { $ne: article.id } },
            { orderBy: { viewCount: 'DESC', createdAt: 'DESC' } },
        );

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

        const relatedIds = new Set(scored.map((s) => s.article.id));
        const remaining = all
            .filter((a) => !relatedIds.has(a.id))
            .slice(0, limit - scored.length);

        return [...scored.map((s) => s.article), ...remaining];
    }

    @CreateRequestContext()
    async findRecommended(userId: string | undefined, limit = 8): Promise<Article[]> {
        if (!userId) {
            return this.em.find(Article, {}, {
                orderBy: { viewCount: 'DESC', createdAt: 'DESC' },
                limit,
            });
        }

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

    private async findBySlugInternal(slug: string): Promise<Article> {
        const article = await this.em.findOne(Article, { slug })
            ?? await this.em.findOne(Article, { id: slug });
        if (!article) throw AppErrors.articleNotFound();
        return article;
    }
}
