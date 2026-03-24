import type {
  PaginatedResponseDto,
  ListResponseDto,
  IReview,
  IRepairer,
  IRepairRequest,
  IWorkStep,
  IDevice,
  UpdateLocationDto,
  RefuseRequestDto,
  SetRepairPriceDto,
  AddWorkStepDto,
  UpdateWorkStepDto,
} from '@asko/shared/client';
import { api } from './client';

export const repairerApi = {
  updateLocation(data: UpdateLocationDto) {
    return api.post<void>('/repairers/location', data);
  },

  getProfile() {
    return api.get<IRepairer>('/repairers/me');
  },

  getActiveRequest() {
    return api.get<IRepairRequest | null>('/repair-requests/active');
  },

  getAssignedRequests(params?: { offset?: number; limit?: number; status?: string }) {
    return api.get<ListResponseDto<IRepairRequest>>('/repair-requests/assigned', { params });
  },

  acceptRequest(requestId: string) {
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/accept`);
  },

  startWork(requestId: string) {
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/start`);
  },

  refuseRequest(requestId: string, reason: string) {
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/refuse`, { reason } satisfies RefuseRequestDto);
  },

  getWorkSteps(requestId: string) {
    return api.get<IWorkStep[]>(`/repair-requests/${requestId}/steps`);
  },

  addWorkStep(requestId: string, data: AddWorkStepDto) {
    return api.post<IWorkStep>(`/repair-requests/${requestId}/steps`, data);
  },

  updateWorkStep(requestId: string, stepId: string, data: Partial<UpdateWorkStepDto>) {
    return api.post<IWorkStep>(`/repair-requests/${requestId}/steps/${stepId}/update`, data);
  },

  completeWorkStep(requestId: string, stepId: string) {
    return api.post<{ step: IWorkStep; requestCompleted: boolean }>(`/repair-requests/${requestId}/steps/${stepId}/complete`);
  },

  deleteWorkStep(requestId: string, stepId: string) {
    return api.post<void>(`/repair-requests/${requestId}/steps/${stepId}/delete`);
  },

  lockWorkSteps(requestId: string) {
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/steps/lock`);
  },

  setRepairPrice(requestId: string, data: SetRepairPriceDto) {
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/set-price`, data);
  },

  completeWork(requestId: string, description: string, files: File[]) {
    const form = new FormData();
    form.append('description', description);
    files.forEach((file) => form.append('files', file));
    return api.post<IRepairRequest>(`/repair-requests/${requestId}/complete`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getRepairerRating(repairerId: string) {
    return api.get<{ average: number; count: number }>(`/reviews/rating/repairer/${repairerId}`);
  },

  getRepairerReviews(repairerId: string) {
    return api.get<PaginatedResponseDto<IReview>>(`/reviews/repairer/${repairerId}`);
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

  uploadBrokenPartImage(requestId: string, partId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<any>(`/repair-requests/${requestId}/broken-parts/${partId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getBrokenPartImages(requestId: string, partId: string) {
    return api.get<{ images: any[] }>(`/repair-requests/${requestId}/broken-parts/${partId}/images`);
  },

  getDevices() {
    return api.get<ListResponseDto<IDevice>>('/devices');
  },

  getDevice(deviceId: string) {
    return api.get<IDevice>(`/devices/${deviceId}`);
  },

  addNote(deviceId: string, content: string, isPublic: boolean) {
    return api.post<void>(`/devices/${deviceId}/notes`, { content, isPublic });
  },
};
