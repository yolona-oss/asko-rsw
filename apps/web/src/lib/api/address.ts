import type { CreateAddressDto } from '@asko/shared/client';
import type { IAddressBook } from '@asko/shared/client';
import { api } from './client';

/** Matches UpdateAddressDto from @asko/shared — all fields optional */
interface UpdateAddressPayload {
  city?: string;
  district?: string;
  street?: string;
  house?: string;
  building?: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  intercom?: string;
  comment?: string;
  latitude?: number;
  longitude?: number;
}

export const addressApi = {
  list() {
    return api.get<IAddressBook[]>('/address');
  },

  listForUser(userId: string) {
    return api.get<IAddressBook[]>(`/address/user/${userId}`);
  },

  get(id: string) {
    return api.get<IAddressBook>(`/address/${id}`);
  },

  create(data: CreateAddressDto) {
    return api.post<IAddressBook>('/address', data);
  },

  update(id: string, data: UpdateAddressPayload) {
    return api.put<IAddressBook>(`/address/${id}`, data);
  },

  remove(id: string) {
    return api.delete<void>(`/address/${id}`);
  },

  setPrimary(id: string) {
    return api.patch<IAddressBook>(`/address/${id}/primary`);
  },
};
