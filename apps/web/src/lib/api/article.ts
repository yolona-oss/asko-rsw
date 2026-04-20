import type { CreateArticleDto, UpdateArticleDto } from '@asko/shared/client';
import type { ArticleResponse, DeleteCount, ImageRecord, MessageResponse, PaginatedArticles } from './types';
import { api } from './client';

// ── Client-side API (uses axios — requires Redux store) ──────────────

export const articleApi = {
  getAll(params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }) {
    return api.get<PaginatedArticles>('/articles', { params });
  },

  getOne(id: string) {
    return api.get<ArticleResponse>(`/articles/${id}`);
  },

  create(data: CreateArticleDto) {
    return api.post<ArticleResponse>('/articles', data);
  },

  update(id: string, data: UpdateArticleDto) {
    return api.patch<ArticleResponse>(`/articles/${id}`, data);
  },

  delete(id: string) {
    return api.delete<void>(`/articles/${id}`);
  },

  deleteAll() {
    return api.delete<DeleteCount>('/articles/all');
  },

  getImages(articleId: string) {
    return api.get<{ images: ImageRecord[] }>(`/articles/${articleId}/images`);
  },

  deleteImage(articleId: string, imageId: string) {
    return api.delete<void>(`/articles/${articleId}/images/${imageId}`);
  },

  reorderImages(articleId: string, imageIds: string[]) {
    return api.put<void>(`/articles/${articleId}/images/reorder`, imageIds);
  },

  recordView(slug: string, sessionId: string, readTime?: number) {
    return api.post<MessageResponse>(`/articles/${slug}/view`, { sessionId, readTime });
  },
};
