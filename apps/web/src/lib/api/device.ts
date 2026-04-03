import type {
  CreateDeviceDto,
  UpdateDeviceDto,
} from '@asko/shared/client';
import type {
  IDevice,
  IImage,
  IImageAttachment,
  PaginatedDevices,
} from './types';
import { api } from './client';

export const deviceApi = {
  getAll(params?: { page?: number; limit?: number; search?: string; type?: string; isFeatured?: boolean }) {
    return api.get<PaginatedDevices>('/devices', { params });
  },

  getOne(id: string) {
    return api.get<IDevice>(`/devices/${id}`);
  },

  create(data: CreateDeviceDto) {
    return api.post<IDevice>('/devices', data);
  },

  importDevices(products: CreateDeviceDto[]) {
    return api.post<{ created: number; errors: string[] }>('/devices/import', products);
  },

  update(id: string, data: UpdateDeviceDto) {
    return api.patch<IDevice>(`/devices/${id}`, data);
  },

  delete(id: string) {
    return api.delete<void>(`/devices/${id}`);
  },

  deleteAll() {
    return api.delete<{ count: number }>('/devices/all');
  },

  // Parts
  getParts(deviceId: string) {
    return api.get<{ parts: any[] }>(`/devices/${deviceId}/parts`);
  },

  createPart(deviceId: string, data: { name: string; partNumber?: string; price?: number; description?: string }) {
    return api.post<{ part: any }>(`/devices/${deviceId}/parts`, data);
  },

  updatePart(deviceId: string, partId: string, data: { name?: string; partNumber?: string; price?: number; description?: string }) {
    return api.patch<{ part: any }>(`/devices/${deviceId}/parts/${partId}`, data);
  },

  deletePart(deviceId: string, partId: string) {
    return api.delete<void>(`/devices/${deviceId}/parts/${partId}`);
  },

  // Images
  getImages(deviceId: string) {
    return api.get<{ images: IImageAttachment[] }>(`/devices/${deviceId}/images`);
  },

  uploadImage(deviceId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<IImage>(`/devices/${deviceId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteImage(deviceId: string, imageId: string) {
    return api.delete<void>(`/devices/${deviceId}/images/${imageId}`);
  },

  reorderImages(deviceId: string, imageIds: string[]) {
    return api.put<void>(`/devices/${deviceId}/images/reorder`, imageIds);
  },

  // Part images
  getPartImages(deviceId: string, partId: string) {
    return api.get<{ images: IImageAttachment[] }>(`/devices/${deviceId}/parts/${partId}/images`);
  },

  uploadPartImage(deviceId: string, partId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<IImage>(`/devices/${deviceId}/parts/${partId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deletePartImage(deviceId: string, partId: string, imageId: string) {
    return api.delete<void>(`/devices/${deviceId}/parts/${partId}/images/${imageId}`);
  },

  // Notes
  addNote(deviceId: string, content: string, isPublic: boolean) {
    return api.post<void>(`/devices/${deviceId}/notes`, { content, isPublic });
  },
};
