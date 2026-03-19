import { api } from './client';

export const fileUploadApi = {
  // Generic
  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/file-upload/image/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  attachImage(imageId: string, ownerType: string, ownerId: string) {
    return api.post(`/file-upload/image/attach/${imageId}`, {
      ownerType,
      ownerId,
    });
  },

  // Avatar
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

  // Device images
  getDeviceImages(deviceId: string) {
    return api.get(`/devices/${deviceId}/images`);
  },

  uploadDeviceImage(deviceId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/devices/${deviceId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteDeviceImage(deviceId: string, imageId: string) {
    return api.delete(`/devices/${deviceId}/images/${imageId}`);
  },

  reorderDeviceImages(deviceId: string, imageIds: string[]) {
    return api.put(`/devices/${deviceId}/images/reorder`, imageIds);
  },

  // Article images
  getArticleImages(articleId: string) {
    return api.get(`/articles/${articleId}/images`);
  },

  uploadArticleImage(articleId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/articles/${articleId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteArticleImage(articleId: string, imageId: string) {
    return api.delete(`/articles/${articleId}/images/${imageId}`);
  },

  reorderArticleImages(articleId: string, imageIds: string[]) {
    return api.put(`/articles/${articleId}/images/reorder`, imageIds);
  },

  // Review images
  uploadReviewImage(reviewId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/reviews/${reviewId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
