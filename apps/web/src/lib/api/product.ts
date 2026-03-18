const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface DeviceListItem {
  id: string;
  slug: string;
  name: string;
  type: string;
  model: string;
  brand: string;
}

export interface DeviceImage {
  image: {
    original: { secure_url: string };
    thumbnail?: { secure_url: string };
    medium?: { secure_url: string };
    large?: { secure_url: string };
  };
  order: number;
}

export async function fetchDevices(page: number, limit: number) {
  const res = await fetch(
    `${API_URL}/devices?offset=${page}&limit=${limit}`,
    { next: { revalidate: 60 } },
  );
  if (!res.ok) return { data: [] as DeviceListItem[], total: 0 };
  return res.json() as Promise<{ data: DeviceListItem[]; total: number }>;
}

export async function fetchDevice(id: string) {
  const res = await fetch(`${API_URL}/devices/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchDeviceBySlug(slug: string) {
  const res = await fetch(`${API_URL}/devices/slug/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchDeviceImages(id: string): Promise<DeviceImage[]> {
  const res = await fetch(`${API_URL}/devices/${id}/images`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchDeviceImagesBySlug(slug: string): Promise<DeviceImage[]> {
  const res = await fetch(`${API_URL}/devices/slug/${slug}/images`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchFirstDeviceImage(deviceId: string): Promise<string | null> {
  const images = await fetchDeviceImages(deviceId);
  if (!images.length) return null;
  return images[0].image.medium?.secure_url ?? images[0].image.original.secure_url;
}

export async function fetchDeviceImageUrls(id: string): Promise<string[]> {
  const images = await fetchDeviceImages(id);
  return images
    .map((img) => img.image?.large?.secure_url ?? img.image?.original?.secure_url)
    .filter(Boolean) as string[];
}

export async function fetchDeviceImageUrlsBySlug(slug: string): Promise<string[]> {
  const images = await fetchDeviceImagesBySlug(slug);
  return images
    .map((img) => img.image?.large?.secure_url ?? img.image?.original?.secure_url)
    .filter(Boolean) as string[];
}
