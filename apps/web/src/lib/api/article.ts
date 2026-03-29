import type { CreateArticleDto, UpdateArticleDto } from '@asko/shared/client';
import type { IArticle, IImageAttachment, PaginatedArticles } from './types';
import { api } from './client';

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
