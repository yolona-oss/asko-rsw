import type { CreateInvitationLinkDto } from '@asko/shared/client';
import type { InviteLinkResponse } from './types';
import { api } from './client';

export const invitationApi = {
  getAll() {
    return api.get<InviteLinkResponse[]>('/invite/');
  },

  create(data: CreateInvitationLinkDto) {
    return api.post<{ invite: InviteLinkResponse; link: string }>('/invite/', data);
  },

  delete(id: string) {
    return api.delete<void>(`/invite/${id}`);
  },
};
