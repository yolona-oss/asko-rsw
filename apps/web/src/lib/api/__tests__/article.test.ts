import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { articleApi } = await import('../article');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.put.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
});

// ── CRUD ──

describe('getAll', () => {
  it('sends GET /articles without params when none provided', () => {
    articleApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/articles', { params: undefined });
  });

  it('sends GET /articles with params', () => {
    const params = { page: 1, limit: 10, search: 'уход', sortBy: 'createdAt', sortOrder: 'desc' };
    articleApi.getAll(params);
    expect(mockApi.get).toHaveBeenCalledWith('/articles', { params });
  });
});

describe('getOne', () => {
  it('sends GET /articles/:id', () => {
    articleApi.getOne('art-1');
    expect(mockApi.get).toHaveBeenCalledWith('/articles/art-1');
  });
});

describe('create', () => {
  it('sends POST /articles with body', () => {
    const data = { title: 'Новая статья', text: 'Содержимое' } as any;
    articleApi.create(data);
    expect(mockApi.post).toHaveBeenCalledWith('/articles', data);
  });
});

describe('update', () => {
  it('sends PATCH /articles/:id with body', () => {
    const data = { title: 'Обновлённый заголовок' } as any;
    articleApi.update('art-1', data);
    expect(mockApi.patch).toHaveBeenCalledWith('/articles/art-1', data);
  });
});

describe('delete', () => {
  it('sends DELETE /articles/:id', () => {
    articleApi.delete('art-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/articles/art-1');
  });
});

describe('deleteAll', () => {
  it('sends DELETE /articles/all', () => {
    articleApi.deleteAll();
    expect(mockApi.delete).toHaveBeenCalledWith('/articles/all');
  });
});

// ── Images ──

describe('getImages', () => {
  it('sends GET /articles/:articleId/images', () => {
    articleApi.getImages('art-1');
    expect(mockApi.get).toHaveBeenCalledWith('/articles/art-1/images');
  });
});

describe('deleteImage', () => {
  it('sends DELETE /articles/:articleId/images/:imageId', () => {
    articleApi.deleteImage('art-1', 'img-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/articles/art-1/images/img-1');
  });
});

describe('reorderImages', () => {
  it('sends PUT /articles/:articleId/images/reorder with imageIds body', () => {
    const imageIds = ['img-2', 'img-1'];
    articleApi.reorderImages('art-1', imageIds);
    expect(mockApi.put).toHaveBeenCalledWith('/articles/art-1/images/reorder', imageIds);
  });
});

// ── Views ──

describe('recordView', () => {
  it('sends POST /articles/:slug/view with sessionId and readTime', () => {
    articleApi.recordView('uhod-za-mashinoj', 'sess-abc', 45);
    expect(mockApi.post).toHaveBeenCalledWith('/articles/uhod-za-mashinoj/view', {
      sessionId: 'sess-abc',
      readTime: 45,
    });
  });

  it('sends POST without readTime when omitted', () => {
    articleApi.recordView('uhod-za-mashinoj', 'sess-abc');
    expect(mockApi.post).toHaveBeenCalledWith('/articles/uhod-za-mashinoj/view', {
      sessionId: 'sess-abc',
      readTime: undefined,
    });
  });
});
