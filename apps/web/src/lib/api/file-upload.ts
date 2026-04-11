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

export interface DocumentAttachment {
  id: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
  ownerType?: string;
  ownerId?: string;
  createdAt?: string;
}

interface DocumentResponse {
  document: DocumentAttachment;
}

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

function toForm(file: File | Blob, name = 'file') {
  const form = new FormData();
  form.append(name, file);
  return form;
}

export const fileUploadApi = {
  // ── Generic uploads ───────────────────────────────────────────────────

  uploadImage(file: File) {
    return api.post<ImageResponse>('/file-upload/image/upload', toForm(file), MULTIPART);
  },

  uploadVideo(file: File) {
    return api.post<VideoResponse>('/file-upload/video/upload', toForm(file), MULTIPART);
  },

  // ── Image uploads by target ───────────────────────────────────────────

  uploadAvatar(file: File | Blob, userId: string) {
    return api.post<ImageResponse>(`/file-upload/image/upload/avatar/${userId}`, toForm(file), MULTIPART);
  },

  uploadDeviceImage(file: File, ownerId: string) {
    return api.post<ImageResponse>(`/file-upload/image/upload/device/${ownerId}`, toForm(file), MULTIPART);
  },

  uploadArticleImage(file: File, ownerId: string) {
    return api.post<ImageResponse>(`/file-upload/image/upload/article/${ownerId}`, toForm(file), MULTIPART);
  },

  uploadRepairRequestImage(file: File, ownerId: string) {
    return api.post<ImageResponse>(`/file-upload/image/upload/repair-request/${ownerId}`, toForm(file), MULTIPART);
  },

  uploadReviewImage(file: File, ownerId: string) {
    return api.post<ImageResponse>(`/file-upload/image/upload/review/${ownerId}`, toForm(file), MULTIPART);
  },

  uploadDevicePartImage(file: File, ownerId: string) {
    return api.post<ImageResponse>(`/file-upload/image/upload/device-part/${ownerId}`, toForm(file), MULTIPART);
  },

  uploadBrokenPartImage(file: File, ownerId: string) {
    return api.post<ImageResponse>(`/file-upload/image/upload/broken-part/${ownerId}`, toForm(file), MULTIPART);
  },

  // ── Document uploads ──────────────────────────────────────────────────

  uploadBrokenPartDocument(file: File, ownerId: string) {
    return api.post<DocumentResponse>(
      `/file-upload/document/upload/broken-part/${ownerId}`,
      toForm(file),
      MULTIPART,
    );
  },

  uploadRepairRequestDocument(file: File, ownerId: string) {
    return api.post<DocumentResponse>(
      `/file-upload/document/upload/repair-request/${ownerId}`,
      toForm(file),
      MULTIPART,
    );
  },

  deleteDocument(documentId: string) {
    return api.post(`/file-upload/document/${documentId}/delete`);
  },

  getAttachedDocuments(ownerType: string, ownerId: string) {
    return api.get<{ documents: DocumentAttachment[] }>('/file-upload/document/attached', {
      params: { ownerType, ownerId },
    });
  },

  // ── Video uploads by target ───────────────────────────────────────────

  uploadRepairRequestVideo(file: File, ownerId: string) {
    return api.post<VideoResponse>(`/file-upload/video/upload/repair-request/${ownerId}`, toForm(file), MULTIPART);
  },

  uploadReviewVideo(file: File, ownerId: string) {
    return api.post<VideoResponse>(`/file-upload/video/upload/review/${ownerId}`, toForm(file), MULTIPART);
  },

  uploadDeviceVideo(file: File, ownerId: string) {
    return api.post<VideoResponse>(`/file-upload/video/upload/device/${ownerId}`, toForm(file), MULTIPART);
  },

  uploadArticleVideo(file: File, ownerId: string) {
    return api.post<VideoResponse>(`/file-upload/video/upload/article/${ownerId}`, toForm(file), MULTIPART);
  },

  // ── Attach / detach / query ───────────────────────────────────────────

  attachImage(imageId: string, ownerType: string, ownerId: string) {
    return api.post<ImageResponse>(`/file-upload/image/attach/${imageId}`, { ownerType, ownerId });
  },

  unattachImage(imageId: string) {
    return api.put(`/file-upload/image/unattach/${imageId}`);
  },

  deleteImage(imageId: string) {
    return api.delete(`/file-upload/image/delete/${imageId}`);
  },

  getAttachedImages(ownerType: string, ownerId: string, silent?: boolean) {
    return api.get<{ images: IImageAttachment[] }>('/file-upload/image/attached', {
      params: { ownerType, ownerId },
      ...(silent ? { _silent: true } : {}),
    } as any);
  },

  attachVideo(videoId: string, ownerType: string, ownerId: string) {
    return api.post(`/file-upload/video/attach/${videoId}`, { ownerType, ownerId });
  },

  unattachVideo(videoId: string) {
    return api.put(`/file-upload/video/unattach/${videoId}`);
  },

  deleteVideo(videoId: string) {
    return api.delete(`/file-upload/video/delete/${videoId}`);
  },

  getAttachedVideos(ownerType: string, ownerId: string, silent?: boolean) {
    return api.get<{ videos: any[] }>('/file-upload/video/attached', {
      params: { ownerType, ownerId },
      ...(silent ? { _silent: true } : {}),
    } as any);
  },
};
