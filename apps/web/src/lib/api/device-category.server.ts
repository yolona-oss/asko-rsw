import type { DeviceCategoryRecord, DeviceCategoryListResponse } from './device-category';
import { serverGet } from './server-fetch';

export async function fetchDeviceCategories(): Promise<DeviceCategoryRecord[]> {
  const data = await serverGet<DeviceCategoryListResponse>('/device-categories');
  return data?.categories ?? [];
}
