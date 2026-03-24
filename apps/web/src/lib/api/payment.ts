import type { CreatePaymentDto } from '@asko/shared/client';
import type {
  PaginatedPayments,
  PaymentOptionsDto,
  ProcessInvoiceResult,
  PaymentStatsDto,
  IRepairPayment,
} from './types';
import { api } from './client';

/** @deprecated Use `PaymentOptionsDto` from `@asko/shared/client` */
export type PaymentOptions = PaymentOptionsDto;
/** @deprecated Use `CreatePaymentDto` from `@asko/shared/client` */
export type CreatePaymentParams = CreatePaymentDto;
/** @deprecated Use `ProcessInvoiceResult` from `@asko/shared/client` */
export type CreatePaymentResult = ProcessInvoiceResult;
/** @deprecated Use `IRepairPayment` from `@asko/shared/client` */
export type PaymentRecord = IRepairPayment;
/** @deprecated Use `PaymentStatsDto` from `@asko/shared/client` */
export type PaymentStats = PaymentStatsDto;

export const paymentApi = {
  getOptions() {
    return api.get<PaymentOptionsDto>('/payment/options');
  },

  createPayment(data: CreatePaymentDto) {
    return api.post<ProcessInvoiceResult>('/payment/create', data);
  },

  listPayments(params?: { offset?: number; limit?: number; status?: string; provider?: string; search?: string }) {
    return api.get<PaginatedPayments>('/payment/list', { params });
  },

  getMyPayments(params?: { offset?: number; limit?: number; status?: string }) {
    return api.get<PaginatedPayments>('/payment/my', { params });
  },

  getStats() {
    return api.get<PaymentStatsDto>('/payment/stats');
  },

  getMyStats() {
    return api.get<PaymentStatsDto>('/payment/my/stats');
  },
};
