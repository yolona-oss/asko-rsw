import type { IDevice, IImageAttachment, PaginatedDevices } from './types';
import { serverGet } from './server-fetch';

export const DEVICE_PLACEHOLDER_IMAGE = '/images/placeholder.webp';

export async function fetchDevices(page: number, limit: number): Promise<PaginatedDevices> {
  const data = await serverGet<PaginatedDevices>(`/devices?offset=${page}&limit=${limit}`);
  return data ?? { data: [] as IDevice[], overallCount: 0, offset: 0, limit };
}

export async function fetchDevice(id: string): Promise<IDevice | null> {
  return serverGet<IDevice>(`/devices/${id}`);
}

export async function fetchDeviceBySlug(slug: string): Promise<IDevice | null> {
  return serverGet<IDevice>(`/devices/slug/${slug}`);
}

export async function fetchDeviceImages(id: string): Promise<IImageAttachment[]> {
  const data = await serverGet<{ images: IImageAttachment[] }>(`/devices/${id}/images`);
  return data?.images ?? [];
}

export async function fetchDeviceImagesBySlug(slug: string): Promise<IImageAttachment[]> {
  const data = await serverGet<{ images: IImageAttachment[] }>(`/devices/slug/${slug}/images`);
  return data?.images ?? [];
}

export async function fetchFirstDeviceImage(deviceId: string): Promise<string> {
  const images = await fetchDeviceImages(deviceId);
  if (!images.length) return DEVICE_PLACEHOLDER_IMAGE;
  return images[0].imageJson.medium?.secure_url ?? images[0].imageJson.original.secure_url;
}

export async function fetchDeviceImageUrls(id: string): Promise<string[]> {
  const images = await fetchDeviceImages(id);
  const urls = images
    .map((img) => img.imageJson?.large?.secure_url ?? img.imageJson?.original?.secure_url)
    .filter(Boolean) as string[];
  return urls.length > 0 ? urls : [DEVICE_PLACEHOLDER_IMAGE];
}

export async function fetchDeviceImageUrlsBySlug(slug: string): Promise<string[]> {
  const images = await fetchDeviceImagesBySlug(slug);
  const urls = images
    .map((img) => img.imageJson?.large?.secure_url ?? img.imageJson?.original?.secure_url)
    .filter(Boolean) as string[];
  return urls.length > 0 ? urls : [DEVICE_PLACEHOLDER_IMAGE];
}
