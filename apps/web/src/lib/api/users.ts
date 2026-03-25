import type { UpdateUserDto } from '@asko/shared/client';
import type { IAuthUser, IImage, IImageAttachment, PaginatedUsers } from './types';
import { api } from './client';

export const usersApi = {
  getProfile() {
    return api.get<IAuthUser>('/users/profile');
  },

  updateProfile(data: Partial<UpdateUserDto>) {
    return api.put<IAuthUser>('/users/', data);
  },

  getAll(params?: { page?: number; limit?: number }) {
    return api.get<PaginatedUsers>('/users/', { params });
  },

  delete(id: string) {
    return api.delete<void>('/users/delete', { params: { userId: id } });
  },

  uploadAvatar(file: Blob, userId: string) {
    const form = new FormData();
    form.append('file', file, 'avatar.webp');
    return api.post<IImage>(`/file-upload/image/upload/avatar/${userId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async getAvatarUrl(userId: string): Promise<string | null> {
    try {
      const { data } = await api.get<{ images: IImageAttachment[] }>('/file-upload/image/attached', {
        params: { ownerType: 'user', ownerId: userId },
      });
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
