import type { IArticle, IImageAttachment, PaginatedArticles } from './types';
import { serverGet } from './server-fetch';
import { getImageUrl } from '@/lib/image-url';

export async function fetchArticles(page: number, limit: number): Promise<PaginatedArticles> {
  const data = await serverGet<PaginatedArticles>(`/articles?page=${page}&limit=${limit}`);
  return data ?? { data: [] as IArticle[], overallCount: 0, page: 1, limit };
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
  return getImageUrl(preview, 'medium');
}

export async function fetchRelatedArticles(slug: string): Promise<IArticle[]> {
  const data = await serverGet<{ data: IArticle[] }>(`/articles/${slug}/related`);
  return data?.data ?? [];
}

export async function fetchRecommendedArticles(): Promise<IArticle[]> {
  const data = await serverGet<{ data: IArticle[] }>('/articles/recommended');
  return data?.data ?? [];
}

export async function fetchArticlesByTags(tags: string[], limit = 4): Promise<IArticle[]> {
  const params = new URLSearchParams({ tags: tags.join(','), limit: String(limit), page: '1' });
  const data = await serverGet<PaginatedArticles>(`/articles?${params}`);
  return data?.data ?? [];
}
