import type { IImageAttachment, ImageResponse } from './types';
import { api } from './client';

interface VideoResponse {
  video: {
    id: string;
    videoJson: {
      public_id: string;
      format: string;
      resource_type: string;
      url: string;
      secure_url: string;
      original_filename: string;
      duration?: number;
      size?: number;
    };
    order: number;
    ownerType?: string;
    ownerId?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export const fileUploadApi = {
  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ImageResponse>('/file-upload/image/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadVideo(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<VideoResponse>('/file-upload/video/upload', formData, {
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
