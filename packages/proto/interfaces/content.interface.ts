import { Observable } from 'rxjs';

// ─── Requests ───────────────────────────────────────────────────────────

export interface CreateArticleRequest {
    title: string;
    text: string;
    content: string;
    tags: string[];
}

export interface UpdateArticleRequest {
    id: string;
    title: string;
    slug: string;
    text: string;
    content: string;
    tags: string[];
}

export interface DeleteArticleRequest {
    id: string;
}

export interface FindAllArticlesRequest {
    offset: number;
    limit: number;
    search: string;
}

export interface FindArticleBySlugRequest {
    slug: string;
}

export interface RecordViewRequest {
    slug: string;
    userId: string;
    sessionId: string;
    readTime: number;
    userAgent: string;
}

export interface FindRelatedArticlesRequest {
    slug: string;
    limit: number;
}

export interface FindRecommendedArticlesRequest {
    userId: string;
    limit: number;
}

// ─── Record ─────────────────────────────────────────────────────────────

export interface ArticleRecord {
    id: string;
    title: string;
    slug: string;
    text: string;
    content: string;
    tags: string[];
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface LinkArticlesRequest {
    sourceId: string;
    targetId: string;
    weight: number;
}

export interface UnlinkArticlesRequest {
    sourceId: string;
    targetId: string;
}

export interface GetArticleEdgesRequest {
    articleId: string;
}

// ─── Records ────────────────────────────────────────────────────────────

export interface ArticleEdgeRecord {
    id: string;
    sourceId: string;
    targetId: string;
    weight: number;
    edgeType: string;
}

// ─── Responses ──────────────────────────────────────────────────────────

export interface ArticleEdgesResponse {
    edges: ArticleEdgeRecord[];
}

export interface EmptyContentResponse {}

export interface DeleteCountResponse {
    count: number;
}

export interface ArticleResponse {
    article: ArticleRecord;
}

export interface PaginatedArticlesResponse {
    data: ArticleRecord[];
    overallCount: number;
    offset: number;
    limit: number;
}

export interface ArticleListResponse {
    data: ArticleRecord[];
}

export interface ArticleGraphResponse {
    articles: ArticleRecord[];
    edges: ArticleEdgeRecord[];
}

// ─── gRPC Service Interface ────────────────────────────────────────────

export interface ContentServiceClient {
    createArticle(data: CreateArticleRequest): Observable<ArticleResponse>;
    updateArticle(data: UpdateArticleRequest): Observable<ArticleResponse>;
    deleteArticle(data: DeleteArticleRequest): Observable<EmptyContentResponse>;
    deleteAllArticles(data: {}): Observable<DeleteCountResponse>;
    findAllArticles(data: FindAllArticlesRequest): Observable<PaginatedArticlesResponse>;
    findArticleBySlug(data: FindArticleBySlugRequest): Observable<ArticleResponse>;
    recordView(data: RecordViewRequest): Observable<EmptyContentResponse>;
    findRelatedArticles(data: FindRelatedArticlesRequest): Observable<ArticleListResponse>;
    findRecommendedArticles(data: FindRecommendedArticlesRequest): Observable<ArticleListResponse>;
    linkArticles(data: LinkArticlesRequest): Observable<EmptyContentResponse>;
    unlinkArticles(data: UnlinkArticlesRequest): Observable<EmptyContentResponse>;
    getArticleEdges(data: GetArticleEdgesRequest): Observable<ArticleEdgesResponse>;
    getArticleGraph(data: {}): Observable<ArticleGraphResponse>;
}
