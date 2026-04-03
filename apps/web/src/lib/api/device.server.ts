import type { IDevice, IImageAttachment, PaginatedDevices } from './types';
import { serverGet } from './server-fetch';
import { getPlaceholderSrc } from '@/lib/placeholders';

export async function fetchDevices(page: number, limit: number): Promise<PaginatedDevices> {
  const data = await serverGet<PaginatedDevices>(`/devices?page=${page}&limit=${limit}`);
  return data ?? { data: [] as IDevice[], overallCount: 0, page: 1, limit };
}

export async function fetchFeaturedDevices(type?: string): Promise<IDevice[]> {
  const params = new URLSearchParams({ isFeatured: 'true', limit: '20', page: '1' });
  if (type) params.set('type', type);
  const data = await serverGet<PaginatedDevices>(`/devices?${params}`);
  return data?.data ?? [];
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
  if (!images.length) return getPlaceholderSrc('device', deviceId);
  return images[0].imageJson.medium?.secure_url ?? images[0].imageJson.original.secure_url;
}

export async function fetchDeviceImageUrls(id: string): Promise<string[]> {
  const images = await fetchDeviceImages(id);
  const urls = images
    .map((img) => img.imageJson?.large?.secure_url ?? img.imageJson?.original?.secure_url)
    .filter(Boolean) as string[];
  return urls.length > 0 ? urls : [getPlaceholderSrc('device', id)];
}

export async function fetchDeviceImageUrlsBySlug(slug: string): Promise<string[]> {
  const images = await fetchDeviceImagesBySlug(slug);
  const urls = images
    .map((img) => img.imageJson?.large?.secure_url ?? img.imageJson?.original?.secure_url)
    .filter(Boolean) as string[];
  return urls.length > 0 ? urls : [getPlaceholderSrc('device', slug)];
}
