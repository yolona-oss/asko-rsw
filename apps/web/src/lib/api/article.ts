const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  text: string;
  tags?: string[];
}

export interface ArticleImage {
  image: {
    original: { secure_url: string };
    medium?: { secure_url: string };
    large?: { secure_url: string };
  };
  order: number;
}

export async function fetchArticles(page: number, limit: number) {
  const res = await fetch(
    `${API_URL}/articles?offset=${page}&limit=${limit}`,
    { next: { revalidate: 60 } },
  );
  if (!res.ok) return { data: [] as ArticleListItem[], total: 0 };
  return res.json() as Promise<{ data: ArticleListItem[]; total: number }>;
}

export async function fetchArticle(slug: string): Promise<ArticleListItem | null> {
  const res = await fetch(`${API_URL}/articles/${slug}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchArticleImages(slug: string): Promise<ArticleImage[]> {
  const res = await fetch(`${API_URL}/articles/${slug}/images`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchArticlePreviewImage(slug: string): Promise<string | null> {
  const images = await fetchArticleImages(slug);
  if (!images.length) return null;
  const preview = images.sort((a, b) => a.order - b.order)[0];
  return preview.image.medium?.secure_url ?? preview.image.original.secure_url;
}

export async function fetchOtherArticles(currentSlug: string): Promise<ArticleListItem[]> {
  const res = await fetch(`${API_URL}/articles?limit=5&offset=1`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const { data } = (await res.json()) as { data: ArticleListItem[] };
  return data.filter((a) => a.slug !== currentSlug).slice(0, 4);
}
