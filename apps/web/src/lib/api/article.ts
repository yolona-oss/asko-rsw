import type { CreateArticleDto, UpdateArticleDto } from '@asko/shared/client';
import type { IArticle, IImage, IImageAttachment, PaginatedArticles } from './types';
import { api } from './client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
    return api.post<IImage>(`/articles/${articleId}/images`, formData, {
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
};

// ── Server-side functions (uses raw fetch for SSR) ──────────────────

export async function fetchArticles(page: number, limit: number) {
  const res = await fetch(
    `${API_URL}/articles?offset=${page}&limit=${limit}`,
    { next: { revalidate: 60 } },
  );
  if (!res.ok) return { data: [] as IArticle[], overallCount: 0, offset: 0, limit };
  return res.json() as Promise<PaginatedArticles>;
}

export async function fetchArticle(slug: string): Promise<IArticle | null> {
  const res = await fetch(`${API_URL}/articles/${slug}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchArticleImages(slug: string): Promise<IImageAttachment[]> {
  const res = await fetch(`${API_URL}/articles/${slug}/images`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.images ?? [];
}

export async function fetchArticlePreviewImage(slug: string): Promise<string | null> {
  const images = await fetchArticleImages(slug);
  if (!images.length) return null;
  const preview = images.sort((a, b) => a.order - b.order)[0];
  return preview.imageJson.medium?.secure_url ?? preview.imageJson.original.secure_url;
}

export async function fetchRelatedArticles(slug: string): Promise<IArticle[]> {
  const res = await fetch(`${API_URL}/articles/${slug}/related`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const { data } = await res.json();
  return data ?? [];
}

export async function fetchRecommendedArticles(): Promise<IArticle[]> {
  const res = await fetch(`${API_URL}/articles/recommended`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const { data } = await res.json();
  return data ?? [];
}
