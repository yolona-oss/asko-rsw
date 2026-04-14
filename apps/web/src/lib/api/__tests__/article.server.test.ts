import { describe, it, expect, vi, beforeEach } from 'vitest';

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
    const payload = { data: [{ id: '1' }], overallCount: 1, page: 1, limit: 10 };
    serverGetMock.mockResolvedValue(payload);

    const result = await fetchArticles(1, 10);
    expect(result).toEqual(payload);
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
  });

  it('returns empty data when response is empty object', async () => {
    serverGetMock.mockResolvedValue({});

    const result = await fetchArticles(1, 10);
    expect(result.data).toEqual([]);
    expect(result.overallCount).toBe(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });
});

// ── fetchArticle ──

describe('fetchArticle', () => {
  it('returns article on success', async () => {
    serverGetMock.mockResolvedValue({ id: '1', title: 'Test' });
    expect(await fetchArticle('test')).toEqual({ id: '1', title: 'Test' });
  });

  it('returns null when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchArticle('test')).toBeNull();
  });
});

// ── fetchArticleImages ──

describe('fetchArticleImages', () => {
  it('returns images on success', async () => {
    serverGetMock.mockResolvedValue({ images: [{ id: 'img1' }] });
    expect(await fetchArticleImages('slug')).toEqual([{ id: 'img1' }]);
  });

  it('returns empty array when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchArticleImages('slug')).toEqual([]);
  });

  it('returns empty array when images field is missing', async () => {
    serverGetMock.mockResolvedValue({});
    expect(await fetchArticleImages('slug')).toEqual([]);
  });
});

// ── fetchArticlePreviewImage ──

describe('fetchArticlePreviewImage', () => {
  it('returns URL of first image sorted by order', async () => {
    serverGetMock.mockResolvedValue({
      images: [{ id: 'b', order: 1 }, { id: 'a', order: 0 }],
    });

    expect(await fetchArticlePreviewImage('slug')).toBe('/files/image/a');
  });

  it('returns null when no images', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchArticlePreviewImage('slug')).toBeNull();
  });
});

// ── fetchRelatedArticles ──

describe('fetchRelatedArticles', () => {
  it('returns articles on success', async () => {
    serverGetMock.mockResolvedValue({ data: [{ id: '1' }] });
    expect(await fetchRelatedArticles('slug')).toEqual([{ id: '1' }]);
  });

  it('returns empty array when null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchRelatedArticles('slug')).toEqual([]);
  });

  it('returns empty array when data field missing', async () => {
    serverGetMock.mockResolvedValue({});
    expect(await fetchRelatedArticles('slug')).toEqual([]);
  });
});

// ── fetchRecommendedArticles ──

describe('fetchRecommendedArticles', () => {
  it('returns articles on success', async () => {
    serverGetMock.mockResolvedValue({ data: [{ id: '1' }] });
    expect(await fetchRecommendedArticles()).toEqual([{ id: '1' }]);
  });

  it('returns empty array when null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchRecommendedArticles()).toEqual([]);
  });
});

// ── fetchArticlesByTags ──

describe('fetchArticlesByTags', () => {
  it('returns articles on success', async () => {
    serverGetMock.mockResolvedValue({ data: [{ id: '1' }] });

    const result = await fetchArticlesByTags(['asko', 'washer']);
    expect(result).toEqual([{ id: '1' }]);
    expect(serverGetMock).toHaveBeenCalledWith(expect.stringContaining('tags=asko%2Cwasher'));
  });

  it('returns empty array when null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchArticlesByTags(['tag'])).toEqual([]);
  });

  it('returns empty array when data field missing', async () => {
    serverGetMock.mockResolvedValue({});
    expect(await fetchArticlesByTags(['tag'])).toEqual([]);
  });
});
