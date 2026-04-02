import type { UpdateUserDto } from '@asko/shared/client';
import type { IAuthUser, IImage, IImageAttachment, PaginatedUsers, UserResponse } from './types';
import { api } from './client';

export const usersApi = {
  getProfile() {
    return api.get<UserResponse>('/users/profile');
  },

  updateProfile(data: Partial<UpdateUserDto>) {
    return api.put<IAuthUser>('/users/', data);
  },

  getAll(params?: { offset?: number; limit?: number; search?: string; role?: string; status?: string }) {
    return api.get<PaginatedUsers>('/users/', { params });
  },

  delete(id: string) {
    return api.delete<void>('/users/delete', { params: { userId: id } });
  },

  disable(id: string) {
    return api.post<void>(`/users/${id}/disable`);
  },

  enable(id: string) {
    return api.post<void>(`/users/${id}/enable`);
  },

  uploadAvatar(file: Blob, userId: string) {
    const form = new FormData();
    form.append('file', file, 'avatar.webp');
    return api.post<IImage>(`/file-upload/image/upload/avatar/${userId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  requestEmailChange(newEmail: string) {
    return api.post<{ message: string; retryAfter: number }>('/users/request-email-change', { newEmail });
  },

  changePassword(data: { oldPassword: string; newPassword: string }) {
    return api.put<void>('/users/password', data);
  },

  async getAvatarUrl(userId: string): Promise<string | null> {
    try {
      const { data } = await api.get<{ images: IImageAttachment[] }>('/file-upload/image/attached', {
        params: { ownerType: 'user', ownerId: userId },
        _silent: true,
      } as any);
      const images = data.images ?? [];
      if (images.length === 0) return null;
      return images[0].imageJson?.thumbnail?.secure_url
        ?? images[0].imageJson?.original?.secure_url
        ?? null;
    } catch {
      return null;
    }
  },
};
