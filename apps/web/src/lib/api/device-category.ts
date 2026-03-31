import type { CreateDeviceCategoryDto, UpdateDeviceCategoryDto } from '@asko/shared/client';
import { api } from './client';

export interface DeviceCategoryRecord {
  id: string;
  name: string;
  label: string;
  labelPlural: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceCategoryListResponse {
  categories: DeviceCategoryRecord[];
}

// ── Client-side API (uses axios — requires Redux store) ──

export const deviceCategoryApi = {
  getAll() {
    return api.get<DeviceCategoryListResponse>('/device-categories');
  },

  getOne(id: string) {
    return api.get<DeviceCategoryRecord>(`/device-categories/${id}`);
  },

  create(data: CreateDeviceCategoryDto) {
    return api.post<DeviceCategoryRecord>('/device-categories', data);
  },

  update(id: string, data: UpdateDeviceCategoryDto) {
    return api.patch<DeviceCategoryRecord>(`/device-categories/${id}`, data);
  },

  delete(id: string) {
    return api.delete<void>(`/device-categories/${id}`);
  },
};
