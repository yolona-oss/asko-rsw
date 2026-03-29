import type { IArticle, IImageAttachment, PaginatedArticles } from './types';
import { serverGet } from './server-fetch';

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
