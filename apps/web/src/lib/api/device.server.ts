import type { IDevice, IImageAttachment, PaginatedDevices } from './types';
import { serverGet } from './server-fetch';
import { getPlaceholderSrc } from '@/lib/placeholders';
import { getImageUrl } from '@/lib/image-url';

export async function fetchDevices(page: number, limit: number): Promise<PaginatedDevices> {
  const res = await serverGet<PaginatedDevices>(`/devices?page=${page}&limit=${limit}`);
  return {
    data: res?.data ?? [],
    overallCount: res?.overallCount ?? 0,
    page: res?.page ?? page,
    limit: res?.limit ?? limit,
  };
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
  return getImageUrl(images[0], 'medium') ?? getPlaceholderSrc('device', deviceId);
}

export async function fetchDeviceImageUrls(id: string): Promise<string[]> {
  const images = await fetchDeviceImages(id);
  const urls = images.map((img) => getImageUrl(img, 'large')).filter(Boolean) as string[];
  return urls.length > 0 ? urls : [getPlaceholderSrc('device', id)];
}

export async function fetchDeviceImageUrlsBySlug(slug: string): Promise<string[]> {
  const images = await fetchDeviceImagesBySlug(slug);
  const urls = images.map((img) => getImageUrl(img, 'large')).filter(Boolean) as string[];
  return urls.length > 0 ? urls : [getPlaceholderSrc('device', slug)];
}
