import type {
  CreateInvitationLinkDto,
  CreateDeviceDto,
  UpdateDeviceDto,
  CreateArticleDto,
  UpdateArticleDto,
  IDevice,
  IArticle,
  IInvitationLink,
  IAuthUser,
  ICertificate,
  PaginatedResponseDto,
  ListResponseDto,
} from '@asko/shared/client';
import { api } from './client';
import { fileUploadApi } from './file-upload';

export const adminApi = {
  // Devices
  getDevices(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get<ListResponseDto<IDevice>>('/devices', { params });
  },
  getDevice(id: string) {
    return api.get<IDevice>(`/devices/${id}`);
  },
  createDevice(data: CreateDeviceDto) {
    return api.post<IDevice>('/devices', data);
  },
  importDevices(products: CreateDeviceDto[]) {
    return api.post<{ created: number; errors: string[] }>('/devices/import', products);
  },
  updateDevice(id: string, data: UpdateDeviceDto) {
    return api.patch<IDevice>(`/devices/${id}`, data);
  },
  deleteDevice(id: string) {
    return api.delete<void>(`/devices/${id}`);
  },
  deleteAllDevices() {
    return api.delete<{ count: number }>('/devices/all');
  },
  getDeviceImages: fileUploadApi.getDeviceImages,
  uploadDeviceImage: fileUploadApi.uploadDeviceImage,
  deleteDeviceImage: fileUploadApi.deleteDeviceImage,
  reorderDeviceImages: fileUploadApi.reorderDeviceImages,

  // Articles
  getArticles(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get<ListResponseDto<IArticle>>('/articles', { params });
  },
  getArticle(id: string) {
    return api.get<IArticle>(`/articles/${id}`);
  },
  createArticle(data: CreateArticleDto) {
    return api.post<IArticle>('/articles', data);
  },
  updateArticle(id: string, data: UpdateArticleDto) {
    return api.patch<IArticle>(`/articles/${id}`, data);
  },
  deleteArticle(id: string) {
    return api.delete<void>(`/articles/${id}`);
  },
  deleteAllArticles() {
    return api.delete<{ count: number }>('/articles/all');
  },
  getArticleImages: fileUploadApi.getArticleImages,
  uploadArticleImage: fileUploadApi.uploadArticleImage,
  deleteArticleImage: fileUploadApi.deleteArticleImage,
  reorderArticleImages: fileUploadApi.reorderArticleImages,

  // Invitations
  getInvitations() {
    return api.get<IInvitationLink[]>('/invite/');
  },
  createInvitation(data: CreateInvitationLinkDto) {
    return api.post<{ invite: IInvitationLink; link: string }>('/invite', data, { withCredentials: true });
  },
  deleteInvitation(id: string) {
    return api.delete<void>(`/invite/${id}`);
  },

  // Users
  getUsers(params?: { page?: number; limit?: number }) {
    return api.get<PaginatedResponseDto<IAuthUser>>('/users/', { params });
  },
  deleteUser(id: string) {
    return api.delete<void>('/users/delete', { params: { userId: id } });
  },

  // Certificates
  getCertificates(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get<ListResponseDto<ICertificate>>('/certificates', { params });
  },
  getPendingCertificates(params?: { offset?: number; limit?: number }) {
    return api.get<ListResponseDto<ICertificate>>('/certificates/pending', { params });
  },
  approveCertificate(id: string) {
    return api.post<ICertificate>(`/certificates/${id}/approve`);
  },
  revokeCertificate(id: string) {
    return api.post<ICertificate>(`/certificates/${id}/revoke`);
  },
};
