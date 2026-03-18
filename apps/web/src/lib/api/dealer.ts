import { api } from './client';

export interface SearchedUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export const dealerApi = {
  getProfile() {
    return api.get('/dealers/profile');
  },

  getClients() {
    return api.get('/dealers/clients');
  },

  searchUser(email: string) {
    return api.get<SearchedUser[]>('/dealers/search-user', { params: { email } });
  },

  getPointsHistory(params?: { offset?: number; limit?: number }) {
    return api.get('/dealers/points', { params });
  },

  getCertificates(params?: { offset?: number; limit?: number; search?: string; status?: string }) {
    return api.get('/certificates/dealer', { params });
  },

  getDeviceCatalog(params?: { offset?: number; limit?: number }) {
    return api.get('/devices', { params });
  },

  createCertificate(data: {
    clientUserId: string;
    deviceId: string;
    serialNumber: string;
    country: string;
    city: string;
    street: string;
    house: number;
    building?: number;
    floor?: number;
    room?: number;
    postalCode?: string;
    expiresAt: string;
    purchaseReceiptUrl?: string;
    description?: string;
  }) {
    return api.post('/certificates/create', data);
  },
};
