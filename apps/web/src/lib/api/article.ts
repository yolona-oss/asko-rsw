import type { CreateArticleDto, UpdateArticleDto } from '@asko/shared/client';
import type { IArticle, IImageAttachment, PaginatedArticles } from './types';
import { api } from './client';
import { serverGet } from './server-fetch';

// ── Client-side API (uses axios — requires Redux store) ──────────────

export const articleApi = {
  getAll(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get<PaginatedArticles>('/articles', { params });
  },

  getOne(id: string) {
    return api.get<IArticle>(`/articles/${id}`);
  },

  create(data: CreateArticleDto) {
    return api.post<IArticle>('/articles', data);
  },

  update(id: string, data: UpdateArticleDto) {
    return api.patch<IArticle>(`/articles/${id}`, data);
  },

  delete(id: string) {
    return api.delete<void>(`/articles/${id}`);
  },

  deleteAll() {
    return api.delete<{ count: number }>('/articles/all');
  },

  getImages(articleId: string) {
    return api.get<{ images: IImageAttachment[] }>(`/articles/${articleId}/images`);
  },

  uploadImage(articleId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/articles/${articleId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteImage(articleId: string, imageId: string) {
    return api.delete<void>(`/articles/${articleId}/images/${imageId}`);
  },

  reorderImages(articleId: string, imageIds: string[]) {
    return api.put<void>(`/articles/${articleId}/images/reorder`, imageIds);
  },

  recordView(slug: string, sessionId: string, readTime?: number) {
    return api.post<{ message: string }>(`/articles/${slug}/view`, { sessionId, readTime });
  },
};

// ── Server-side functions (for server components — uses fetch) ────────

export async function fetchArticles(page: number, limit: number): Promise<PaginatedArticles> {
  const data = await serverGet<PaginatedArticles>(`/articles?offset=${page}&limit=${limit}`);
  return data ?? { data: [] as IArticle[], overallCount: 0, offset: 0, limit };
}

export async function fetchArticle(slug: string): Promise<IArticle | null> {
  return serverGet<IArticle>(`/articles/${slug}`);
}

export async function fetchArticleImages(slug: string): Promise<IImageAttachment[]> {
  const data = await serverGet<{ images: IImageAttachment[] }>(`/articles/${slug}/images`);
  return data?.images ?? [];
}

export async function fetchArticlePreviewImage(slug: string): Promise<string | null> {
  const images = await fetchArticleImages(slug);
  if (!images.length) return null;
  const preview = images.sort((a, b) => a.order - b.order)[0];
  return preview.imageJson.medium?.secure_url ?? preview.imageJson.original.secure_url;
}

export async function fetchRelatedArticles(slug: string): Promise<IArticle[]> {
  const data = await serverGet<{ data: IArticle[] }>(`/articles/${slug}/related`);
  return data?.data ?? [];
}

export async function fetchRecommendedArticles(): Promise<IArticle[]> {
  const data = await serverGet<{ data: IArticle[] }>('/articles/recommended');
  return data?.data ?? [];
}
