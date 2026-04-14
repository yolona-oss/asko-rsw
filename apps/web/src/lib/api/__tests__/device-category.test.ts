import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { deviceCategoryApi } = await import('../device-category');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
});

describe('getAll', () => {
  it('sends GET /device-categories', () => {
    deviceCategoryApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/device-categories');
  });
});

describe('getOne', () => {
  it('sends GET /device-categories/:id', () => {
    deviceCategoryApi.getOne('cat-1');
    expect(mockApi.get).toHaveBeenCalledWith('/device-categories/cat-1');
  });
});

describe('create', () => {
  it('sends POST /device-categories with body', () => {
    const data = { name: 'oven', label: 'Духовой шкаф', labelPlural: 'Духовые шкафы', order: 5 } as any;
    deviceCategoryApi.create(data);
    expect(mockApi.post).toHaveBeenCalledWith('/device-categories', data);
  });
});

describe('update', () => {
  it('sends PATCH /device-categories/:id with body', () => {
    const data = { label: 'Обновлённая категория' } as any;
    deviceCategoryApi.update('cat-1', data);
    expect(mockApi.patch).toHaveBeenCalledWith('/device-categories/cat-1', data);
  });
});

describe('delete', () => {
  it('sends DELETE /device-categories/:id', () => {
    deviceCategoryApi.delete('cat-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/device-categories/cat-1');
  });
});
