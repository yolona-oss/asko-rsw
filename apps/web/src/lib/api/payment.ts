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

export const paymentApi = {
  getOptions() {
    return api.get<PaymentOptions>('/payment/options');
  },

  createPayment(data: CreatePaymentParams) {
    return api.post<CreatePaymentResult>('/payment/create', data);
  },
};
