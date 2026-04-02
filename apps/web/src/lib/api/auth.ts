import type { LoginCredentials, CreateUserDto } from '@asko/shared/client';
import type { IAuthSession, IAuthUser } from './types';
import { api } from './client';

export const authApi = {
  login(credentials: LoginCredentials) {
    return api.post<IAuthSession>('/auth/login', credentials);
  },

  signup(data: CreateUserDto) {
    return api.post<IAuthSession>('/auth/signup', data);
  },

  logout() {
    return api.post('/auth/logout');
  },

  getSession() {
    return api.get<IAuthUser>('/auth/session');
  },

  refresh() {
    return api.post<{ access_token: string }>('/auth/refresh');
  },

  devSwitch(refreshToken: string) {
    return api.post<IAuthSession>('/auth/dev-switch', { refresh_token: refreshToken });
  },

  checkEmail(email: string) {
    return api.get<{ available: boolean }>('/auth/check-email', {
      params: { email },
      _silent: true,
    } as any);
  },

  confirmEmail(token: string) {
    return api.post<{ message: string }>('/auth/confirm-email', { token });
  },

  resendConfirmation(email: string) {
    return api.post<{ message: string; retryAfter: number }>('/auth/resend-confirmation', { email });
  },

  // MFA
  verifyMfaOtp(data: { mfaToken: string; code: string; trustDevice?: boolean }) {
    return api.post<IAuthSession>('/auth/mfa/verify', data);
  },

  resendMfaOtp(mfaToken: string) {
    return api.post<{ retryAfter: number }>('/auth/mfa/resend', { mfaToken });
  },

  enableMfa() {
    return api.post<{ message: string; retryAfter: number }>('/auth/mfa/enable');
  },

  verifyEnableMfa(code: string) {
    return api.post<{ message: string }>('/auth/mfa/enable/verify', { code });
  },

  initiateDisableMfa() {
    return api.post<{ message: string; retryAfter: number }>('/auth/mfa/disable');
  },

  confirmDisableMfa(code: string) {
    return api.post<{ message: string }>('/auth/mfa/disable/verify', { code });
  },

  getMfaStatus() {
    return api.get<{ enabled: boolean; methods: string[] }>('/auth/mfa/status');
  },

  confirmEmailChange(token: string) {
    return api.post<{ message: string }>('/auth/confirm-email-change', { token });
  },

  forgotPassword(email: string) {
    return api.post<{ message: string; retryAfter: number }>('/auth/forgot-password', { email });
  },

  resetPassword(token: string, newPassword: string) {
    return api.post<{ message: string }>('/auth/reset-password', { token, newPassword });
  },

  // Phone register
  verifyPhoneRegister(data: { pendingToken: string; code: string }) {
    return api.post<IAuthSession>('/auth/phone-register/verify', data);
  },

  resendPhoneRegisterOtp(pendingToken: string) {
    return api.post<{ retryAfter: number }>('/auth/phone-register/resend', { pendingToken });
  },

  // Phone verification (authenticated)
  sendPhoneVerification() {
    return api.post<{ message: string; retryAfter: number }>('/auth/phone/send-verification');
  },

  confirmPhoneVerification(code: string) {
    return api.post<{ message: string }>('/auth/phone/confirm-verification', { code });
  },

  // Phone change (verified phone)
  requestPhoneChange(newPhone: string) {
    return api.post<{ message: string; retryAfter: number }>('/auth/phone/request-change', { newPhone });
  },

  confirmPhoneChange(code: string) {
    return api.post<{ message: string }>('/auth/phone/confirm-change', { code });
  },
};
