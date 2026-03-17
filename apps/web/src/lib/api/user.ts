import { api } from './client';

export const userApi = {
  getMyRequests(params?: { offset?: number; limit?: number }) {
    return api.get('/repair-requests/my', { params });
  },

  getRepairRequest(id: string) {
    return api.get(`/repair-requests/${id}`);
  },

  createRepairRequest(data: {
    userDeviceId: string;
    description: string;
    certificateId?: string;
    preferredDate?: string;
  }) {
    return api.post('/repair-requests', data);
  },

  getMyDevices() {
    return api.get('/user-devices');
  },

  getMyCertificates() {
    return api.get('/certificates/my');
  },

  getCertificate(id: string) {
    return api.get(`/certificates/${id}`);
  },

  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/file-upload/image/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  attachImage(imageId: string, ownerType: string, ownerId: string) {
    return api.post(`/file-upload/image/attach/${imageId}`, {
      ownerType,
      ownerId,
    });
  },

  getWorkSteps(requestId: string) {
    return api.get(`/repair-requests/${requestId}/steps`);
  },
};
