import type { IImageAttachment, ImageResponse } from './types';
import { api } from './client';

export const fileUploadApi = {
  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ImageResponse>('/file-upload/image/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  attachImage(imageId: string, ownerType: string, ownerId: string) {
    return api.post<ImageResponse>(`/file-upload/image/attach/${imageId}`, {
      ownerType,
      ownerId,
    });
  },

  getAttachedImages(ownerType: string, ownerId: string, silent?: boolean) {
    return api.get<{ images: IImageAttachment[] }>('/file-upload/image/attached', {
      params: { ownerType, ownerId },
      ...(silent ? { _silent: true } : {}),
    } as any);
  },
};
