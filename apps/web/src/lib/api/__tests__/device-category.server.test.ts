import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const serverGetMock = vi.fn();
vi.mock('../server-fetch', () => ({ serverGet: (...args: any[]) => serverGetMock(...args) }));

const { fetchDeviceCategories } = await import('../device-category.server');

beforeEach(() => serverGetMock.mockReset());

describe('fetchDeviceCategories', () => {
  it('returns categories on success', async () => {
    const categories = [{ id: '1', name: 'washer', label: 'Стиральные машины' }];
    serverGetMock.mockResolvedValue({ categories });

    expect(await fetchDeviceCategories()).toEqual(categories);
  });

  it('returns empty array when API returns null', async () => {
    serverGetMock.mockResolvedValue(null);
    expect(await fetchDeviceCategories()).toEqual([]);
  });

  it('returns empty array when categories field is missing', async () => {
    serverGetMock.mockResolvedValue({});
    expect(await fetchDeviceCategories()).toEqual([]);
  });

  it('returns empty array when categories is undefined', async () => {
    serverGetMock.mockResolvedValue({ categories: undefined });
    expect(await fetchDeviceCategories()).toEqual([]);
  });
});
