import type {
  CreateRepairerDto,
  UpdateRepairerDto,
  UpdateLocationDto,
} from '@asko/shared/client';
import type {
  IRepairer,
  PaginatedRepairers,
} from './types';
import { api } from './client';

export const repairerApi = {
  getAll(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get<PaginatedRepairers>('/repairers', { params });
  },

  getForAssignment(params?: { offset?: number; limit?: number }) {
    return api.get<PaginatedRepairers>('/repairers/for-assignment', { params });
  },

  getOne(id: string) {
    return api.get<IRepairer>(`/repairers/${id}`);
  },

  create(data: CreateRepairerDto) {
    return api.post<IRepairer>('/repairers', data);
  },

  update(id: string, data: UpdateRepairerDto) {
    return api.patch<IRepairer>(`/repairers/${id}`, data);
  },

  getProfile() {
    return api.get<IRepairer>('/repairers/me');
  },

  updateLocation(data: UpdateLocationDto) {
    return api.post<void>('/repairers/location', data);
  },

  getInCity(city: string) {
    return api.get<IRepairer[]>(`/repairers/city/${city}`);
  },
};
