import type { IDevice, IImageAttachment, PaginatedDevices } from './types';
import { api } from './client';

export const DEVICE_PLACEHOLDER_IMAGE = '/images/placeholder.webp';

export async function fetchDevices(page: number, limit: number): Promise<PaginatedDevices> {
  try {
    const { data } = await api.get<PaginatedDevices>('/devices', {
      params: { offset: page, limit },
    });
    return data;
  } catch {
    return { data: [] as IDevice[], overallCount: 0, offset: 0, limit };
  }
}

export async function fetchDevice(id: string): Promise<IDevice | null> {
  try {
    const { data } = await api.get<IDevice>(`/devices/${id}`);
    return data;
  } catch {
    return null;
  }
}

export async function fetchDeviceBySlug(slug: string): Promise<IDevice | null> {
  try {
    const { data } = await api.get<IDevice>(`/devices/slug/${slug}`);
    return data;
  } catch {
    return null;
  }
}

export async function fetchDeviceImages(id: string): Promise<IImageAttachment[]> {
  try {
    const { data } = await api.get<{ images: IImageAttachment[] }>(`/devices/${id}/images`);
    return data.images ?? [];
  } catch {
    return [];
  }
}

export async function fetchDeviceImagesBySlug(slug: string): Promise<IImageAttachment[]> {
  try {
    const { data } = await api.get<{ images: IImageAttachment[] }>(`/devices/slug/${slug}/images`);
    return data.images ?? [];
  } catch {
    return [];
  }
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
