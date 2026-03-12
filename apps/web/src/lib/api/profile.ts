import type { UpdateUserDto } from '@asko/shared';
import { api } from './client';

export const profileApi = {
  getProfile() {
    return api.get('/users/profile');
  },

  updateProfile(data: Partial<UpdateUserDto>) {
    return api.put('/users/', data);
  },

  uploadAvatar(file: Blob, userId: string) {
    const form = new FormData();
    form.append('file', file, 'avatar.jpg');
    return api.post(`/file-upload/image/upload/avatar/${userId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async getAvatarUrl(userId: string): Promise<string | null> {
    try {
      const { data } = await api.get('/file-upload/image/attached', {
        params: { ownerType: 'user', ownerId: userId },
      });
      const images = Array.isArray(data) ? data : [];
      if (images.length === 0) return null;
      return images[0].image?.thumbnail?.secure_url
        ?? images[0].image?.original?.secure_url
        ?? null;
    } catch {
      return null;
    }
  },
};
