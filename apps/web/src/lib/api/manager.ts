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

  // Broken parts
  getBrokenParts(requestId: string) {
    return api.get<{ parts: any[] }>(`/repair-requests/${requestId}/broken-parts`);
  },

  addBrokenPart(requestId: string, data: { devicePartId?: string; name?: string; note?: string }) {
    return api.post<{ part: any }>(`/repair-requests/${requestId}/broken-parts`, data);
  },

  updateBrokenPart(requestId: string, partId: string, data: { name?: string; note?: string }) {
    return api.post<{ part: any }>(`/repair-requests/${requestId}/broken-parts/${partId}/update`, data);
  },

  updateBrokenPartStatus(requestId: string, partId: string, status: string) {
    return api.post<{ part: any }>(`/repair-requests/${requestId}/broken-parts/${partId}/status`, { status });
  },

  deleteBrokenPart(requestId: string, partId: string) {
    return api.post<void>(`/repair-requests/${requestId}/broken-parts/${partId}/delete`);
  },

  getRepairersInCity(city: string) {
    return api.get<IRepairer[]>(`/repairers/city/${city}`);
  },
};
