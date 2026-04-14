import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PaginatedArticles } from '../types';
import { makeArticle, makePaginatedArticles, makeImageAttachment } from './fixtures';

vi.mock('server-only', () => ({}));

const serverGetMock = vi.fn();
vi.mock('../server-fetch', () => ({ serverGet: (...args: any[]) => serverGetMock(...args) }));
vi.mock('@/lib/image-url', () => ({
  getImageUrl: (img: any) => img?.id ? `/files/image/${img.id}` : null,
}));

const {
  fetchArticles, fetchArticle, fetchArticleImages,
  fetchArticlePreviewImage, fetchRelatedArticles,
  fetchRecommendedArticles, fetchArticlesByTags,
} = await import('../article.server');

beforeEach(() => serverGetMock.mockReset());

// ── fetchArticles ──

describe('fetchArticles', () => {
  it('returns paginated data on success', async () => {
    const payload = makePaginatedArticles();
    serverGetMock.mockResolvedValue(payload);

    const result = await fetchArticles(1, 10);
    expect(result).toEqual(payload);
    expect(serverGetMock).toHaveBeenCalledWith('/articles?page=1&limit=10');
  });

  it('passes page and limit to query string', async () => {
    serverGetMock.mockResolvedValue(makePaginatedArticles({ page: 5, limit: 25 }));

    await fetchArticles(5, 25);
    expect(serverGetMock).toHaveBeenCalledWith('/articles?page=5&limit=25');
  });

  it('returns empty data when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);

    const result = await fetchArticles(1, 10);
    expect(result.data).toEqual([]);
    expect(result.overallCount).toBe(0);
  });

  it('returns empty data when response has no data field', async () => {
    serverGetMock.mockResolvedValue({ overallCount: 0, page: 1, limit: 10 });

    const result = await fetchArticles(1, 10);
    expect(result.data).toEqual([]);
    expect(result.overallCount).toBe(0);
  });

  it('returns empty data when response is empty object', async () => {
    serverGetMock.mockResolvedValue({});

    const result = await fetchArticles(3, 15);
    expect(result.data).toEqual([]);
    expect(result.overallCount).toBe(0);
    expect(result.page).toBe(3);
    expect(result.limit).toBe(15);
  });

  it('returns empty data when data field is undefined', async () => {
    serverGetMock.mockResolvedValue({ data: undefined, overallCount: 7 } as Partial<PaginatedArticles>);

    const result = await fetchArticles(1, 10);
    expect(result.data).toEqual([]);
    expect(result.overallCount).toBe(7);
  });
});

// ── fetchArticle ──

describe('fetchArticle', () => {
  it('returns article on success', async () => {
    const article = makeArticle({ slug: 'test-article' });
    serverGetMock.mockResolvedValue(article);

    expect(await fetchArticle('test-article')).toEqual(article);
    expect(serverGetMock).toHaveBeenCalledWith('/articles/test-article');
  });

  it('returns null when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchArticle('missing')).toBeNull();
  });
});

// ── fetchArticleImages ──

describe('fetchArticleImages', () => {
  it('returns images on success', async () => {
    const images = [
      makeImageAttachment({ id: 'img-1', order: 0 }),
      makeImageAttachment({ id: 'img-2', order: 1 }),
    ];
    serverGetMock.mockResolvedValue({ images });

    expect(await fetchArticleImages('slug')).toEqual(images);
    expect(serverGetMock).toHaveBeenCalledWith('/articles/slug/images');
  });

  it('returns empty array when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchArticleImages('slug')).toEqual([]);
  });

  it('returns empty array when images field is missing', async () => {
    serverGetMock.mockResolvedValue({});
    expect(await fetchArticleImages('slug')).toEqual([]);
  });

  it('returns empty array when images is undefined', async () => {
    serverGetMock.mockResolvedValue({ images: undefined });
    expect(await fetchArticleImages('slug')).toEqual([]);
  });
});

// ── fetchArticlePreviewImage ──

