import { api } from './client';

export const dealerApi = {
  getProfile() {
    return api.get('/dealers/profile');
  },

  getClients() {
    return api.get('/dealers/clients');
  },

  getPointsHistory(params?: { offset?: number; limit?: number }) {
    return api.get('/dealers/points', { params });
  },

  getCertificates() {
    return api.get('/certificates/dealer');
  },

  createCertificate(data: {
    clientUserId: string;
    userDeviceId: string;
    expiresAt: string;
    purchaseReceiptUrl?: string;
    description?: string;
  }) {
    return api.post('/certificates/create', data);
  },
};
