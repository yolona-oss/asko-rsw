import { api } from './client';

export interface SearchedUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ClientDevice {
  id: string;
  device?: { name?: string; model?: string };
  serialNumber?: string;
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

  getUserDevices(userId: string) {
    return api.get<ClientDevice[]>(`/dealers/user-devices/${userId}`);
  },

  getPointsHistory(params?: { offset?: number; limit?: number }) {
    return api.get('/dealers/points', { params });
  },

  getCertificates(params?: { offset?: number; limit?: number; search?: string; status?: string }) {
    return api.get('/certificates/dealer', { params });
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
