import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { deviceApi } = await import('../device');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.put.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
});

// ── CRUD ──

describe('getAll', () => {
  it('sends GET /devices without params when none provided', () => {
    deviceApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/devices', { params: undefined });
  });

  it('sends GET /devices with params', () => {
    const params = { page: 2, limit: 20, search: 'ASKO', type: 'oven', sortBy: 'name', sortOrder: 'asc' };
    deviceApi.getAll(params);
    expect(mockApi.get).toHaveBeenCalledWith('/devices', { params });
  });

  it('forwards isFeatured param', () => {
    deviceApi.getAll({ isFeatured: true });
    expect(mockApi.get).toHaveBeenCalledWith('/devices', { params: { isFeatured: true } });
  });
});

describe('getOne', () => {
  it('sends GET /devices/:id', () => {
    deviceApi.getOne('dev-123');
    expect(mockApi.get).toHaveBeenCalledWith('/devices/dev-123');
  });
});

describe('create', () => {
  it('sends POST /devices with body', () => {
    const data = { name: 'ASKO W6098X', model: 'W6098X', brand: 'ASKO', type: 'washing_machine' } as any;
    deviceApi.create(data);
    expect(mockApi.post).toHaveBeenCalledWith('/devices', data);
  });
});

describe('importDevices', () => {
  it('sends POST /devices/import with array body', () => {
    const products = [
      { name: 'Device A', model: 'A', brand: 'X', type: 't' },
      { name: 'Device B', model: 'B', brand: 'Y', type: 't' },
    ] as any[];
    deviceApi.importDevices(products);
    expect(mockApi.post).toHaveBeenCalledWith('/devices/import', products);
  });
});

describe('update', () => {
  it('sends PATCH /devices/:id with body', () => {
    const data = { name: 'Updated' } as any;
    deviceApi.update('dev-1', data);
    expect(mockApi.patch).toHaveBeenCalledWith('/devices/dev-1', data);
  });
});

describe('delete', () => {
  it('sends DELETE /devices/:id', () => {
    deviceApi.delete('dev-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/devices/dev-1');
  });
});

describe('deleteAll', () => {
  it('sends DELETE /devices/all', () => {
    deviceApi.deleteAll();
    expect(mockApi.delete).toHaveBeenCalledWith('/devices/all');
  });
});

// ── Parts ──

describe('getParts', () => {
  it('sends GET /devices/:deviceId/parts', () => {
    deviceApi.getParts('dev-1');
    expect(mockApi.get).toHaveBeenCalledWith('/devices/dev-1/parts');
  });
});

describe('createPart', () => {
  it('sends POST /devices/:deviceId/parts with body', () => {
    const data = { name: 'Барабан', partNumber: 'PN-001', price: 1500, description: 'desc' };
    deviceApi.createPart('dev-1', data);
    expect(mockApi.post).toHaveBeenCalledWith('/devices/dev-1/parts', data);
  });

  it('sends only required fields', () => {
    const data = { name: 'Барабан' };
    deviceApi.createPart('dev-1', data);
    expect(mockApi.post).toHaveBeenCalledWith('/devices/dev-1/parts', data);
  });
});

describe('updatePart', () => {
  it('sends PATCH /devices/:deviceId/parts/:partId with body', () => {
    const data = { name: 'Updated Part', price: 2000 };
    deviceApi.updatePart('dev-1', 'part-1', data);
    expect(mockApi.patch).toHaveBeenCalledWith('/devices/dev-1/parts/part-1', data);
  });
});

describe('deletePart', () => {
  it('sends DELETE /devices/:deviceId/parts/:partId', () => {
    deviceApi.deletePart('dev-1', 'part-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/devices/dev-1/parts/part-1');
  });
});

// ── Images ──

describe('getImages', () => {
  it('sends GET /devices/:deviceId/images', () => {
    deviceApi.getImages('dev-1');
    expect(mockApi.get).toHaveBeenCalledWith('/devices/dev-1/images');
  });
});

describe('deleteImage', () => {
  it('sends DELETE /devices/:deviceId/images/:imageId', () => {
    deviceApi.deleteImage('dev-1', 'img-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/devices/dev-1/images/img-1');
  });
});

describe('reorderImages', () => {
  it('sends PUT /devices/:deviceId/images/reorder with imageIds body', () => {
    const imageIds = ['img-3', 'img-1', 'img-2'];
    deviceApi.reorderImages('dev-1', imageIds);
    expect(mockApi.put).toHaveBeenCalledWith('/devices/dev-1/images/reorder', imageIds);
  });
});

// ── Part Images ──

describe('getPartImages', () => {
  it('sends GET /devices/:deviceId/parts/:partId/images', () => {
    deviceApi.getPartImages('dev-1', 'part-1');
    expect(mockApi.get).toHaveBeenCalledWith('/devices/dev-1/parts/part-1/images');
  });
});

describe('deletePartImage', () => {
  it('sends DELETE /devices/:deviceId/parts/:partId/images/:imageId', () => {
    deviceApi.deletePartImage('dev-1', 'part-1', 'img-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/devices/dev-1/parts/part-1/images/img-1');
  });
});

// ── Notes ──

describe('addNote', () => {
  it('sends POST /devices/:deviceId/notes with content and isPublic', () => {
    deviceApi.addNote('dev-1', 'Заметка', true);
    expect(mockApi.post).toHaveBeenCalledWith('/devices/dev-1/notes', { content: 'Заметка', isPublic: true });
  });

  it('sends isPublic=false correctly', () => {
    deviceApi.addNote('dev-1', 'Приватная заметка', false);
    expect(mockApi.post).toHaveBeenCalledWith('/devices/dev-1/notes', { content: 'Приватная заметка', isPublic: false });
  });
});
