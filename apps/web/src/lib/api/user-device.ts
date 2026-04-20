import type { RegisterUserDeviceDto, UpdateUserDeviceDto } from '@asko/shared/client';
import type { UserDeviceRecord } from './types';
import { api } from './client';

export const userDeviceApi = {
  async getMy() {
    const { data } = await api.get<{ userDevices: UserDeviceRecord[] }>('/user-devices/');
    return { data: (data?.userDevices ?? []) as UserDeviceRecord[] };
  },

  register(data: RegisterUserDeviceDto) {
    return api.post<UserDeviceRecord>('/user-devices/', data);
  },

  update(id: string, data: UpdateUserDeviceDto) {
    return api.patch<{ userDevice: UserDeviceRecord }>(`/user-devices/${id}`, data);
  },
};
