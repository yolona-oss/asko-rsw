import type { CreateArticleDto, UpdateArticleDto } from '@asko/shared/client';
import type { IArticle, IImageAttachment, PaginatedArticles } from './types';
import { api } from './client';

// ── Client-side API (uses axios) ────────────────────────────────────

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

  recordView(slug: string, sessionId: string) {
    return api.post<{ message: string }>(`/articles/${slug}/view`, { sessionId });
  },

  async fetchArticles(page: number, limit: number): Promise<PaginatedArticles> {
    try {
      const { data } = await api.get<PaginatedArticles>('/articles', {
        params: { offset: page, limit },
      });
      return data;
    } catch {
      return { data: [] as IArticle[], overallCount: 0, offset: 0, limit };
    }
  },

  async fetchArticle(slug: string): Promise<IArticle | null> {
    try {
      const { data } = await api.get<IArticle>(`/articles/${slug}`);
      return data;
    } catch {
      return null;
    }
  },

  async fetchArticleImages(slug: string): Promise<IImageAttachment[]> {
    try {
      const { data } = await api.get<{ images: IImageAttachment[] }>(`/articles/${slug}/images`);
      return data.images ?? [];
    } catch {
      return [];
    }
  },

  async fetchArticlePreviewImage(slug: string): Promise<string | null> {
    const images = await this.fetchArticleImages(slug);
    if (!images.length) return null;
    const preview = images.sort((a, b) => a.order - b.order)[0];
    return preview.imageJson.medium?.secure_url ?? preview.imageJson.original.secure_url;
  },

  async fetchRelatedArticles(slug: string): Promise<IArticle[]> {
    try {
      const { data } = await api.get<{ data: IArticle[] }>(`/articles/${slug}/related`);
      return data.data ?? [];
    } catch {
      return [];
    }
  },

  async fetchRecommendedArticles(): Promise<IArticle[]> {
    try {
      const { data } = await api.get<{ data: IArticle[] }>('/articles/recommended');
      return data.data ?? [];
    } catch {
      return [];
    }
  },
};
