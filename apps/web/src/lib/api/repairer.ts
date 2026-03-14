import { api } from './client';
import type { UpdateLocationDto, WorkStepStatus } from '@asko/shared/client';

export const repairerApi = {
  updateLocation(data: UpdateLocationDto) {
    return api.post('/repairers/location', data);
  },

  getProfile() {
    return api.get('/repairers/me');
  },

  getActiveRequest() {
    return api.get('/repairers/requests/active');
  },

  getAssignedRequests(params?: { page?: number; limit?: number; status?: string }) {
    return api.get('/repairers/requests', { params });
  },

  refuseRequest(requestId: string, reason: string) {
    return api.post(`/repair-requests/${requestId}/refuse`, { reason });
  },

  getWorkSteps(requestId: string) {
    return api.get(`/repair-requests/${requestId}/steps`);
  },

  updateWorkStep(requestId: string, stepId: string, status: WorkStepStatus) {
    return api.patch(`/repair-requests/${requestId}/steps/${stepId}`, { status });
  },

  completeWork(requestId: string, description: string, files: File[]) {
    const form = new FormData();
    form.append('description', description);
    files.forEach((file) => form.append('files', file));
    return api.post(`/repair-requests/${requestId}/complete`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getRepairerRating(repairerId: string) {
    return api.get(`/reviews/repairer/${repairerId}`);
  },

  getDevices() {
    return api.get('/devices');
  },

  getDevice(deviceId: string) {
    return api.get(`/devices/${deviceId}`);
  },

  addNote(deviceId: string, content: string, isPublic: boolean) {
    return api.post(`/devices/${deviceId}/notes`, { content, isPublic });
  },
};
