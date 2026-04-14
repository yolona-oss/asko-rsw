import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDeviceCategory, makeCategoryListResponse } from './fixtures';

vi.mock('server-only', () => ({}));

const serverGetMock = vi.fn();
vi.mock('../server-fetch', () => ({ serverGet: (...args: any[]) => serverGetMock(...args) }));

const { fetchDeviceCategories } = await import('../device-category.server');

beforeEach(() => serverGetMock.mockReset());

describe('fetchDeviceCategories', () => {
  it('returns categories on success', async () => {
    const categories = [
      makeDeviceCategory({ name: 'washing_machine', label: 'Стиральная машина' }),
      makeDeviceCategory({ id: 'cat-2', name: 'dryer', label: 'Сушильная машина', order: 1 }),
    ];
    serverGetMock.mockResolvedValue(makeCategoryListResponse(categories));

    expect(await fetchDeviceCategories()).toEqual(categories);
    expect(serverGetMock).toHaveBeenCalledWith('/device-categories');
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

  it('returns empty array when response has unrelated fields only', async () => {
    serverGetMock.mockResolvedValue({ items: [], total: 0 });
    expect(await fetchDeviceCategories()).toEqual([]);
  });
});
