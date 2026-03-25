import type { CreateAddressDto } from '@asko/shared/client';
import type { IAddressBook } from './types';
import { api } from './client';

export const addressApi = {
  create(data: CreateAddressDto) {
    return api.post<IAddressBook>('/address', data);
  },
};
