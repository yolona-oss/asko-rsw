import type { CreateInvitationLinkDto } from '@asko/shared/client';
import type { IInvitationLink } from './types';
import { api } from './client';

export const invitationApi = {
  getAll() {
    return api.get<IInvitationLink[]>('/invite/');
  },

  create(data: CreateInvitationLinkDto) {
    return api.post<{ invite: IInvitationLink; link: string }>('/invite', data, { withCredentials: true });
  },

  delete(id: string) {
    return api.delete<void>(`/invite/${id}`);
  },
};
