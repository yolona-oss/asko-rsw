import type { IAuthSession, IAuthUser, LoginCredentials, CreateUserDto } from '@asko/shared';
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
};
