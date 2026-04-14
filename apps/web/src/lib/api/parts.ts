import type { PaginatedDeviceParts, DevicePartResponse } from './types';
import { api } from './client';

export const partsApi = {
  getAll(params?: { page?: number; limit?: number; search?: string; deviceId?: string; categoryId?: string; genericOnly?: boolean }) {
    return api.get<PaginatedDeviceParts>('/parts', { params });
  },

  create(data: { deviceId?: string; categoryId?: string; group?: string; name: string; partNumber?: string; price?: number; description?: string }) {
    return api.post<DevicePartResponse>('/parts', data);
  },

  update(partId: string, data: { deviceId?: string; categoryId?: string; group?: string; name?: string; partNumber?: string; price?: number; description?: string }) {
    return api.patch<DevicePartResponse>(`/parts/${partId}`, data);
  },

  delete(partId: string) {
    return api.delete<void>(`/parts/${partId}`);
  },
};
