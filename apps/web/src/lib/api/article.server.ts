import type { ArticleResponse, ImageRecord, PaginatedArticles } from './types';
import { serverGet } from './server-fetch';
import { getImageUrl } from '@/lib/image-url';

export async function fetchArticles(page: number, limit: number): Promise<PaginatedArticles> {
  const res = await serverGet<PaginatedArticles>(`/articles?page=${page}&limit=${limit}`);
  return {
    data: res?.data ?? [],
    overallCount: res?.overallCount ?? 0,
    page: res?.page ?? page,
    limit: res?.limit ?? limit,
  };
}

export async function fetchArticle(slug: string): Promise<ArticleResponse | null> {
  return serverGet<ArticleResponse>(`/articles/${slug}`);
}

export async function fetchArticleImages(slug: string): Promise<ImageRecord[]> {
  const data = await serverGet<{ images: ImageRecord[] }>(`/articles/${slug}/images`);
  return data?.images ?? [];
}

export async function fetchArticlePreviewImage(slug: string): Promise<string | null> {
  const images = await fetchArticleImages(slug);
  if (!images.length) return null;
  const preview = images.sort((a, b) => a.order - b.order)[0];
  return getImageUrl(preview, 'medium');
}

export async function fetchRelatedArticles(slug: string): Promise<ArticleResponse[]> {
  const data = await serverGet<{ data: ArticleResponse[] }>(`/articles/${slug}/related`);
  return data?.data ?? [];
}

export async function fetchRecommendedArticles(): Promise<ArticleResponse[]> {
  const data = await serverGet<{ data: ArticleResponse[] }>('/articles/recommended');
  return data?.data ?? [];
}

export async function fetchArticlesByTags(tags: string[], limit = 4): Promise<ArticleResponse[]> {
  const params = new URLSearchParams({ tags: tags.join(','), limit: String(limit), page: '1' });
  const data = await serverGet<PaginatedArticles>(`/articles?${params}`);
  return data?.data ?? [];
}