describe('fetchArticlePreviewImage', () => {
  it('returns URL of first image sorted by order', async () => {
    serverGetMock.mockResolvedValue({
      images: [
        makeImageAttachment({ id: 'b', order: 1 }),
        makeImageAttachment({ id: 'a', order: 0 }),
      ],
    });

    expect(await fetchArticlePreviewImage('slug')).toBe('/files/image/a');
  });

  it('returns null when no images', async () => {
    serverGetMock.mockResolvedValue({ images: [] });
    expect(await fetchArticlePreviewImage('slug')).toBeNull();
  });

  it('returns null when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchArticlePreviewImage('slug')).toBeNull();
  });

  it('returns null when images field is missing', async () => {
    serverGetMock.mockResolvedValue({});
    expect(await fetchArticlePreviewImage('slug')).toBeNull();
  });

  it('returns null when getImageUrl returns null for the image', async () => {
    // image with no id → getImageUrl mock returns null
    serverGetMock.mockResolvedValue({
      images: [{ ...makeImageAttachment(), id: '' }],
    });
    expect(await fetchArticlePreviewImage('slug')).toBeNull();
  });
});

// ── fetchRelatedArticles ──

describe('fetchRelatedArticles', () => {
  it('returns articles on success', async () => {
    const articles = [makeArticle({ id: 'r1' }), makeArticle({ id: 'r2' })];
    serverGetMock.mockResolvedValue({ data: articles });

    expect(await fetchRelatedArticles('slug')).toEqual(articles);
    expect(serverGetMock).toHaveBeenCalledWith('/articles/slug/related');
  });

  it('returns empty array when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchRelatedArticles('slug')).toEqual([]);
  });

  it('returns empty array when data field is missing', async () => {
    serverGetMock.mockResolvedValue({});
    expect(await fetchRelatedArticles('slug')).toEqual([]);
  });

  it('returns empty array when data is undefined', async () => {
    serverGetMock.mockResolvedValue({ data: undefined });
    expect(await fetchRelatedArticles('slug')).toEqual([]);
  });
});

// ── fetchRecommendedArticles ──

describe('fetchRecommendedArticles', () => {
  it('returns articles on success', async () => {
    const articles = [makeArticle()];
    serverGetMock.mockResolvedValue({ data: articles });

    expect(await fetchRecommendedArticles()).toEqual(articles);
    expect(serverGetMock).toHaveBeenCalledWith('/articles/recommended');
  });

  it('returns empty array when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchRecommendedArticles()).toEqual([]);
  });

  it('returns empty array when data field is missing', async () => {
    serverGetMock.mockResolvedValue({});
    expect(await fetchRecommendedArticles()).toEqual([]);
  });
});

// ── fetchArticlesByTags ──

describe('fetchArticlesByTags', () => {
  it('returns articles on success', async () => {
    const articles = [makeArticle({ id: 't1' })];
    serverGetMock.mockResolvedValue(makePaginatedArticles({ data: articles }));

    expect(await fetchArticlesByTags(['asko', 'washer'])).toEqual(articles);
    const url: string = serverGetMock.mock.calls[0][0];
    expect(url).toContain('tags=asko%2Cwasher');
  });

  it('uses default limit of 4', async () => {
    serverGetMock.mockResolvedValue(makePaginatedArticles());

    await fetchArticlesByTags(['tag']);
    const url: string = serverGetMock.mock.calls[0][0];
    expect(url).toContain('limit=4');
    expect(url).toContain('page=1');
  });

  it('accepts custom limit', async () => {
    serverGetMock.mockResolvedValue(makePaginatedArticles());

    await fetchArticlesByTags(['tag'], 8);
    const url: string = serverGetMock.mock.calls[0][0];
    expect(url).toContain('limit=8');
  });

  it('returns empty array when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchArticlesByTags(['tag'])).toEqual([]);
  });

  it('returns empty array when data field is missing', async () => {
    serverGetMock.mockResolvedValue({ overallCount: 0 });
    expect(await fetchArticlesByTags(['tag'])).toEqual([]);
  });
});
