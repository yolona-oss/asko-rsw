import type {
  PaginatedResponseDto,
  PaymentOptionsDto,
  CreatePaymentDto,
  ProcessInvoiceResult,
  PaymentStatsDto,
  IRepairPayment,
} from '@asko/shared/client';
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
    return api.get<PaginatedResponseDto<IRepairPayment>>('/payment/list', { params });
  },

  getMyPayments(params?: { offset?: number; limit?: number; status?: string }) {
    return api.get<PaginatedResponseDto<IRepairPayment>>('/payment/my', { params });
  },

  getStats() {
    return api.get<PaymentStatsDto>('/payment/stats');
  },

  getMyStats() {
    return api.get<PaymentStatsDto>('/payment/my/stats');
  },
};
