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

  confirmEmail(token: string) {
    return api.post<{ message: string }>('/auth/confirm-email', { token });
  },

  resendConfirmation(email: string) {
    return api.post<{ message: string; retryAfter: number }>('/auth/resend-confirmation', { email });
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
};
