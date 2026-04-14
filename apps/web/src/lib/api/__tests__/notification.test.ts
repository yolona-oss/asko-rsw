import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { notificationApi } = await import('../notification');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.put.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
});

// ── list ──

describe('list', () => {
  it('sends GET to /notifications without params', async () => {
    await notificationApi.list();
    expect(mockApi.get).toHaveBeenCalledWith('/notifications', { params: undefined });
  });

  it('sends GET to /notifications with pagination params', async () => {
    const params = { page: 2, limit: 20 };
    await notificationApi.list(params);
    expect(mockApi.get).toHaveBeenCalledWith('/notifications', { params });
  });

  it('sends GET to /notifications with unreadOnly filter', async () => {
    const params = { page: 1, limit: 10, unreadOnly: true };
    await notificationApi.list(params);
    expect(mockApi.get).toHaveBeenCalledWith('/notifications', { params });
  });
});

// ── unreadCount ──

describe('unreadCount', () => {
  it('sends GET to /notifications/unread-count with _silent', async () => {
    await notificationApi.unreadCount();
    expect(mockApi.get).toHaveBeenCalledWith('/notifications/unread-count', { _silent: true });
  });
});

// ── markAsRead ──

describe('markAsRead', () => {
  it('sends POST to /notifications/:id/read with null body and _silent', async () => {
    await notificationApi.markAsRead('notif-1');
    expect(mockApi.post).toHaveBeenCalledWith('/notifications/notif-1/read', null, { _silent: true });
  });
});

// ── markAllAsRead ──

describe('markAllAsRead', () => {
  it('sends POST to /notifications/read-all', async () => {
    await notificationApi.markAllAsRead();
    expect(mockApi.post).toHaveBeenCalledWith('/notifications/read-all');
  });
});

// ── delete ──

describe('delete', () => {
  it('sends DELETE to /notifications/:id', async () => {
    await notificationApi.delete('notif-5');
    expect(mockApi.delete).toHaveBeenCalledWith('/notifications/notif-5');
  });
});
