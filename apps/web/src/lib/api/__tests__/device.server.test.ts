import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const serverGetMock = vi.fn();
vi.mock('../server-fetch', () => ({ serverGet: (...args: any[]) => serverGetMock(...args) }));
vi.mock('@/lib/placeholders', () => ({
  getPlaceholderSrc: (_cat: string, id: string) => `/placeholder/${id}`,
}));
vi.mock('@/lib/image-url', () => ({
  getImageUrl: (img: any) => img?.id ? `/files/image/${img.id}` : null,
}));

const { fetchDevices, fetchFeaturedDevices, fetchDeviceImages, fetchFirstDeviceImage } =
  await import('../device.server');

beforeEach(() => serverGetMock.mockReset());

// ── fetchDevices ──

describe('fetchDevices', () => {
  it('returns paginated data on success', async () => {
    const payload = { data: [{ id: '1', name: 'D1' }], overallCount: 1, page: 1, limit: 12 };
    serverGetMock.mockResolvedValue(payload);

    const result = await fetchDevices(1, 12);
    expect(result).toEqual(payload);
    expect(serverGetMock).toHaveBeenCalledWith('/devices?page=1&limit=12');
  });

  it('returns empty data when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);

    const result = await fetchDevices(1, 12);
    expect(result.data).toEqual([]);
    expect(result.overallCount).toBe(0);
  });

  it('returns empty data when response has no data field', async () => {
    serverGetMock.mockResolvedValue({ overallCount: 0, page: 1, limit: 12 });

    const result = await fetchDevices(1, 12);
    expect(result.data).toEqual([]);
    expect(result.overallCount).toBe(0);
  });

  it('returns empty data when response is empty object', async () => {
    serverGetMock.mockResolvedValue({});

    const result = await fetchDevices(1, 12);
    expect(result.data).toEqual([]);
    expect(result.overallCount).toBe(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(12);
  });

  it('returns empty data when data field is undefined', async () => {
    serverGetMock.mockResolvedValue({ data: undefined, overallCount: 5 });

    const result = await fetchDevices(1, 12);
    expect(result.data).toEqual([]);
    expect(result.overallCount).toBe(5);
  });
});

// ── fetchFeaturedDevices ──

describe('fetchFeaturedDevices', () => {
  it('returns devices array on success', async () => {
    serverGetMock.mockResolvedValue({ data: [{ id: '1' }], overallCount: 1 });

    const result = await fetchFeaturedDevices();
    expect(result).toEqual([{ id: '1' }]);
  });

  it('returns empty array when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchFeaturedDevices()).toEqual([]);
  });

  it('returns empty array when data field is missing', async () => {
    serverGetMock.mockResolvedValue({ overallCount: 0 });
    expect(await fetchFeaturedDevices()).toEqual([]);
  });
});

// ── fetchDeviceImages ──

describe('fetchDeviceImages', () => {
  it('returns images on success', async () => {
    const images = [{ id: 'img1', order: 0 }];
    serverGetMock.mockResolvedValue({ images });

    expect(await fetchDeviceImages('d1')).toEqual(images);
  });

  it('returns empty array when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchDeviceImages('d1')).toEqual([]);
  });

  it('returns empty array when images field is missing', async () => {
    serverGetMock.mockResolvedValue({});
    expect(await fetchDeviceImages('d1')).toEqual([]);
  });
});

// ── fetchFirstDeviceImage ──

describe('fetchFirstDeviceImage', () => {
  it('returns image URL when images exist', async () => {
    serverGetMock.mockResolvedValue({ images: [{ id: 'img1', order: 0 }] });

    const url = await fetchFirstDeviceImage('d1');
    expect(url).toBe('/files/image/img1');
  });

  it('returns placeholder when no images', async () => {
    serverGetMock.mockResolvedValue(null);

    const url = await fetchFirstDeviceImage('d1');
    expect(url).toBe('/placeholder/d1');
  });

  it('returns placeholder when images field is missing', async () => {
    serverGetMock.mockResolvedValue({});

    const url = await fetchFirstDeviceImage('d1');
    expect(url).toBe('/placeholder/d1');
  });
});
