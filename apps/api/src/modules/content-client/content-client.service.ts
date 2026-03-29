import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from 'common/grpc';

import type {
    ContentServiceClient,
    ArticleResponse,
    PaginatedArticlesResponse,
    ArticleListResponse,
    ArticleEdgesResponse,
    EmptyContentResponse,
    DeleteCountResponse,
} from '@asko/proto';

@Injectable()
export class ContentClientService implements OnModuleInit {
    private contentService!: ContentServiceClient;

    constructor(
        @Inject('CONTENT_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.contentService = this.client.getService<ContentServiceClient>('ContentService');
    }

    // ─── CRUD ─────────────────────────────────────────────────────────

    createArticle(title: string, text?: string, content?: string, tags?: string[]): Promise<ArticleResponse> {
        return grpcCall(this.contentService.createArticle({
            title,
            text: text ?? '',
            content: content ?? '',
            tags: tags ?? [],
        }));
    }

    updateArticle(id: string, title?: string, slug?: string, text?: string, content?: string, tags?: string[]): Promise<ArticleResponse> {
        return grpcCall(this.contentService.updateArticle({
            id,
            title: title ?? '',
            slug: slug ?? '',
            text: text ?? '',
            content: content ?? '',
            tags: tags ?? [],
        }));
    }

    deleteArticle(id: string): Promise<EmptyContentResponse> {
        return grpcCall(this.contentService.deleteArticle({ id }));
    }

    deleteAllArticles(): Promise<DeleteCountResponse> {
        return grpcCall(this.contentService.deleteAllArticles({}));
    }

    // ─── Queries ──────────────────────────────────────────────────────

    findAllArticles(offset?: number, limit?: number, search?: string): Promise<PaginatedArticlesResponse> {
        return grpcCall(this.contentService.findAllArticles({
            offset: offset ?? 0,
            limit: limit ?? 20,
            search: search ?? '',
        }));
    }

    findArticleBySlug(slug: string): Promise<ArticleResponse> {
        return grpcCall(this.contentService.findArticleBySlug({ slug }));
    }

    // ─── Analytics ────────────────────────────────────────────────────

    recordView(slug: string, userId?: string, sessionId?: string): Promise<EmptyContentResponse> {
        return grpcCall(this.contentService.recordView({
            slug,
            userId: userId ?? '',
            sessionId: sessionId ?? '',
        }));
    }

    findRelatedArticles(slug: string, limit?: number): Promise<ArticleListResponse> {
        return grpcCall(this.contentService.findRelatedArticles({
            slug,
            limit: limit ?? 4,
        }));
    }

    findRecommendedArticles(userId?: string, limit?: number): Promise<ArticleListResponse> {
        return grpcCall(this.contentService.findRecommendedArticles({
            userId: userId ?? '',
            limit: limit ?? 8,
        }));
    }

    // ─── Graph (admin) ────────────────────────────────────────────────

    linkArticles(sourceId: string, targetId: string, weight: number): Promise<EmptyContentResponse> {
        return grpcCall(this.contentService.linkArticles({ sourceId, targetId, weight }));
    }

    unlinkArticles(sourceId: string, targetId: string): Promise<EmptyContentResponse> {
        return grpcCall(this.contentService.unlinkArticles({ sourceId, targetId }));
    }

    getArticleEdges(articleId: string): Promise<ArticleEdgesResponse> {
        return grpcCall(this.contentService.getArticleEdges({ articleId }));
    }
}
