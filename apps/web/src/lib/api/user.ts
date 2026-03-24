import type {
  IRepairRequest,
  IUserDevice,
  ICertificate,
  IWorkStep,
  IDevice,
  IAddressBook,
  IRepairPayment,
  IReview,
  ListResponseDto,
  CreateRepairRequestDto,
  AddCertificateDto,
  CreateAddressDto,
  RegisterUserDeviceDto,
  CreateReviewDto,
  ProcessInvoiceResult,
} from '@asko/shared/client';
import { api } from './client';
import { fileUploadApi } from './file-upload';

export const userApi = {
  getMyRequests(params?: { offset?: number; limit?: number }) {
    return api.get<ListResponseDto<IRepairRequest>>('/repair-requests/my', { params });
  },

  getRepairRequest(id: string) {
    return api.get<IRepairRequest>(`/repair-requests/${id}`);
  },

  createRepairRequest(data: CreateRepairRequestDto) {
    return api.post<IRepairRequest>('/repair-requests', data);
  },

  getMyDevices() {
    return api.get<IUserDevice[]>('/user-devices');
  },

  getMyCertificates() {
    return api.get<ICertificate[]>('/certificates/my');
  },

  getCertificate(id: string) {
    return api.get<ICertificate>(`/certificates/${id}`);
  },

  addCertificate(data: AddCertificateDto) {
    return api.post<ICertificate>('/certificates/add', data);
  },

  uploadImage: fileUploadApi.uploadImage,
  attachImage: fileUploadApi.attachImage,

  getBrokenParts(requestId: string) {
    return api.get<{ parts: any[] }>(`/repair-requests/${requestId}/broken-parts`);
  },

  getDeviceParts(deviceId: string) {
    return api.get<{ parts: any[] }>(`/devices/${deviceId}/parts`);
  },

  getWorkSteps(requestId: string) {
    return api.get<IWorkStep[]>(`/repair-requests/${requestId}/steps`);
  },

  getDeviceCatalog(params?: { offset?: number; limit?: number; search?: string }) {
    return api.get<ListResponseDto<IDevice>>('/devices', { params });
  },

  createAddress(data: CreateAddressDto) {
    return api.post<IAddressBook>('/address', data);
  },

  registerDevice(data: RegisterUserDeviceDto) {
    return api.post<IUserDevice>('/user-devices', data);
  },

  payRepairRequest(requestId: string, _data?: { amount: number; currency?: string }) {
    return api.post<ProcessInvoiceResult>(`/repair-requests/${requestId}/pay`);
  },

  dummyPay(requestId: string) {
    return api.post<ProcessInvoiceResult>(`/repair-requests/${requestId}/dummy-pay`);
  },

  getRepairPayments(requestId: string) {
    return api.get<IRepairPayment[]>(`/repair-requests/${requestId}/payments`);
  },

  payCertificate(certId: string, _data?: { amount: number; currency?: string; provider?: string }) {
    return api.post<ProcessInvoiceResult>(`/certificates/${certId}/pay`);
  },

  dummyPayCertificate(certId: string) {
    return api.post<ProcessInvoiceResult>(`/certificates/${certId}/dummy-pay`);
  },

  createReview(data: CreateReviewDto) {
    return api.post<IReview>('/reviews', data);
  },

  uploadReviewImage: fileUploadApi.uploadReviewImage,

  getMyReviews() {
    return api.get<IReview[]>('/reviews/my');
  },
};
