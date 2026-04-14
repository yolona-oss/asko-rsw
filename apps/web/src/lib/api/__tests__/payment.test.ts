import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { paymentApi } = await import('../payment');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.put.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
});

// ── getOptions ──

describe('getOptions', () => {
  it('sends GET to /payment/options', async () => {
    await paymentApi.getOptions();
    expect(mockApi.get).toHaveBeenCalledWith('/payment/options');
  });
});

// ── createPayment ──

describe('createPayment', () => {
  it('sends POST to /payment/create with body', async () => {
    const data = {
      repairRequestId: 'rr-1',
      provider: 'tbank',
      amount: 15000,
    } as any;
    await paymentApi.createPayment(data);
    expect(mockApi.post).toHaveBeenCalledWith('/payment/create', data);
  });
});

// ── listPayments ──

describe('listPayments', () => {
  it('sends GET to /payment/list without params', async () => {
    await paymentApi.listPayments();
    expect(mockApi.get).toHaveBeenCalledWith('/payment/list', { params: undefined });
  });

  it('sends GET to /payment/list with filter params', async () => {
    const params = { page: 1, limit: 25, status: 'completed', provider: 'tbank', search: 'test', sortBy: 'createdAt', sortOrder: 'desc' };
    await paymentApi.listPayments(params);
    expect(mockApi.get).toHaveBeenCalledWith('/payment/list', { params });
  });
});

// ── getMyPayments ──

describe('getMyPayments', () => {
  it('sends GET to /payment/my without params', async () => {
    await paymentApi.getMyPayments();
    expect(mockApi.get).toHaveBeenCalledWith('/payment/my', { params: undefined });
  });

  it('sends GET to /payment/my with filter params', async () => {
    const params = { page: 2, limit: 10, status: 'pending', sortBy: 'amount', sortOrder: 'asc' };
    await paymentApi.getMyPayments(params);
    expect(mockApi.get).toHaveBeenCalledWith('/payment/my', { params });
  });
});

// ── getStats ──

describe('getStats', () => {
  it('sends GET to /payment/stats', async () => {
    await paymentApi.getStats();
    expect(mockApi.get).toHaveBeenCalledWith('/payment/stats');
  });
});

// ── getMyStats ──

describe('getMyStats', () => {
  it('sends GET to /payment/my/stats', async () => {
    await paymentApi.getMyStats();
    expect(mockApi.get).toHaveBeenCalledWith('/payment/my/stats');
  });
});

// ── confirmCashPayment ──

describe('confirmCashPayment', () => {
  it('sends POST to /payment/confirm-cash with paymentId, confirmCode, and amount', async () => {
    await paymentApi.confirmCashPayment('pay-123', '456789', 1500);
    expect(mockApi.post).toHaveBeenCalledWith('/payment/confirm-cash', { paymentId: 'pay-123', confirmCode: '456789', amount: 1500 });
  });
});
