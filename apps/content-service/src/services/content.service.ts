import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Article } from 'entities/article.entity';
import { ArticleView } from 'entities/article-view.entity';
import { AppErrors } from 'common/error';
import { GraphService } from './graph.service';

const BOT_PATTERNS = [
    /bot/i, /crawl/i, /spider/i, /headless/i, /phantom/i, /puppet/i,
    /selenium/i, /playwright/i, /wget/i, /curl/i, /python-requests/i,
    /go-http-client/i, /node-fetch/i, /axios/i, /scrapy/i,
    /googlebot/i, /bingbot/i, /yandexbot/i, /baiduspider/i,
];

function isBot(userAgent: string): boolean {
    if (!userAgent) return false;
    return BOT_PATTERNS.some((p) => p.test(userAgent));
}

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
    constructor(
        private readonly em: EntityManager,
        private readonly graphService: GraphService,
    ) {}

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

        // Recalculate tag edges for the new article
        if (article.tags?.length) {
            this.graphService.recalculateTagEdges(article.id).catch(() => {});
        }

        return article;
    }

    @CreateRequestContext()
    async update(id: string, dto: {
        title?: string;
        slug?: string;
        text?: string;
        content?: Record<string, any>;
        tags?: string[];
    }): Promise<Article> {
        const article = await this.em.findOne(Article, { id });
        if (!article) throw AppErrors.articleNotFound();

        // If slug is explicitly provided, use it (with uniqueness check)
        if (dto.slug && dto.slug !== article.slug) {
            const baseSlug = slugify(dto.slug);
            let slug = baseSlug;
            let counter = 1;
            while (true) {
                const existing = await this.em.findOne(Article, { slug });
                if (!existing || existing.id === id) break;
                slug = `${baseSlug}-${counter++}`;
            }
            article.slug = slug;
        } else if (dto.title && dto.title !== article.title && !dto.slug) {
            // Auto-generate slug from new title if slug wasn't explicitly set
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

        // Recalculate tag edges if tags changed
        if (dto.tags) {
            this.graphService.recalculateTagEdges(article.id).catch(() => {});
        }

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
    async recordView(
        slug: string,
        userId: string | undefined,
        sessionId: string,
        readTime = 0,
        userAgent = '',
    ): Promise<void> {
        // 1. Minimum read time threshold (5 seconds)
        if (readTime > 0 && readTime < 5000) return;

        // 2. Basic bot filtering
        if (isBot(userAgent)) return;

        const article = await this.findBySlugInternal(slug);

        // 3. Dedup: 5 minutes per user/session per article (shorter than before)
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        const dedup = userId
            ? { articleId: article.id, userId, viewedAt: { $gte: fiveMinAgo } }
            : { articleId: article.id, sessionId, viewedAt: { $gte: fiveMinAgo } };

        const existing = await this.em.findOne(ArticleView, dedup);
        if (existing) return;

        // 4. Save view record
        const view = this.em.create(ArticleView, {
            articleId: article.id,
            userId,
            sessionId,
        });
        await this.em.persistAndFlush(view);

        // 5. Race-safe counter increment via raw SQL
        await this.em.getConnection().execute(
            'UPDATE article SET view_count = view_count + 1 WHERE id = ?',
            [article.id],
        );
    }

    @CreateRequestContext()
    async findRelated(slug: string, limit = 4): Promise<Article[]> {
        const article = await this.findBySlugInternal(slug);

        // Use weighted graph for related articles
        const connected = await this.graphService.getConnected(article.id, limit);

        if (connected.length > 0) {
            const ids = connected.map((c) => c.articleId);
            const articles = await this.em.find(Article, { id: { $in: ids } });
            // Preserve weight order
            const articleMap = new Map(articles.map((a) => [a.id, a]));
            const result = ids.map((id) => articleMap.get(id)).filter(Boolean) as Article[];
            if (result.length >= limit) return result.slice(0, limit);

            // Pad with popular articles if graph doesn't have enough
            const excludeIds = new Set([article.id, ...ids]);
            const padding = await this.em.find(
                Article,
                { id: { $nin: [...excludeIds] } },
                { orderBy: { viewCount: 'DESC', createdAt: 'DESC' }, limit: limit - result.length },
            );
            return [...result, ...padding];
        }

        // Fallback: popular articles
        return this.em.find(
            Article,
            { id: { $ne: article.id } },
            { orderBy: { viewCount: 'DESC', createdAt: 'DESC' }, limit },
        );
    }

    @CreateRequestContext()
    async findRecommended(userId: string | undefined, limit = 8): Promise<Article[]> {
        if (!userId) {
            return this.em.find(Article, {}, {
                orderBy: { viewCount: 'DESC', createdAt: 'DESC' },
                limit,
            });
        }

        // Get user's recently viewed articles
        const recentViews = await this.em.find(
            ArticleView,
            { userId },
            { orderBy: { viewedAt: 'DESC' }, limit: 20 },
        );

        if (recentViews.length === 0) {
            return this.em.find(Article, {}, {
                orderBy: { viewCount: 'DESC', createdAt: 'DESC' },
                limit,
            });
        }

        const viewedIds = [...new Set(recentViews.map((v) => v.articleId))];

        // Walk the graph: collect neighbors of all viewed articles, accumulate weights
        const candidateScores = new Map<string, number>();
        for (const viewedId of viewedIds) {
            const connected = await this.graphService.getConnected(viewedId, 10);
            for (const c of connected) {
                if (viewedIds.includes(c.articleId)) continue; // skip already read
                candidateScores.set(
                    c.articleId,
                    (candidateScores.get(c.articleId) ?? 0) + c.weight,
                );
            }
        }

        if (candidateScores.size === 0) {
            return this.em.find(
                Article,
                { id: { $nin: viewedIds } },
                { orderBy: { viewCount: 'DESC', createdAt: 'DESC' }, limit },
            );
        }

        // Sort by accumulated graph weight
        const sorted = [...candidateScores.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id]) => id);

        const articles = await this.em.find(Article, { id: { $in: sorted } });
        const articleMap = new Map(articles.map((a) => [a.id, a]));
        const result = sorted.map((id) => articleMap.get(id)).filter(Boolean) as Article[];

        // Pad if not enough
        if (result.length < limit) {
            const excludeIds = [...viewedIds, ...sorted];
            const padding = await this.em.find(
                Article,
                { id: { $nin: excludeIds } },
                { orderBy: { viewCount: 'DESC', createdAt: 'DESC' }, limit: limit - result.length },
            );
            return [...result, ...padding];
        }

        return result;
    }

    private async findBySlugInternal(slug: string): Promise<Article> {
        const article = await this.em.findOne(Article, { slug })
            ?? await this.em.findOne(Article, { id: slug });
        if (!article) throw AppErrors.articleNotFound();
        return article;
    }
}
