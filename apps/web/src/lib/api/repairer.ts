import type {
  CreateRepairerDto,
  UpdateRepairerDto,
  UpdateLocationDto,
} from '@asko/shared/client';
import type {
  RepairerRecord,
  PaginatedRepairers,
} from './types';
import { api } from './client';

export const repairerApi = {
  getAll(params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }) {
    return api.get<PaginatedRepairers>('/repairers', { params });
  },

  getForAssignment(params?: { page?: number; limit?: number }) {
    return api.get<PaginatedRepairers>('/repairers/for-assignment', { params });
  },

  getOne(id: string) {
    return api.get<RepairerRecord>(`/repairers/${id}`);
  },

  create(data: CreateRepairerDto) {
    return api.post<RepairerRecord>('/repairers', data);
  },

  update(id: string, data: UpdateRepairerDto) {
    return api.patch<RepairerRecord>(`/repairers/${id}`, data);
  },

  getProfile() {
    return api.get<{ repairer: RepairerRecord }>('/repairers/me');
  },

  updateLocation(data: UpdateLocationDto) {
    return api.post<void>('/repairers/location', data);
  },

  getInCity(city: string) {
    return api.get<RepairerRecord[]>(`/repairers/city/${city}`);
  },
};
