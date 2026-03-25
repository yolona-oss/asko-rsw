import type { RegisterUserDeviceDto } from '@asko/shared/client';
import type { IUserDevice } from './types';
import { api } from './client';

export const userDeviceApi = {
  async getMy() {
    const { data } = await api.get<{ userDevices: IUserDevice[] }>('/user-devices');
    return { data: (data?.userDevices ?? []) as IUserDevice[] };
  },

  register(data: RegisterUserDeviceDto) {
    return api.post<IUserDevice>('/user-devices', data);
  },
};
