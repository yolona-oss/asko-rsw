import type {
  CreateCertificateDto,
  RequestPointsWithdrawalDto,
  IUser,
} from '@asko/shared/client';
import type {
  IDealerProfile,
  IDealerClient,
  IPointsTransaction,
  ICertificate,
  IDevice,
  IPointsWithdrawal,
  PaginatedPoints,
  PaginatedCertificates,
  PaginatedDevices,
} from './types';
import { api } from './client';

/** @deprecated Use `Pick<IUser, 'id' | 'firstName' | 'lastName' | 'email'>` from `@asko/shared/client` */
export type SearchedUser = Pick<IUser, 'id' | 'firstName' | 'lastName' | 'email'>;

export const dealerApi = {
  getProfile() {
    return api.get<IDealerProfile>('/dealers/profile');
  },

  getClients() {
    return api.get<IDealerClient[]>('/dealers/clients');
  },

  searchUser(email: string) {
    return api.get<Pick<IUser, 'id' | 'firstName' | 'lastName' | 'email'>[]>('/dealers/search-user', { params: { email } });
  },

  getPointsHistory(params?: { offset?: number; limit?: number }) {
    return api.get<PaginatedPoints>('/dealers/points', { params });
  },

  getCertificates(params?: { offset?: number; limit?: number; search?: string; status?: string }) {
    return api.get<PaginatedCertificates>('/certificates/dealer', { params });
  },

  getDeviceCatalog(params?: { offset?: number; limit?: number }) {
    return api.get<PaginatedDevices>('/devices', { params });
  },

  createCertificate(data: CreateCertificateDto) {
    return api.post<ICertificate>('/certificates/create', data);
  },

  requestWithdraw(amount: number) {
    return api.post<IPointsWithdrawal>('/dealers/withdraw', { amount } satisfies RequestPointsWithdrawalDto);
  },

  getMyWithdrawals() {
    return api.get<IPointsWithdrawal[]>('/dealers/withdrawals');
  },
};
