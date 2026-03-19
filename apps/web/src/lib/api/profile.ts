import type { UpdateUserDto } from '@asko/shared/client';
import { api } from './client';
import { fileUploadApi } from './file-upload';

export const profileApi = {
  getProfile() {
    return api.get('/users/profile');
  },

  updateProfile(data: Partial<UpdateUserDto>) {
    return api.put('/users/', data);
  },

  uploadAvatar: fileUploadApi.uploadAvatar,
  getAvatarUrl: fileUploadApi.getAvatarUrl,
};
