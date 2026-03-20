import type { UpdateUserDto, IAuthUser } from '@asko/shared/client';
import { api } from './client';
import { fileUploadApi } from './file-upload';

export const profileApi = {
  getProfile() {
    return api.get<IAuthUser>('/users/profile');
  },

  updateProfile(data: Partial<UpdateUserDto>) {
    return api.put<IAuthUser>('/users/', data);
  },

  uploadAvatar: fileUploadApi.uploadAvatar,
  getAvatarUrl: fileUploadApi.getAvatarUrl,
};
