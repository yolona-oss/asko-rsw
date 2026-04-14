import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';
import type { IImageAttachment } from '../types';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const uploadAvatarMock = vi.fn().mockResolvedValue({ data: {} });
vi.mock('../file-upload', () => ({
  fileUploadApi: { uploadAvatar: (...args: any[]) => uploadAvatarMock(...args) },
}));

vi.mock('@/lib/file-url', () => ({
  getImageUrl: (id: string) => `/files/image/${id}`,
}));

const { usersApi } = await import('../users');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  uploadAvatarMock.mockClear();
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.put.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
  uploadAvatarMock.mockResolvedValue({ data: {} });
});

describe('getProfile', () => {
  it('calls GET /users/profile', () => {
    usersApi.getProfile();
    expect(mockApi.get).toHaveBeenCalledWith('/users/profile');
  });
});

describe('updateProfile', () => {
  it('calls PUT /users/ with body', () => {
    const data = { name: 'Ivan' };
    usersApi.updateProfile(data);
    expect(mockApi.put).toHaveBeenCalledWith('/users/', data);
  });
});

describe('getAll', () => {
  it('calls GET /users/ with params', () => {
    const params = { page: 1, limit: 20, search: 'ivan', role: 'admin' };
    usersApi.getAll(params);
    expect(mockApi.get).toHaveBeenCalledWith('/users/', { params });
  });

  it('calls GET /users/ without params', () => {
    usersApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/users/', { params: undefined });
  });
});

describe('delete', () => {
  it('calls DELETE /users/delete with userId param', () => {
    usersApi.delete('u-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/users/delete', { params: { userId: 'u-1' } });
  });
});

describe('disable', () => {
  it('calls POST /users/:id/disable', () => {
    usersApi.disable('u-1');
    expect(mockApi.post).toHaveBeenCalledWith('/users/u-1/disable');
  });
});

describe('enable', () => {
  it('calls POST /users/:id/enable', () => {
    usersApi.enable('u-1');
    expect(mockApi.post).toHaveBeenCalledWith('/users/u-1/enable');
  });
});

describe('uploadAvatar', () => {
  it('delegates to fileUploadApi.uploadAvatar', () => {
    const file = new File(['img'], 'avatar.png', { type: 'image/png' });
    usersApi.uploadAvatar(file, 'u-1');
    expect(uploadAvatarMock).toHaveBeenCalledWith(file, 'u-1');
  });
});

describe('requestEmailChange', () => {
  it('calls POST /users/request-email-change with body', () => {
    usersApi.requestEmailChange('new@example.com');
    expect(mockApi.post).toHaveBeenCalledWith('/users/request-email-change', { newEmail: 'new@example.com' });
  });
});

describe('changePassword', () => {
  it('calls PUT /users/password with body', () => {
    const data = { oldPassword: 'old123', newPassword: 'new456' };
    usersApi.changePassword(data);
    expect(mockApi.put).toHaveBeenCalledWith('/users/password', data);
  });
});

// ── getBatch (custom wrapper) ──

describe('getBatch', () => {
  it('returns users on success', async () => {
    const users = [
      { id: 'u-1', firstName: 'Ivan', lastName: 'Petrov' },
      { id: 'u-2', firstName: 'Anna', lastName: 'Ivanova' },
    ];
    mockApi.post.mockResolvedValue({ data: { users } });

    const result = await usersApi.getBatch(['u-1', 'u-2']);
    expect(mockApi.post).toHaveBeenCalledWith('/users/batch', { ids: ['u-1', 'u-2'] }, { _silent: true });
    expect(result).toEqual(users);
  });

  it('returns empty array when ids is empty (no API call)', async () => {
    const result = await usersApi.getBatch([]);
    expect(mockApi.post).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('returns empty array on API error', async () => {
    mockApi.post.mockRejectedValue(new Error('Network error'));

    const result = await usersApi.getBatch(['u-1']);
    expect(result).toEqual([]);
  });

  it('returns empty array when users field is missing', async () => {
    mockApi.post.mockResolvedValue({ data: {} });

    const result = await usersApi.getBatch(['u-1']);
    expect(result).toEqual([]);
  });
});

// ── getAvatarUrl (custom wrapper) ──

describe('getAvatarUrl', () => {
  it('returns image URL on success', async () => {
    const images: Partial<IImageAttachment>[] = [
      { id: 'img-1', order: 0 },
    ];
    mockApi.get.mockResolvedValue({ data: { images } });

    const result = await usersApi.getAvatarUrl('u-1');
    expect(mockApi.get).toHaveBeenCalledWith('/file-upload/image/attached', {
      params: { ownerType: 'user', ownerId: 'u-1' },
      _silent: true,
    });
    expect(result).toBe('/files/image/img-1');
  });

  it('returns null when no images', async () => {
    mockApi.get.mockResolvedValue({ data: { images: [] } });

    const result = await usersApi.getAvatarUrl('u-1');
    expect(result).toBeNull();
  });

  it('returns null on API error', async () => {
    mockApi.get.mockRejectedValue(new Error('Not found'));

    const result = await usersApi.getAvatarUrl('u-1');
    expect(result).toBeNull();
  });

  it('returns null when images field is missing', async () => {
    mockApi.get.mockResolvedValue({ data: {} });

    const result = await usersApi.getAvatarUrl('u-1');
    expect(result).toBeNull();
  });
});
