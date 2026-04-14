import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { repairerApi } = await import('../repairer');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.put.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
});

// ── getAll ──

describe('getAll', () => {
  it('sends GET to /repairers without params', async () => {
    await repairerApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/repairers', { params: undefined });
  });

  it('sends GET to /repairers with filter and pagination params', async () => {
    const params = { page: 1, limit: 20, search: 'ivan', sortBy: 'name', sortOrder: 'asc' };
    await repairerApi.getAll(params);
    expect(mockApi.get).toHaveBeenCalledWith('/repairers', { params });
  });
});

// ── getForAssignment ──

describe('getForAssignment', () => {
  it('sends GET to /repairers/for-assignment without params', async () => {
    await repairerApi.getForAssignment();
    expect(mockApi.get).toHaveBeenCalledWith('/repairers/for-assignment', { params: undefined });
  });

  it('sends GET to /repairers/for-assignment with pagination params', async () => {
    const params = { page: 2, limit: 10 };
    await repairerApi.getForAssignment(params);
    expect(mockApi.get).toHaveBeenCalledWith('/repairers/for-assignment', { params });
  });
});

// ── getOne ──

describe('getOne', () => {
  it('sends GET to /repairers/:id', async () => {
    await repairerApi.getOne('rep-42');
    expect(mockApi.get).toHaveBeenCalledWith('/repairers/rep-42');
  });
});

// ── create ──

describe('create', () => {
  it('sends POST to /repairers with body', async () => {
    const data = {
      userId: 'user-1',
      specializations: ['washing_machine'],
    } as any;
    await repairerApi.create(data);
    expect(mockApi.post).toHaveBeenCalledWith('/repairers', data);
  });
});

// ── update ──

describe('update', () => {
  it('sends PATCH to /repairers/:id with body', async () => {
    const data = { specializations: ['dishwasher', 'dryer'] } as any;
    await repairerApi.update('rep-42', data);
    expect(mockApi.patch).toHaveBeenCalledWith('/repairers/rep-42', data);
  });
});

// ── getProfile ──

describe('getProfile', () => {
  it('sends GET to /repairers/me', async () => {
    await repairerApi.getProfile();
    expect(mockApi.get).toHaveBeenCalledWith('/repairers/me');
  });
});

// ── updateLocation ──

describe('updateLocation', () => {
  it('sends POST to /repairers/location with body', async () => {
    const data = { latitude: 55.7558, longitude: 37.6173 } as any;
    await repairerApi.updateLocation(data);
    expect(mockApi.post).toHaveBeenCalledWith('/repairers/location', data);
  });
});

// ── getInCity ──

describe('getInCity', () => {
  it('sends GET to /repairers/city/:city', async () => {
    await repairerApi.getInCity('Moscow');
    expect(mockApi.get).toHaveBeenCalledWith('/repairers/city/Moscow');
  });

  it('handles city names with spaces', async () => {
    await repairerApi.getInCity('Saint Petersburg');
    expect(mockApi.get).toHaveBeenCalledWith('/repairers/city/Saint Petersburg');
  });
});
