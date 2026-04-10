import type {
  CreateRepairRequestDto,
  AssignRepairerDto,
  RefuseRequestDto,
  SetRepairPriceDto,
  AddWorkStepDto,
  UpdateWorkStepDto,
} from '@asko/shared/client';
import type {
  IRepairRequest,
  IRepairPayment,
  PaginatedRepairRequests,
  ProcessInvoiceResult,
  RepairRequestResponse,
  WorkStepList,
  WorkStepResponse,
  CompleteStep,
} from './types';
import { api } from './client';

export const repairRequestApi = {
  // List / Get
  getAll(params?: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string }) {
    return api.get<PaginatedRepairRequests>('/repair-requests', { params });
  },

  getMy(params?: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string }) {
    return api.get<PaginatedRepairRequests>('/repair-requests/my', { params });
  },

  getAssigned(params?: { page?: number; limit?: number; status?: string; search?: string; sortBy?: string; sortOrder?: string }) {
    return api.get<PaginatedRepairRequests>('/repair-requests/assigned', { params });
  },

  getActive() {
    return api.get<IRepairRequest | null>('/repair-requests/active');
  },

  getOne(id: string) {
    return api.get<IRepairRequest>(`/repair-requests/${id}`);
  },

  create(data: CreateRepairRequestDto) {
    return api.post<RepairRequestResponse>('/repair-requests', data);
  },

  // Status changes
  assign(requestId: string, repairerId: string) {
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/assign`, { repairerId } satisfies AssignRepairerDto);
  },

  accept(requestId: string) {
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/accept`);
  },

  start(requestId: string) {
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/start`);
  },

  reassign(requestId: string, repairerId: string) {
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/reassign`, { repairerId } satisfies AssignRepairerDto);
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
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/pause`);
  },

  resume(requestId: string) {
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/resume`);
  },

  refuse(requestId: string, reason: string) {
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/refuse`, { reason } satisfies RefuseRequestDto);
  },

  setPrice(requestId: string, data: SetRepairPriceDto) {
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/set-price`, data);
  },

  complete(requestId: string, description: string, files: File[]) {
    const form = new FormData();
    form.append('description', description);
    files.forEach((file) => form.append('files', file));
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/complete`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Payments
  pay(requestId: string) {
    return api.post<ProcessInvoiceResult>(`/repair-requests/${requestId}/pay`);
  },

  dummyPay(requestId: string) {
    return api.post<ProcessInvoiceResult>(`/repair-requests/${requestId}/dummy-pay`);
  },

  getPayments(requestId: string) {
    return api.get<IRepairPayment[]>(`/repair-requests/${requestId}/payments`);
  },

  // Work steps
  getSteps(requestId: string) {
    return api.get<WorkStepList>(`/repair-requests/${requestId}/steps`);
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
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/steps/lock`);
  },

  approveDiagnostics(requestId: string) {
    return api.post<void>(`/repair-requests/${requestId}/steps/diagnostics/approve`);
  },

  declineDiagnostics(requestId: string, reason?: string) {
    return api.post<WorkStepList>(`/repair-requests/${requestId}/steps/diagnostics/decline`, { reason });
  },

  // Broken parts
  getBrokenParts(requestId: string) {
    return api.get<{ parts: any[] }>(`/repair-requests/${requestId}/broken-parts`);
  },

  addBrokenPart(requestId: string, data: { devicePartId?: string; name?: string; note?: string }) {
    return api.post<{ part: any }>(`/repair-requests/${requestId}/broken-parts`, data);
  },

  updateBrokenPart(requestId: string, partId: string, data: { name?: string; note?: string }) {
    return api.post<{ part: any }>(`/repair-requests/${requestId}/broken-parts/${partId}/update`, data);
  },

  updateBrokenPartStatus(requestId: string, partId: string, status: string) {
    return api.post<{ part: any }>(`/repair-requests/${requestId}/broken-parts/${partId}/status`, { status });
  },

  deleteBrokenPart(requestId: string, partId: string) {
    return api.post<void>(`/repair-requests/${requestId}/broken-parts/${partId}/delete`);
  },

  getBrokenPartImages(requestId: string, partId: string) {
    return api.get<{ images: any[] }>(`/repair-requests/${requestId}/broken-parts/${partId}/images`);
  },
};
