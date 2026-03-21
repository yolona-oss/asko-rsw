import type { IDevice, IImageAttachment, ListResponseDto } from '@asko/shared/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const DEVICE_PLACEHOLDER_IMAGE = '/images/placeholder.webp';

export async function fetchDevices(page: number, limit: number) {
  const res = await fetch(
    `${API_URL}/devices?offset=${page}&limit=${limit}`,
    { next: { revalidate: 60 } },
  );
  if (!res.ok) return { data: [] as IDevice[], total: 0 };
  return res.json() as Promise<ListResponseDto<IDevice>>;
}

export async function fetchDevice(id: string): Promise<IDevice | null> {
  const res = await fetch(`${API_URL}/devices/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchDeviceBySlug(slug: string): Promise<IDevice | null> {
  const res = await fetch(`${API_URL}/devices/slug/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchDeviceImages(id: string): Promise<IImageAttachment[]> {
  const res = await fetch(`${API_URL}/devices/${id}/images`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchDeviceImagesBySlug(slug: string): Promise<IImageAttachment[]> {
  const res = await fetch(`${API_URL}/devices/slug/${slug}/images`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchFirstDeviceImage(deviceId: string): Promise<string> {
  const images = await fetchDeviceImages(deviceId);
  if (!images.length) return DEVICE_PLACEHOLDER_IMAGE;
  return images[0].image.medium?.secure_url ?? images[0].image.original.secure_url;
}

export async function fetchDeviceImageUrls(id: string): Promise<string[]> {
  const images = await fetchDeviceImages(id);
  const urls = images
    .map((img) => img.image?.large?.secure_url ?? img.image?.original?.secure_url)
    .filter(Boolean) as string[];
  return urls.length > 0 ? urls : [DEVICE_PLACEHOLDER_IMAGE];
}

export async function fetchDeviceImageUrlsBySlug(slug: string): Promise<string[]> {
  const images = await fetchDeviceImagesBySlug(slug);
  const urls = images
    .map((img) => img.image?.large?.secure_url ?? img.image?.original?.secure_url)
    .filter(Boolean) as string[];
  return urls.length > 0 ? urls : [DEVICE_PLACEHOLDER_IMAGE];
}
