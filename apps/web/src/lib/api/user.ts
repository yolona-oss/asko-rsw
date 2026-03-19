import { api } from './client';
import { fileUploadApi } from './file-upload';

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

  addCertificate(data: { userDeviceId: string; certificateNumber: string; expiresAt: string }) {
    return api.post('/certificates/add', data);
  },

  uploadImage: fileUploadApi.uploadImage,
  attachImage: fileUploadApi.attachImage,

  getWorkSteps(requestId: string) {
    return api.get(`/repair-requests/${requestId}/steps`);
  },

  getDeviceCatalog(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get('/devices', { params });
  },

  createAddress(data: {
    country: string;
    city: string;
    street: string;
    house: number;
    building?: number;
    floor?: number;
    room?: number;
    postalCode?: string;
  }) {
    return api.post('/address', data);
  },

  registerDevice(data: {
    deviceId: string;
    serialNumber: string;
    addressId: string;
    purchaseDate?: string;
    warrantyUntil?: string;
    notes?: string;
  }) {
    return api.post('/user-devices', data);
  },

  dummyPay(requestId: string) {
    return api.post(`/repair-requests/${requestId}/dummy-pay`);
  },

  createReview(data: { repairRequestId: string; rating: number; comment?: string }) {
    return api.post('/reviews', data);
  },

  uploadReviewImage: fileUploadApi.uploadReviewImage,

  getMyReviews() {
    return api.get('/reviews/my');
  },
};
