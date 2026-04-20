import type { CreatePaymentDto } from '@asko/shared/client';
import type {
  PaginatedPayments,
  PaymentOptions,
  ProcessInvoice,
  PaymentStats,
} from './types';
import { api } from './client';

export const paymentApi = {
  getOptions() {
    return api.get<PaymentOptions>('/payment/options');
  },

  createPayment(data: CreatePaymentDto) {
    return api.post<ProcessInvoice>('/payment/create', data);
  },

  listPayments(params?: { page?: number; limit?: number; status?: string; provider?: string; search?: string; sortBy?: string; sortOrder?: string; dateFrom?: string; dateTo?: string }) {
    return api.get<PaginatedPayments>('/payment/list', { params });
  },

  getMyPayments(params?: { page?: number; limit?: number; status?: string; sortBy?: string; sortOrder?: string }) {
    return api.get<PaginatedPayments>('/payment/my', { params });
  },

  getStats(params?: { dateFrom?: string; dateTo?: string }) {
    return api.get<PaymentStats>('/payment/stats', { params });
  },

  getMyStats(params?: { dateFrom?: string; dateTo?: string }) {
    return api.get<PaymentStats>('/payment/my/stats', { params });
  },

  confirmCashPayment(paymentId: string, confirmCode: string, amount: number) {
    return api.post<{ paymentId: string; status: string }>('/payment/confirm-cash', { paymentId, confirmCode, amount });
  },
};
