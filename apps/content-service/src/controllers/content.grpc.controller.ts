import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { ContentService } from 'services/content.service';
import { GraphService } from 'services/graph.service';
import { appErrorToGrpcPayload } from '@asko/shared';
import type { Article } from 'entities/article.entity';
import type {
    CreateArticleRequest,
    UpdateArticleRequest,
    DeleteArticleRequest,
    FindAllArticlesRequest,
    FindArticleBySlugRequest,
    RecordViewRequest,
    FindRelatedArticlesRequest,
    FindRecommendedArticlesRequest,
    LinkArticlesRequest,
    UnlinkArticlesRequest,
    GetArticleEdgesRequest,
} from '@asko/proto';

function toGrpcError(error: unknown): RpcException {
    return new RpcException(appErrorToGrpcPayload(error));
}

function articleToRecord(entity: Article, tags: string[] = []) {
    return {
        id: entity.id,
        title: entity.title,
        slug: entity.slug,
        text: entity.text,
        description: entity.description ?? '',
        content: entity.content ? JSON.stringify(entity.content) : '',
        tags,
        viewCount: entity.viewCount,
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

@Controller()
export class ContentGrpcController {
    constructor(
        private readonly contentService: ContentService,
        private readonly graphService: GraphService,
    ) {}

    @GrpcMethod('ContentService', 'CreateArticle')
    async createArticle(data: CreateArticleRequest) {
        try {
            const content = data.content ? JSON.parse(data.content) : undefined;
            const article = await this.contentService.create({
                title: data.title,
                text: data.text || undefined,
                description: data.description || undefined,
                content,
                tags: data.tags?.length ? data.tags : undefined,
            });
            const tags = await this.contentService.getArticleTags(article.id);
            return { article: articleToRecord(article, tags) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ContentService', 'UpdateArticle')
    async updateArticle(data: UpdateArticleRequest) {
        try {
            const dto: Record<string, any> = {};
            if (data.title) dto.title = data.title;
            if (data.slug) dto.slug = data.slug;
            if (data.text) dto.text = data.text;
            if (data.description) dto.description = data.description;
            if (data.content) dto.content = JSON.parse(data.content);
            if (data.tags?.length) dto.tags = data.tags;

            const article = await this.contentService.update(data.id, dto);
            const tags = await this.contentService.getArticleTags(article.id);
            return { article: articleToRecord(article, tags) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ContentService', 'DeleteArticle')
    async deleteArticle(data: DeleteArticleRequest) {
        try {
            await this.contentService.delete(data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ContentService', 'DeleteAllArticles')
    async deleteAllArticles() {
        try {
            const count = await this.contentService.deleteAll();
            return { count };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ContentService', 'FindAllArticles')
    async findAllArticles(data: FindAllArticlesRequest) {
        try {
            const result = await this.contentService.findAll({
                page: data.page || undefined,
                limit: data.limit || undefined,
                search: data.search || undefined,
                tags: data.tags?.length ? data.tags : undefined,
                sortBy: data.sortBy || undefined,
                sortOrder: data.sortOrder || undefined,
            });
            const tagMap = result.data.length
                ? await this.contentService.getArticleTagsBatch(result.data.map((a) => a.id))
                : new Map<string, string[]>();
            return {
                data: result.data.map((a) => articleToRecord(a, tagMap.get(a.id) ?? [])),
                overallCount: result.total,
                page: data.page ?? 0,
                limit: data.limit ?? 20,
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ContentService', 'FindArticleBySlug')
    async findArticleBySlug(data: FindArticleBySlugRequest) {
        try {
            const article = await this.contentService.findBySlug(data.slug);
            const tags = await this.contentService.getArticleTags(article.id);
            return { article: articleToRecord(article, tags) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ContentService', 'RecordView')
    async recordView(data: RecordViewRequest) {
        try {
            await this.contentService.recordView(
                data.slug,
                data.userId || undefined,
                data.sessionId,
                data.readTime || 0,
                data.userAgent || '',
            );
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ContentService', 'FindRelatedArticles')
    async findRelatedArticles(data: FindRelatedArticlesRequest) {
        try {
            const articles = await this.contentService.findRelated(data.slug, data.limit || 4);
            const tagMap = articles.length
                ? await this.contentService.getArticleTagsBatch(articles.map((a) => a.id))
                : new Map<string, string[]>();
            return { data: articles.map((a) => articleToRecord(a, tagMap.get(a.id) ?? [])) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ContentService', 'FindRecommendedArticles')
    async findRecommendedArticles(data: FindRecommendedArticlesRequest) {
        try {
            const articles = await this.contentService.findRecommended(
                data.userId || undefined,
                data.limit || 8,
            );
            const tagMap = articles.length
                ? await this.contentService.getArticleTagsBatch(articles.map((a) => a.id))
                : new Map<string, string[]>();
            return { data: articles.map((a) => articleToRecord(a, tagMap.get(a.id) ?? [])) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ContentService', 'LinkArticles')
    async linkArticles(data: LinkArticlesRequest) {
        try {
            await this.graphService.setManualEdge(data.sourceId, data.targetId, data.weight);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ContentService', 'UnlinkArticles')
    async unlinkArticles(data: UnlinkArticlesRequest) {
        try {
            await this.graphService.removeManualEdge(data.sourceId, data.targetId);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ContentService', 'GetArticleEdges')
    async getArticleEdges(data: GetArticleEdgesRequest) {
        try {
            const edges = await this.graphService.getEdges(data.articleId);
            return {
                edges: edges.map((e) => ({
                    id: e.id,
                    sourceId: e.sourceId,
                    targetId: e.targetId,
                    weight: e.weight,
                    edgeType: e.edgeType,
                })),
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ContentService', 'GetArticleGraph')
    async getArticleGraph() {
        try {
            const [articles, edges] = await Promise.all([
                this.contentService.findAllForGraph(),
                this.graphService.getAllEdges(),
            ]);
            const tagMap = articles.length
                ? await this.contentService.getArticleTagsBatch(articles.map((a) => a.id))
                : new Map<string, string[]>();
            return {
                articles: articles.map((a) => articleToRecord(a, tagMap.get(a.id) ?? [])),
                edges: edges.map((e) => ({
                    id: e.id,
                    sourceId: e.sourceId,
                    targetId: e.targetId,
                    weight: e.weight,
                    edgeType: e.edgeType,
                })),
            };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('ContentService', 'GetTagStats')
    async getTagStats() {
        try {
            const tags = await this.contentService.getTagStats();
            return { tags };
        } catch (e) { throw toGrpcError(e); }
    }
}
