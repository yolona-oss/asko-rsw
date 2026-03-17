import { api } from './client';

export const managerApi = {
  getRepairers(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get('/repairers', { params });
  },

  getRepairer(id: string) {
    return api.get(`/repairers/${id}`);
  },

  createRepairer(data: { userId: string; city: string; specializations?: string[] }) {
    return api.post('/repairers', data);
  },

  updateRepairer(id: string, data: { isActive?: boolean; city?: string; specializations?: string[] }) {
    return api.patch(`/repairers/${id}`, data);
  },

  // Repair requests
  getRepairRequests(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get('/repair-requests', { params });
  },

  getRepairRequest(id: string) {
    return api.get(`/repair-requests/${id}`);
  },

  assignRepairer(requestId: string, repairerId: string) {
    return api.post(`/repair-requests/${requestId}/assign`, { repairerId });
  },

  getRepairersInCity(city: string) {
    return api.get(`/repairers/city/${city}`);
  },
};
