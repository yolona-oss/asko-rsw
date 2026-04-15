import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => { mockApi = createMockApi(); return { api: mockApi }; });

const { addressApi } = await import('../address');

beforeEach(() => Object.values(mockApi).forEach(fn => fn.mockClear()));

describe('addressApi', () => {
  it('create calls POST /address with body', () => {
    const data = { city: 'Москва', street: 'Ленина', house: '1' };
    addressApi.create(data as any);
    expect(mockApi.post).toHaveBeenCalledWith('/address', data);
  });
});
