import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { dealerApi } = await import('../dealer');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.put.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
});

// ── getProfile ──

describe('getProfile', () => {
  it('sends GET to /dealers/profile', async () => {
    await dealerApi.getProfile();
    expect(mockApi.get).toHaveBeenCalledWith('/dealers/profile');
  });
});

// ── getClients ──

describe('getClients', () => {
  it('sends GET to /dealers/clients', async () => {
    await dealerApi.getClients();
    expect(mockApi.get).toHaveBeenCalledWith('/dealers/clients');
  });
});

// ── searchUser ──

describe('searchUser', () => {
  it('sends GET to /dealers/search-user with email param and _silent', async () => {
    await dealerApi.searchUser('test@example.com');
    expect(mockApi.get).toHaveBeenCalledWith('/dealers/search-user', {
      params: { email: 'test@example.com' },
      _silent: true,
    });
  });
});

// ── getPointsHistory ──

describe('getPointsHistory', () => {
  it('sends GET to /dealers/points without params', async () => {
    await dealerApi.getPointsHistory();
    expect(mockApi.get).toHaveBeenCalledWith('/dealers/points', { params: undefined });
  });

  it('sends GET to /dealers/points with pagination params', async () => {
    const params = { page: 3, limit: 25 };
    await dealerApi.getPointsHistory(params);
    expect(mockApi.get).toHaveBeenCalledWith('/dealers/points', { params });
  });
});

// ── getCertificates ──

describe('getCertificates', () => {
  it('sends GET to /certificates/dealer without params', async () => {
    await dealerApi.getCertificates();
    expect(mockApi.get).toHaveBeenCalledWith('/certificates/dealer', { params: undefined });
  });

  it('sends GET to /certificates/dealer with filter params', async () => {
    const params = { page: 1, limit: 10, search: 'ASKO', status: 'active' };
    await dealerApi.getCertificates(params);
    expect(mockApi.get).toHaveBeenCalledWith('/certificates/dealer', { params });
  });
});

// ── getDeviceCatalog ──

describe('getDeviceCatalog', () => {
  it('sends GET to /devices without params', async () => {
    await dealerApi.getDeviceCatalog();
    expect(mockApi.get).toHaveBeenCalledWith('/devices', { params: undefined });
  });

  it('sends GET to /devices with pagination params', async () => {
    const params = { page: 2, limit: 15 };
    await dealerApi.getDeviceCatalog(params);
    expect(mockApi.get).toHaveBeenCalledWith('/devices', { params });
  });
});

// ── createCertificate ──

describe('createCertificate', () => {
  it('sends POST to /certificates/create with body', async () => {
    const data = {
      deviceId: 'dev-1',
      userId: 'user-1',
      serialNumber: 'SN-12345',
      purchaseDate: '2025-06-15',
    } as any;
    await dealerApi.createCertificate(data);
    expect(mockApi.post).toHaveBeenCalledWith('/certificates/create', data);
  });
});

// ── requestWithdraw ──

describe('requestWithdraw', () => {
  it('sends POST to /dealers/withdraw with amount, cardNumber, and cardHolderName', async () => {
    await dealerApi.requestWithdraw(5000, '4111111111111111', 'Ivanov Ivan');
    expect(mockApi.post).toHaveBeenCalledWith('/dealers/withdraw', {
      amount: 5000,
      cardNumber: '4111111111111111',
      cardHolderName: 'Ivanov Ivan',
    });
  });
});

// ── getMyWithdrawals ──

describe('getMyWithdrawals', () => {
  it('sends GET to /dealers/withdrawals', async () => {
    await dealerApi.getMyWithdrawals();
    expect(mockApi.get).toHaveBeenCalledWith('/dealers/withdrawals');
  });
});
