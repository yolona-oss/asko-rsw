import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PaginatedDevices, IImageAttachment } from '../types';
import { makeDevice, makePaginatedDevices, makeImageAttachment } from './fixtures';

vi.mock('server-only', () => ({}));

const serverGetMock = vi.fn();
vi.mock('../server-fetch', () => ({ serverGet: (...args: any[]) => serverGetMock(...args) }));
vi.mock('@/lib/placeholders', () => ({
  getPlaceholderSrc: (_cat: string, id: string) => `/placeholder/${id}`,
}));
vi.mock('@/lib/image-url', () => ({
  getImageUrl: (img: any) => img?.id ? `/files/image/${img.id}` : null,
}));

const {
  fetchDevices, fetchFeaturedDevices,
  fetchDevice, fetchDeviceBySlug,
  fetchDeviceImages, fetchDeviceImagesBySlug,
  fetchFirstDeviceImage, fetchDeviceImageUrls, fetchDeviceImageUrlsBySlug,
} = await import('../device.server');

beforeEach(() => serverGetMock.mockReset());

// ── fetchDevices ──

describe('fetchDevices', () => {
  it('returns paginated data on success', async () => {
    const payload = makePaginatedDevices();
    serverGetMock.mockResolvedValue(payload);

    const result = await fetchDevices(1, 12);
    expect(result).toEqual(payload);
    expect(serverGetMock).toHaveBeenCalledWith('/devices?page=1&limit=12');
  });

  it('passes page and limit to query string', async () => {
    serverGetMock.mockResolvedValue(makePaginatedDevices({ page: 3, limit: 24 }));

    await fetchDevices(3, 24);
    expect(serverGetMock).toHaveBeenCalledWith('/devices?page=3&limit=24');
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

    const result = await fetchDevices(2, 20);
    expect(result.data).toEqual([]);
    expect(result.overallCount).toBe(0);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(20);
  });

  it('returns empty data when data field is undefined', async () => {
    serverGetMock.mockResolvedValue({ data: undefined, overallCount: 5 } as Partial<PaginatedDevices>);

    const result = await fetchDevices(1, 12);
    expect(result.data).toEqual([]);
    expect(result.overallCount).toBe(5);
  });
});

// ── fetchFeaturedDevices ──

describe('fetchFeaturedDevices', () => {
  it('returns devices array on success', async () => {
    const device = makeDevice();
    serverGetMock.mockResolvedValue(makePaginatedDevices({ data: [device] }));

    expect(await fetchFeaturedDevices()).toEqual([device]);
  });

  it('passes type filter when provided', async () => {
    serverGetMock.mockResolvedValue(makePaginatedDevices());

    await fetchFeaturedDevices('oven');
    const url: string = serverGetMock.mock.calls[0][0];
    expect(url).toContain('isFeatured=true');
    expect(url).toContain('type=oven');
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

// ── fetchDevice ──

describe('fetchDevice', () => {
  it('returns device on success', async () => {
    const device = makeDevice({ id: 'abc' });
    serverGetMock.mockResolvedValue(device);

    expect(await fetchDevice('abc')).toEqual(device);
    expect(serverGetMock).toHaveBeenCalledWith('/devices/abc');
  });

  it('returns null when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchDevice('missing')).toBeNull();
  });
});

// ── fetchDeviceBySlug ──

describe('fetchDeviceBySlug', () => {
  it('returns device on success', async () => {
    const device = makeDevice({ slug: 'asko-w6098x' });
    serverGetMock.mockResolvedValue(device);

    expect(await fetchDeviceBySlug('asko-w6098x')).toEqual(device);
    expect(serverGetMock).toHaveBeenCalledWith('/devices/slug/asko-w6098x');
  });

  it('returns null when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchDeviceBySlug('no-such-slug')).toBeNull();
  });
});

// ── fetchDeviceImages ──

describe('fetchDeviceImages', () => {
  it('returns images on success', async () => {
    const images: IImageAttachment[] = [
      makeImageAttachment({ id: 'img-1', order: 0 }),
      makeImageAttachment({ id: 'img-2', order: 1 }),
    ];
    serverGetMock.mockResolvedValue({ images });

    expect(await fetchDeviceImages('dev-1')).toEqual(images);
    expect(serverGetMock).toHaveBeenCalledWith('/devices/dev-1/images');
  });

  it('returns empty array when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchDeviceImages('dev-1')).toEqual([]);
  });

  it('returns empty array when images field is missing', async () => {
    serverGetMock.mockResolvedValue({});
    expect(await fetchDeviceImages('dev-1')).toEqual([]);
  });

  it('returns empty array when images is undefined', async () => {
    serverGetMock.mockResolvedValue({ images: undefined });
    expect(await fetchDeviceImages('dev-1')).toEqual([]);
  });
});

// ── fetchDeviceImagesBySlug ──

describe('fetchDeviceImagesBySlug', () => {
  it('returns images on success', async () => {
    const images: IImageAttachment[] = [makeImageAttachment()];
    serverGetMock.mockResolvedValue({ images });

    expect(await fetchDeviceImagesBySlug('asko-w6098x')).toEqual(images);
    expect(serverGetMock).toHaveBeenCalledWith('/devices/slug/asko-w6098x/images');
  });

  it('returns empty array when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchDeviceImagesBySlug('slug')).toEqual([]);
  });

  it('returns empty array when images field is missing', async () => {
    serverGetMock.mockResolvedValue({});
    expect(await fetchDeviceImagesBySlug('slug')).toEqual([]);
  });
});

