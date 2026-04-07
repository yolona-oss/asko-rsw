import type { UpdateUserDto } from '@asko/shared/client';
import type { IAuthUser, IImageAttachment, PaginatedUsers, UserResponse } from './types';
import { api } from './client';
import { fileUploadApi } from './file-upload';
import { getImageUrl } from '@/lib/file-url';

export const usersApi = {
  getProfile() {
    return api.get<UserResponse>('/users/profile');
  },

  updateProfile(data: Partial<UpdateUserDto>) {
    return api.put<IAuthUser>('/users/', data);
  },

  getAll(params?: { page?: number; limit?: number; search?: string; role?: string; status?: string; sortBy?: string; sortOrder?: string }) {
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
    return fileUploadApi.uploadAvatar(file as File, userId);
  },

  requestEmailChange(newEmail: string) {
    return api.post<{ message: string; retryAfter: number }>('/users/request-email-change', { newEmail });
  },

  changePassword(data: { oldPassword: string; newPassword: string }) {
    return api.put<void>('/users/password', data);
  },

  async getBatch(ids: string[]): Promise<{ id: string; firstName: string; lastName: string }[]> {
    if (ids.length === 0) return [];
    try {
      const { data } = await api.post<{ users: { id: string; firstName: string; lastName: string }[] }>(
        '/users/batch', { ids }, { _silent: true } as any,
      );
      return data.users ?? [];
    } catch {
      return [];
    }
  },

  async getAvatarUrl(userId: string): Promise<string | null> {
    try {
      const { data } = await api.get<{ images: IImageAttachment[] }>('/file-upload/image/attached', {
        params: { ownerType: 'user', ownerId: userId },
        _silent: true,
      } as any);
      const images = data.images ?? [];
      if (images.length === 0) return null;
      return getImageUrl(images[0].id);
    } catch {
      return null;
    }
  },
};
