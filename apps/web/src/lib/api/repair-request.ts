import type {
  CreateRepairRequestDto,
  AssignRepairerDto,
  RefuseRequestDto,
  SetRepairPriceDto,
  AddWorkStepDto,
  UpdateWorkStepDto,
} from '@asko/shared/client';
import type {
  PaymentList,
  PaginatedRepairRequests,
  ProcessInvoice,
  RepairRequestRecord,
  RepairRequestResponse,
  BrokenPartResponse,
  BrokenPartList,
  ImageList,
  WorkStepList,
  WorkStepResponse,
  CompleteStep,
} from './types';
import { api } from './client';

export const repairRequestApi = {
  // List / Get
  getAll(params?: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string; dateFrom?: string; dateTo?: string }) {
    return api.get<PaginatedRepairRequests>('/repair-requests', { params });
  },

  getMy(params?: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string; dateFrom?: string; dateTo?: string }) {
    return api.get<PaginatedRepairRequests>('/repair-requests/my', { params });
  },

  getAssigned(params?: { page?: number; limit?: number; status?: string; search?: string; sortBy?: string; sortOrder?: string; dateFrom?: string; dateTo?: string }) {
    return api.get<PaginatedRepairRequests>('/repair-requests/assigned', { params });
  },

  getActive() {
    return api.get<RepairRequestRecord | null>('/repair-requests/active');
  },

  getOne(id: string) {
    return api.get<RepairRequestResponse>(`/repair-requests/${id}`);
  },

  create(data: CreateRepairRequestDto) {
    return api.post<RepairRequestResponse>('/repair-requests', data);
  },

  // Status changes
  assign(requestId: string, repairerId: string, allowCrossCity?: boolean) {
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/assign`, { repairerId, allowCrossCity } satisfies AssignRepairerDto);
  },

  accept(requestId: string) {
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/accept`);
  },

  depart(requestId: string) {
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/depart`);
  },

  start(requestId: string) {
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/start`);
  },

  reassign(requestId: string, repairerId: string, allowCrossCity?: boolean) {
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/reassign`, { repairerId, allowCrossCity } satisfies AssignRepairerDto);
  },

  acceptChat(requestId: string) {
    return api.post(`/repair-requests/${requestId}/chat/accept`);
  },

  detachChat(requestId: string) {
    return api.post(`/repair-requests/${requestId}/chat/detach`);
  },

  getPaused(params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }) {
    return api.get<PaginatedRepairRequests>('/repair-requests/paused', { params });
  },

  pause(requestId: string) {
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/pause`);
  },

  resume(requestId: string) {
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/resume`);
  },

  refuse(requestId: string, reason: string) {
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/refuse`, { reason } satisfies RefuseRequestDto);
  },

  setPrice(requestId: string, data: SetRepairPriceDto) {
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/set-price`, data);
  },

  // AVR (Work Completion Act)
  generateAvr(requestId: string, data?: { completionNote?: string }) {
    return api.post<{ request: RepairRequestRecord; avrDocumentId: string }>(`/repair-requests/${requestId}/avr/generate`, data ?? {});
  },

  resetAvr(requestId: string) {
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/avr/reset`);
  },

  initiateAvrSigning(requestId: string) {
    return api.post<{ channel: string; maskedTarget: string; retryAfter: number }>(`/repair-requests/${requestId}/avr/sign/initiate`);
  },

  resendAvrOtp(requestId: string) {
    return api.post<{ channel: string; maskedTarget: string; retryAfter: number }>(`/repair-requests/${requestId}/avr/sign/resend`);
  },

  verifyAvrSigning(requestId: string, data: { code?: string; password?: string }) {
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/avr/sign/verify`, data);
  },

  confirmAvrOffline(requestId: string) {
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/avr/offline/confirm`);
  },

  removeAvrByManager(requestId: string) {
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/avr/remove`);
  },

  uploadAvrScan(requestId: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/avr/scan/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Payments
  pay(requestId: string) {
    return api.post<ProcessInvoice>(`/repair-requests/${requestId}/pay`);
  },

  dummyPay(requestId: string) {
    return api.post<ProcessInvoice>(`/repair-requests/${requestId}/dummy-pay`);
  },

  async getPayments(requestId: string) {
    const res = await api.get<PaymentList>(`/repair-requests/${requestId}/payments`);
    res.data.payments ??= [];
    return res;
  },

  // Work steps
  async getSteps(requestId: string) {
    const res = await api.get<WorkStepList>(`/repair-requests/${requestId}/steps`);
    res.data.steps ??= [];
    return res;
  },

  addStep(requestId: string, data: AddWorkStepDto) {
    return api.post<WorkStepResponse>(`/repair-requests/${requestId}/steps`, data);
  },

  updateStep(requestId: string, stepId: string, data: Partial<UpdateWorkStepDto>) {
    return api.post<WorkStepResponse>(`/repair-requests/${requestId}/steps/${stepId}/update`, data);
  },

  completeStep(requestId: string, stepId: string) {
    return api.post<CompleteStep>(`/repair-requests/${requestId}/steps/${stepId}/complete`);
  },

  deleteStep(requestId: string, stepId: string) {
    return api.post<void>(`/repair-requests/${requestId}/steps/${stepId}/delete`);
  },

  lockSteps(requestId: string) {
    return api.post<RepairRequestResponse>(`/repair-requests/${requestId}/steps/lock`);
  },

  approveDiagnostics(requestId: string) {
    return api.post<void>(`/repair-requests/${requestId}/steps/diagnostics/approve`);
  },

  declineDiagnostics(requestId: string, reason?: string) {
    return api.post<WorkStepList>(`/repair-requests/${requestId}/steps/diagnostics/decline`, { reason });
  },

  // Broken parts
  getBrokenParts(requestId: string) {
    return api.get<BrokenPartList>(`/repair-requests/${requestId}/broken-parts`);
  },

  addBrokenPart(requestId: string, data: { devicePartId?: string; name?: string; note?: string }) {
    return api.post<BrokenPartResponse>(`/repair-requests/${requestId}/broken-parts`, data);
  },

  suggestBrokenPart(requestId: string, data: { name?: string; note?: string }) {
    return api.post<BrokenPartResponse>(`/repair-requests/${requestId}/broken-parts/suggest`, data);
  },

  updateBrokenPart(requestId: string, partId: string, data: { name?: string; note?: string }) {
    return api.post<BrokenPartResponse>(`/repair-requests/${requestId}/broken-parts/${partId}/update`, data);
  },

  updateBrokenPartStatus(requestId: string, partId: string, status: string) {
    return api.post<BrokenPartResponse>(`/repair-requests/${requestId}/broken-parts/${partId}/status`, { status });
  },

  deleteBrokenPart(requestId: string, partId: string) {
    return api.post<void>(`/repair-requests/${requestId}/broken-parts/${partId}/delete`);
  },

  getBrokenPartImages(requestId: string, partId: string) {
    return api.get<ImageList>(`/repair-requests/${requestId}/broken-parts/${partId}/images`);
  },

  orderBrokenPart(requestId: string, partId: string, data?: { supplier?: string }) {
    return api.post<BrokenPartResponse>(`/repair-requests/${requestId}/broken-parts/${partId}/order`, data ?? {});
  },

  // Stats
  getCompletionMetrics(dateFrom: string, dateTo: string) {
    return api.get<CompletionMetrics>('/repair-requests/metrics/completion', { params: { dateFrom, dateTo } });
  },
};

export interface CompletionMetrics {
  dateFrom: string;
  dateTo: string;
  totalTerminal: number;
  completedCount: number;
  cancelledCount: number;
  refusedCount: number;
  refundedCount: number;
  avgTotalMinutes: number;
  avgActiveWorkMinutes: number;
  avgAssignmentMinutes: number;
  avgResponseMinutes: number;
  avgTravelMinutes: number;
  avgRepairMinutes: number;
}
