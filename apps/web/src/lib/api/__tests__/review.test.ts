import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { reviewApi } = await import('../review');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.put.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
});

describe('create', () => {
  it('calls POST /reviews with body', () => {
    const data = { repairRequestId: 'req-1', rating: 5, text: 'Great' } as any;
    reviewApi.create(data);
    expect(mockApi.post).toHaveBeenCalledWith('/reviews', data);
  });
});

describe('getMy', () => {
  it('calls GET /reviews/my with _silent: true', () => {
    reviewApi.getMy();
    expect(mockApi.get).toHaveBeenCalledWith('/reviews/my', { _silent: true });
  });
});

describe('getByRepairer', () => {
  it('calls GET /reviews/repairer/:repairerId', () => {
    reviewApi.getByRepairer('rep-1');
    expect(mockApi.get).toHaveBeenCalledWith('/reviews/repairer/rep-1');
  });
});

describe('getRating', () => {
  it('calls GET /reviews/rating/repairer/:repairerId', () => {
    reviewApi.getRating('rep-1');
    expect(mockApi.get).toHaveBeenCalledWith('/reviews/rating/repairer/rep-1');
  });
});

describe('getMyRating', () => {
  it('calls GET /reviews/rating/my', () => {
    reviewApi.getMyRating();
    expect(mockApi.get).toHaveBeenCalledWith('/reviews/rating/my');
  });
});

describe('getByRequest', () => {
  it('calls GET /reviews/request/:requestId with _silent: true', () => {
    reviewApi.getByRequest('req-1');
    expect(mockApi.get).toHaveBeenCalledWith('/reviews/request/req-1', { _silent: true });
  });
});
