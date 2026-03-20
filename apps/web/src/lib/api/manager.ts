import type {
  IRepairer,
  IRepairRequest,
  ListResponseDto,
  CreateRepairerDto,
  UpdateRepairerDto,
  AssignRepairerDto,
} from '@asko/shared/client';
import { api } from './client';

export const managerApi = {
  getRepairers(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get<ListResponseDto<IRepairer>>('/repairers', { params });
  },

  getRepairer(id: string) {
    return api.get<IRepairer>(`/repairers/${id}`);
  },

  createRepairer(data: CreateRepairerDto) {
    return api.post<IRepairer>('/repairers', data);
  },

  updateRepairer(id: string, data: UpdateRepairerDto) {
    return api.patch<IRepairer>(`/repairers/${id}`, data);
  },

  // Repair requests
  getRepairRequests(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get<ListResponseDto<IRepairRequest>>('/repair-requests', { params });
  },

  getRepairRequest(id: string) {
    return api.get<IRepairRequest>(`/repair-requests/${id}`);
  },

  assignRepairer(requestId: string, repairerId: string) {
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/assign`, { repairerId } satisfies AssignRepairerDto);
  },

  getRepairersInCity(city: string) {
    return api.get<IRepairer[]>(`/repairers/city/${city}`);
  },
};
