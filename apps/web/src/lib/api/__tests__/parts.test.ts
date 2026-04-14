import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { partsApi } = await import('../parts');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
});

// ── getAll ──

describe('getAll', () => {
  it('calls GET /parts without params', () => {
    partsApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/parts', { params: undefined });
  });

  it('calls GET /parts with all params', () => {
    const params = { page: 2, limit: 20, search: 'bolt', deviceId: 'dev-1', categoryId: 'cat-1', genericOnly: true };
    partsApi.getAll(params);
    expect(mockApi.get).toHaveBeenCalledWith('/parts', { params });
  });

  it('calls GET /parts with only search', () => {
    partsApi.getAll({ search: 'термопаста' });
    expect(mockApi.get).toHaveBeenCalledWith('/parts', { params: { search: 'термопаста' } });
  });
});

// ── create ──

describe('create', () => {
  it('calls POST /parts with full body', () => {
    const data = { deviceId: 'dev-1', categoryId: 'cat-1', group: 'Экран', name: 'Тачскрин', partNumber: 'TS-001', price: 3000, description: 'desc' };
    partsApi.create(data);
    expect(mockApi.post).toHaveBeenCalledWith('/parts', data);
  });

  it('calls POST /parts with only name (generic)', () => {
    const data = { name: 'Термопаста' };
    partsApi.create(data);
    expect(mockApi.post).toHaveBeenCalledWith('/parts', data);
  });

  it('calls POST /parts with group and categoryId (generic for category)', () => {
    const data = { categoryId: 'cat-phone', group: 'Расходники', name: 'Термопаста' };
    partsApi.create(data);
    expect(mockApi.post).toHaveBeenCalledWith('/parts', data);
  });
});

// ── update ──

describe('update', () => {
  it('calls PATCH /parts/:partId with body', () => {
    const data = { name: 'Updated', price: 5000, group: 'Корпус' };
    partsApi.update('part-1', data);
    expect(mockApi.patch).toHaveBeenCalledWith('/parts/part-1', data);
  });

  it('calls PATCH /parts/:partId with deviceId change', () => {
    partsApi.update('part-1', { deviceId: 'dev-2' });
    expect(mockApi.patch).toHaveBeenCalledWith('/parts/part-1', { deviceId: 'dev-2' });
  });

  it('calls PATCH /parts/:partId with categoryId change', () => {
    partsApi.update('part-1', { categoryId: 'cat-2' });
    expect(mockApi.patch).toHaveBeenCalledWith('/parts/part-1', { categoryId: 'cat-2' });
  });
});

// ── delete ──

describe('delete', () => {
  it('calls DELETE /parts/:partId', () => {
    partsApi.delete('part-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/parts/part-1');
  });
});
