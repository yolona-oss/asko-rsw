import type { IImage, IImageAttachment } from './types';
import { api } from './client';

export const fileUploadApi = {
  // Generic
  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<IImage>('/file-upload/image/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  attachImage(imageId: string, ownerType: string, ownerId: string) {
    return api.post<IImage>(`/file-upload/image/attach/${imageId}`, {
      ownerType,
      ownerId,
    });
  },

  // Avatar
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

  // Device images
  getDeviceImages(deviceId: string) {
    return api.get<{ images: IImageAttachment[] }>(`/devices/${deviceId}/images`);
  },

  uploadDeviceImage(deviceId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<IImage>(`/devices/${deviceId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteDeviceImage(deviceId: string, imageId: string) {
    return api.delete<void>(`/devices/${deviceId}/images/${imageId}`);
  },

  reorderDeviceImages(deviceId: string, imageIds: string[]) {
    return api.put<void>(`/devices/${deviceId}/images/reorder`, imageIds);
  },

  // Article images
  getArticleImages(articleId: string) {
    return api.get<{ images: IImageAttachment[] }>(`/articles/${articleId}/images`);
  },

  uploadArticleImage(articleId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<IImage>(`/articles/${articleId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteArticleImage(articleId: string, imageId: string) {
    return api.delete<void>(`/articles/${articleId}/images/${imageId}`);
  },

  reorderArticleImages(articleId: string, imageIds: string[]) {
    return api.put<void>(`/articles/${articleId}/images/reorder`, imageIds);
  },

  // Device part images
  getDevicePartImages(deviceId: string, partId: string) {
    return api.get<{ images: IImageAttachment[] }>(`/devices/${deviceId}/parts/${partId}/images`);
  },

  uploadDevicePartImage(deviceId: string, partId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<IImage>(`/devices/${deviceId}/parts/${partId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteDevicePartImage(deviceId: string, partId: string, imageId: string) {
    return api.delete<void>(`/devices/${deviceId}/parts/${partId}/images/${imageId}`);
  },

  // Broken part images
  getBrokenPartImages(requestId: string, partId: string) {
    return api.get<{ images: IImageAttachment[] }>(`/repair-requests/${requestId}/broken-parts/${partId}/images`);
  },

  uploadBrokenPartImage(requestId: string, partId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<IImage>(`/repair-requests/${requestId}/broken-parts/${partId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteBrokenPartImage(requestId: string, partId: string, imageId: string) {
    return api.post<void>(`/repair-requests/${requestId}/broken-parts/${partId}/images/${imageId}/delete`);
  },

  // Review images
  uploadReviewImage(reviewId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<IImage>(`/reviews/${reviewId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
