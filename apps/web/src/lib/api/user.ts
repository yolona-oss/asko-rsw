import { api } from './client';

export const userApi = {
  getMyRequests(params?: { offset?: number; limit?: number }) {
    return api.get('/repair-requests/my', { params });
  },

  getRepairRequest(id: string) {
    return api.get(`/repair-requests/${id}`);
  },

  getMyCertificates() {
    return api.get('/certificates/my');
  },

  getCertificate(id: string) {
    return api.get(`/certificates/${id}`);
  },
};
