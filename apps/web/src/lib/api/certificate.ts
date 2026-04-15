import type {
  AddCertificateDto,
  CreateCertificateDto,
  SelfCreateCertificateDto,
  ReapplyCertificateDto,
} from '@asko/shared/client';
import type {
  ICertificate,
  PaginatedCertificates,
  ProcessInvoiceResult,
} from './types';
import { api } from './client';

export const certificateApi = {
  getAll(params?: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string; dateFrom?: string; dateTo?: string }) {
    return api.get<PaginatedCertificates>('/certificates', { params });
  },

  async getMy() {
    const { data } = await api.get<{ certificates: ICertificate[] }>('/certificates/my');
    return { data: (data?.certificates ?? []) as ICertificate[] };
  },

  getDealer(params?: { page?: number; limit?: number; search?: string; status?: string; dateFrom?: string; dateTo?: string }) {
    return api.get<PaginatedCertificates>('/certificates/dealer', { params });
  },

  getOne(id: string) {
    return api.get<ICertificate>(`/certificates/${id}`);
  },

  add(data: AddCertificateDto) {
    return api.post<ICertificate>('/certificates/add', data);
  },

  create(data: CreateCertificateDto) {
    return api.post<ICertificate>('/certificates/create', data);
  },

  selfCreate(data: SelfCreateCertificateDto) {
    return api.post<{ certificate: ICertificate }>('/certificates/self-create', data);
  },

  reapply(id: string, data: ReapplyCertificateDto) {
    return api.post<ICertificate>(`/certificates/${id}/reapply`, data);
  },

  calculatePrice(userDeviceId: string, durationMonths: number) {
    return api.get<{ price: number }>('/certificates/calculate-price', {
      params: { userDeviceId, durationMonths },
    });
  },

  revoke(id: string) {
    return api.post<ICertificate>(`/certificates/${id}/revoke`);
  },

  pay(certId: string) {
    return api.post<ProcessInvoiceResult>(`/certificates/${certId}/pay`);
  },

  dummyPay(certId: string) {
    return api.post<ProcessInvoiceResult>(`/certificates/${certId}/dummy-pay`);
  },

  generatePdf(certId: string, force?: boolean) {
    return api.post<{ documentId: string }>(`/certificates/${certId}/pdf/generate`, null, {
      params: force ? { force: 'true' } : undefined,
    });
  },
};
