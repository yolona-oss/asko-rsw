import type { CreateDeviceCategoryDto, UpdateDeviceCategoryDto } from '@asko/shared/client';
import { api } from './client';
import type { DeviceCategoryRecord, DeviceCategoryList } from './types';

export type { DeviceCategoryRecord, DeviceCategoryList };

// ── Client-side API (uses axios — requires Redux store) ──

export const deviceCategoryApi = {
  getAll() {
    return api.get<DeviceCategoryList>('/device-categories');
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
