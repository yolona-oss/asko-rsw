import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { chatApi } = await import('../chat');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.put.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
});

// ── listConversations ──

describe('listConversations', () => {
  it('sends GET to /chat/conversations without params', async () => {
    await chatApi.listConversations();
    expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations', { params: undefined });
  });

  it('sends GET to /chat/conversations with pagination params', async () => {
    const params = { page: 2, limit: 20 };
    await chatApi.listConversations(params);
    expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations', { params });
  });
});

// ── getConversation ──

describe('getConversation', () => {
  it('sends GET to /chat/conversations/:id', async () => {
    await chatApi.getConversation('conv-1');
    expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations/conv-1', {});
  });

  it('adds _silent: true when silent flag is set', async () => {
    await chatApi.getConversation('conv-1', true);
    expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations/conv-1', { _silent: true });
  });

  it('does not add _silent when silent is false', async () => {
    await chatApi.getConversation('conv-1', false);
    expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations/conv-1', {});
  });
});

// ── createConversation ──

describe('createConversation', () => {
  it('sends POST to /chat/conversations with body', async () => {
    const body = { type: 'direct', participantIds: ['user-1', 'user-2'] };
    await chatApi.createConversation(body);
    expect(mockApi.post).toHaveBeenCalledWith('/chat/conversations', body);
  });

  it('includes optional name in body', async () => {
    const body = { type: 'group', name: 'Test Group', participantIds: ['u1', 'u2', 'u3'] };
    await chatApi.createConversation(body);
    expect(mockApi.post).toHaveBeenCalledWith('/chat/conversations', body);
  });
});

// ── deleteConversation ──

describe('deleteConversation', () => {
  it('sends DELETE to /chat/conversations/:id', async () => {
    await chatApi.deleteConversation('conv-42');
    expect(mockApi.delete).toHaveBeenCalledWith('/chat/conversations/conv-42');
  });
});

// ── listMessages ──

describe('listMessages', () => {
  it('sends GET to /chat/conversations/:id/messages without params', async () => {
    await chatApi.listMessages('conv-1');
    expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations/conv-1/messages', { params: undefined });
  });

  it('sends GET with pagination and beforeId params', async () => {
    const params = { page: 1, limit: 50, beforeId: 'msg-99' };
    await chatApi.listMessages('conv-1', params);
    expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations/conv-1/messages', { params });
  });
});

// ── sendMessage ──

describe('sendMessage', () => {
  it('sends POST to /chat/conversations/:id/messages with text body', async () => {
    const body = { type: 'text', text: 'Hello!' };
    await chatApi.sendMessage('conv-1', body);
    expect(mockApi.post).toHaveBeenCalledWith('/chat/conversations/conv-1/messages', body);
  });

  it('sends POST with attachment body', async () => {
    const body = { type: 'image', attachment: { url: 'https://example.com/img.jpg' } };
    await chatApi.sendMessage('conv-1', body);
    expect(mockApi.post).toHaveBeenCalledWith('/chat/conversations/conv-1/messages', body);
  });
});

// ── updateMessage ──

describe('updateMessage', () => {
  it('sends PUT to /chat/messages/:id with body', async () => {
    const body = { text: 'Updated message' };
    await chatApi.updateMessage('msg-5', body);
    expect(mockApi.put).toHaveBeenCalledWith('/chat/messages/msg-5', body);
  });
});

// ── deleteMessage ──

describe('deleteMessage', () => {
  it('sends DELETE to /chat/messages/:id', async () => {
    await chatApi.deleteMessage('msg-10');
    expect(mockApi.delete).toHaveBeenCalledWith('/chat/messages/msg-10');
  });
});

// ── listParticipants ──

describe('listParticipants', () => {
  it('sends GET to /chat/conversations/:id/participants', async () => {
    await chatApi.listParticipants('conv-1');
    expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations/conv-1/participants', {});
  });

  it('adds _silent: true when silent flag is set', async () => {
    await chatApi.listParticipants('conv-1', true);
    expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations/conv-1/participants', { _silent: true });
  });

  it('does not add _silent when silent is false', async () => {
    await chatApi.listParticipants('conv-1', false);
    expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations/conv-1/participants', {});
  });
});

// ── addParticipant ──

describe('addParticipant', () => {
  it('sends POST to /chat/conversations/:id/participants with userId', async () => {
    await chatApi.addParticipant('conv-1', 'user-7');
    expect(mockApi.post).toHaveBeenCalledWith('/chat/conversations/conv-1/participants', { userId: 'user-7' });
  });
});

// ── removeParticipant ──

describe('removeParticipant', () => {
  it('sends DELETE to /chat/conversations/:id/participants/:userId', async () => {
    await chatApi.removeParticipant('conv-1', 'user-7');
    expect(mockApi.delete).toHaveBeenCalledWith('/chat/conversations/conv-1/participants/user-7');
  });
});

// ── getUnreadCount ──

describe('getUnreadCount', () => {
  it('sends GET to /chat/unread-count', async () => {
    await chatApi.getUnreadCount();
    expect(mockApi.get).toHaveBeenCalledWith('/chat/unread-count');
  });
});

// ── getPresence ──

describe('getPresence', () => {
  it('sends GET to /chat/presence/:userId', async () => {
    await chatApi.getPresence('user-3');
    expect(mockApi.get).toHaveBeenCalledWith('/chat/presence/user-3');
  });
});

// ── getBulkPresence ──

describe('getBulkPresence', () => {
  it('sends POST to /chat/presence/bulk with userIds', async () => {
    const userIds = ['u1', 'u2', 'u3'];
    await chatApi.getBulkPresence(userIds);
    expect(mockApi.post).toHaveBeenCalledWith('/chat/presence/bulk', { userIds });
  });

  it('sends POST with empty array', async () => {
    await chatApi.getBulkPresence([]);
    expect(mockApi.post).toHaveBeenCalledWith('/chat/presence/bulk', { userIds: [] });
  });
});

// ── searchUsers ──

describe('searchUsers', () => {
  it('sends GET to /chat/search-users with query and _silent', async () => {
    await chatApi.searchUsers('john');
    expect(mockApi.get).toHaveBeenCalledWith('/chat/search-users', {
      params: { q: 'john', limit: undefined },
      _silent: true,
    });
  });

  it('passes limit when provided', async () => {
    await chatApi.searchUsers('john', 5);
    expect(mockApi.get).toHaveBeenCalledWith('/chat/search-users', {
      params: { q: 'john', limit: 5 },
      _silent: true,
    });
  });
});
