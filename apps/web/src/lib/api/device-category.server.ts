import type { DeviceCategoryRecord, DeviceCategoryList } from './device-category';
import { serverGet } from './server-fetch';

export async function fetchDeviceCategories(): Promise<DeviceCategoryRecord[]> {
  const data = await serverGet<DeviceCategoryList>('/device-categories');
  return data?.categories ?? [];
}
