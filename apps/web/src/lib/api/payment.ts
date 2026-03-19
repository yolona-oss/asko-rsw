import { api } from './client';

export interface PaymentOptions {
  providers: string[];
  defaultProvider: string;
}

export interface CreatePaymentParams {
  targetType: 'repairRequest' | 'certificate';
  targetId: string;
  amount: number;
  currency?: string;
  provider?: string;
}

export interface CreatePaymentResult {
  paymentId: string;
  status: string;
  redirectUrl?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider?: string;
  targetType?: string;
  targetId?: string;
  paidAt?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface PaymentListResult {
  data: PaymentRecord[];
  total: number;
}

export interface PaymentStats {
  confirmedTotal: number;
  refundedTotal: number;
  confirmedCount: number;
  refundedCount: number;
}

export const paymentApi = {
  getOptions() {
    return api.get<PaymentOptions>('/payment/options');
  },

  createPayment(data: CreatePaymentParams) {
    return api.post<CreatePaymentResult>('/payment/create', data);
  },

  listPayments(params?: { offset?: number; limit?: number; status?: string; provider?: string; search?: string }) {
    return api.get<PaymentListResult>('/payment/list', { params });
  },

  getMyPayments(params?: { offset?: number; limit?: number; status?: string }) {
    return api.get<PaymentListResult>('/payment/my', { params });
  },

  getStats() {
    return api.get<PaymentStats>('/payment/stats');
  },

  getMyStats() {
    return api.get<PaymentStats>('/payment/my/stats');
  },
};
