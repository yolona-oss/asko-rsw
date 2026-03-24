import type { IArticle, IImageAttachment, PaginatedArticles } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

export async function fetchOtherArticles(currentSlug: string): Promise<IArticle[]> {
  const res = await fetch(`${API_URL}/articles?limit=5&offset=1`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const { data } = (await res.json()) as PaginatedArticles;
  return data.filter((a) => a.slug !== currentSlug).slice(0, 4);
}
