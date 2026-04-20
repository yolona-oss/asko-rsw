import type {
  CreateCertificateDto,
  RequestPointsWithdrawalDto,
  IUser,
} from '@asko/shared/client';
import type {
  DealerProfileRecord,
  DealerClientRecord,
  CertificateRecord,
  WithdrawalRecord,
  PaginatedPoints,
  PaginatedCertificates,
  PaginatedDevices,
} from './types';
import { api } from './client';

/** @deprecated Use `Pick<IUser, 'id' | 'firstName' | 'lastName' | 'email'>` from `@asko/shared/client` */
export type SearchedUser = Pick<IUser, 'id' | 'firstName' | 'lastName' | 'email'>;

export const dealerApi = {
  getProfile() {
    return api.get<{ profile: DealerProfileRecord }>('/dealers/profile');
  },

  getClients() {
    return api.get<{ clients: DealerClientRecord[] }>('/dealers/clients');
  },

  searchUser(email: string) {
    return api.get<Pick<IUser, 'id' | 'firstName' | 'lastName' | 'email'>>('/dealers/search-user', {
      params: { email },
      _silent: true,
    } as any);
  },

  getPointsHistory(params?: { page?: number; limit?: number }) {
    return api.get<PaginatedPoints>('/dealers/points', { params });
  },

  getCertificates(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    return api.get<PaginatedCertificates>('/certificates/dealer', { params });
  },

  getDeviceCatalog(params?: { page?: number; limit?: number }) {
    return api.get<PaginatedDevices>('/devices', { params });
  },

  createCertificate(data: CreateCertificateDto) {
    return api.post<CertificateRecord>('/certificates/create', data);
  },

  requestWithdraw(amount: number, cardNumber: string, cardHolderName: string) {
    return api.post<WithdrawalRecord>('/dealers/withdraw', { amount, cardNumber, cardHolderName } satisfies RequestPointsWithdrawalDto);
  },

  getMyWithdrawals() {
    return api.get<{ withdrawals: WithdrawalRecord[] }>('/dealers/withdrawals');
  },
};
