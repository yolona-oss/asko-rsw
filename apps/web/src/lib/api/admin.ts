import { CreateInvitationLinkDto } from '@asko/shared';
import { api } from './client';

export const adminApi = {
  // Devices
  getDevices(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get('/devices', { params });
  },
  getDevice(id: string) {
    return api.get(`/devices/${id}`);
  },
  createDevice(data: Record<string, unknown>) {
    return api.post('/devices', data);
  },
  importDevices(products: Record<string, unknown>[]) {
    return api.post<{ created: number; errors: string[] }>('/devices/import', products);
  },
  updateDevice(id: string, data: Record<string, unknown>) {
    return api.patch(`/devices/${id}`, data);
  },
  deleteDevice(id: string) {
    return api.delete(`/devices/${id}`);
  },
  deleteAllDevices() {
    return api.delete<{ count: number }>('/devices/all');
  },
  getDeviceImages(deviceId: string) {
    return api.get(`/devices/${deviceId}/images`);
  },
  uploadDeviceImage(deviceId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/devices/${deviceId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteDeviceImage(deviceId: string, imageId: string) {
    return api.delete(`/devices/${deviceId}/images/${imageId}`);
  },
  reorderDeviceImages(deviceId: string, imageIds: string[]) {
    return api.put(`/devices/${deviceId}/images/reorder`, imageIds);
  },

  // Articles
  getArticles(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get('/articles', { params });
  },
  getArticle(id: string) {
    return api.get(`/articles/${id}`);
  },
  createArticle(data: Record<string, unknown>) {
    return api.post('/articles', data);
  },
  updateArticle(id: string, data: Record<string, unknown>) {
    return api.patch(`/articles/${id}`, data);
  },
  deleteArticle(id: string) {
    return api.delete(`/articles/${id}`);
  },
  deleteAllArticles() {
    return api.delete<{ count: number }>('/articles/all');
  },
  getArticleImages(articleId: string) {
    return api.get(`/articles/${articleId}/images`);
  },
  uploadArticleImage(articleId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/articles/${articleId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteArticleImage(articleId: string, imageId: string) {
    return api.delete(`/articles/${articleId}/images/${imageId}`);
  },
  reorderArticleImages(articleId: string, imageIds: string[]) {
    return api.put(`/articles/${articleId}/images/reorder`, imageIds);
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
  getCertificates(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get('/certificates', { params });
  },
  getPendingCertificates(params?: { offset?: number; limit?: number }) {
    return api.get('/certificates/pending', { params });
  },
  approveCertificate(id: string) {
    return api.post(`/certificates/${id}/approve`);
  },
  revokeCertificate(id: string) {
    return api.post(`/certificates/${id}/revoke`);
  },
};
