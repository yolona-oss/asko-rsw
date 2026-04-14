import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => { mockApi = createMockApi(); return { api: mockApi }; });

const { invitationApi } = await import('../invitation');

beforeEach(() => Object.values(mockApi).forEach(fn => fn.mockClear()));

describe('invitationApi', () => {
  it('getAll calls GET /invite/', () => {
    invitationApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/invite/');
  });

  it('create calls POST /invite/ with body', () => {
    const data = { role: 'repairer', maxUses: 5 };
    invitationApi.create(data as any);
    expect(mockApi.post).toHaveBeenCalledWith('/invite/', data);
  });

  it('delete calls DELETE /invite/:id', () => {
    invitationApi.delete('inv-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/invite/inv-1');
  });
});