// ── fetchFirstDeviceImage ──

describe('fetchFirstDeviceImage', () => {
  it('returns image URL when images exist', async () => {
    serverGetMock.mockResolvedValue({
      images: [makeImageAttachment({ id: 'img-1', order: 0 })],
    });

    expect(await fetchFirstDeviceImage('dev-1')).toBe('/files/image/img-1');
  });

  it('returns placeholder when no images', async () => {
    serverGetMock.mockResolvedValue({ images: [] });
    expect(await fetchFirstDeviceImage('dev-1')).toBe('/placeholder/dev-1');
  });

  it('returns placeholder when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchFirstDeviceImage('dev-1')).toBe('/placeholder/dev-1');
  });

  it('returns placeholder when images field is missing', async () => {
    serverGetMock.mockResolvedValue({});
    expect(await fetchFirstDeviceImage('dev-1')).toBe('/placeholder/dev-1');
  });

  it('returns placeholder when getImageUrl returns null', async () => {
    // image with no id → getImageUrl mock returns null
    serverGetMock.mockResolvedValue({
      images: [{ ...makeImageAttachment(), id: '' }],
    });
    expect(await fetchFirstDeviceImage('dev-1')).toBe('/placeholder/dev-1');
  });
});

// ── fetchDeviceImageUrls ──

describe('fetchDeviceImageUrls', () => {
  it('returns URL array when images exist', async () => {
    serverGetMock.mockResolvedValue({
      images: [
        makeImageAttachment({ id: 'a', order: 0 }),
        makeImageAttachment({ id: 'b', order: 1 }),
      ],
    });

    expect(await fetchDeviceImageUrls('dev-1')).toEqual(['/files/image/a', '/files/image/b']);
  });

  it('returns placeholder array when no images', async () => {
    serverGetMock.mockResolvedValue({ images: [] });
    expect(await fetchDeviceImageUrls('dev-1')).toEqual(['/placeholder/dev-1']);
  });

  it('returns placeholder array when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchDeviceImageUrls('dev-1')).toEqual(['/placeholder/dev-1']);
  });

  it('returns placeholder array when images field is missing', async () => {
    serverGetMock.mockResolvedValue({});
    expect(await fetchDeviceImageUrls('dev-1')).toEqual(['/placeholder/dev-1']);
  });

  it('filters out images where getImageUrl returns null', async () => {
    serverGetMock.mockResolvedValue({
      images: [
        makeImageAttachment({ id: 'a', order: 0 }),
        { ...makeImageAttachment(), id: '' }, // getImageUrl → null
      ],
    });

    expect(await fetchDeviceImageUrls('dev-1')).toEqual(['/files/image/a']);
  });
});

// ── fetchDeviceImageUrlsBySlug ──

describe('fetchDeviceImageUrlsBySlug', () => {
  it('returns URL array when images exist', async () => {
    serverGetMock.mockResolvedValue({
      images: [makeImageAttachment({ id: 'c', order: 0 })],
    });

    expect(await fetchDeviceImageUrlsBySlug('asko-w6098x')).toEqual(['/files/image/c']);
  });

  it('returns placeholder array when no images', async () => {
    serverGetMock.mockResolvedValue({ images: [] });
    expect(await fetchDeviceImageUrlsBySlug('slug')).toEqual(['/placeholder/slug']);
  });

  it('returns placeholder array when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchDeviceImageUrlsBySlug('slug')).toEqual(['/placeholder/slug']);
  });

  it('returns placeholder array when images field is missing', async () => {
    serverGetMock.mockResolvedValue({});
    expect(await fetchDeviceImageUrlsBySlug('slug')).toEqual(['/placeholder/slug']);
  });
});
