import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Article } from 'entities';
import { CreateArticleDto, UpdateArticleDto, PaginationDto } from '@asko/shared';
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

        const article = this.em.create(Article, {
            title: dto.title,
            slug,
            text: dto.text,
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
}
