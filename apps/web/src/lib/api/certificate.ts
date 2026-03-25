import type {
  AddCertificateDto,
  CreateCertificateDto,
} from '@asko/shared/client';
import type {
  ICertificate,
  PaginatedCertificates,
  ProcessInvoiceResult,
} from './types';
import { api } from './client';

export const certificateApi = {
  getAll(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get<PaginatedCertificates>('/certificates', { params });
  },

  async getMy() {
    const { data } = await api.get<{ certificates: ICertificate[] }>('/certificates/my');
    return { data: (data?.certificates ?? []) as ICertificate[] };
  },

  getDealer(params?: { offset?: number; limit?: number; search?: string; status?: string }) {
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

  revoke(id: string) {
    return api.post<ICertificate>(`/certificates/${id}/revoke`);
  },

  pay(certId: string) {
    return api.post<ProcessInvoiceResult>(`/certificates/${certId}/pay`);
  },

  dummyPay(certId: string) {
    return api.post<ProcessInvoiceResult>(`/certificates/${certId}/dummy-pay`);
  },
};
