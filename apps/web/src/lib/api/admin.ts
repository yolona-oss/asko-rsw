import { CreateInvitationLinkDto } from '@asko/shared';
import { api } from './client';

export const adminApi = {
  // Devices
  getDevices() {
    return api.get('/devices');
  },
  getDevice(id: string) {
    return api.get(`/devices/${id}`);
  },
  createDevice(data: Record<string, unknown>) {
    return api.post('/devices', data);
  },
  updateDevice(id: string, data: Record<string, unknown>) {
    return api.patch(`/devices/${id}`, data);
  },
  deleteDevice(id: string) {
    return api.delete(`/devices/${id}`);
  },

  // Invitations
  getInvitations() {
    return api.get('/invite/');
  },
  createInvitation(data: CreateInvitationLinkDto) {
    return api.post('/invite', data, { withCredentials: true });
  },
  deleteInvitation(id: string) {
    return api.delete(`/invite/${id}`);
  },

  // Users
  getUsers(params?: { page?: number; limit?: number }) {
    return api.get('/users/', { params });
  },
  deleteUser(id: string) {
    return api.delete('/users/delete', { params: { userId: id } });
  },

  // Certificates
  getCertificates() {
    return api.get('/certificates');
  },
  getPendingCertificates() {
    return api.get('/certificates/pending');
  },
  approveCertificate(id: string) {
    return api.post(`/certificates/${id}/approve`);
  },
  revokeCertificate(id: string) {
    return api.post(`/certificates/${id}/revoke`);
  },
};
