import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';
import type { IUserDevice } from '../types';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { userDeviceApi } = await import('../user-device');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.put.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
});

// ── getMy (custom wrapper) ──

describe('getMy', () => {
  it('returns unwrapped userDevices on success', async () => {
    const devices: IUserDevice[] = [
      { id: 'ud-1', deviceId: 'dev-1' } as IUserDevice,
      { id: 'ud-2', deviceId: 'dev-2' } as IUserDevice,
    ];
    mockApi.get.mockResolvedValue({ data: { userDevices: devices } });

    const result = await userDeviceApi.getMy();
    expect(mockApi.get).toHaveBeenCalledWith('/user-devices/');
    expect(result).toEqual({ data: devices });
  });

  it('returns empty array when data is null', async () => {
    mockApi.get.mockResolvedValue({ data: null });

    const result = await userDeviceApi.getMy();
    expect(result).toEqual({ data: [] });
  });

  it('returns empty array when userDevices field is missing', async () => {
    mockApi.get.mockResolvedValue({ data: {} });

    const result = await userDeviceApi.getMy();
    expect(result).toEqual({ data: [] });
  });

  it('returns empty array when userDevices is undefined', async () => {
    mockApi.get.mockResolvedValue({ data: { userDevices: undefined } });

    const result = await userDeviceApi.getMy();
    expect(result).toEqual({ data: [] });
  });
});

// ── register ──

describe('register', () => {
  it('calls POST /user-devices/ with body', () => {
    const data = { deviceId: 'dev-1', serialNumber: 'SN-123' } as any;
    userDeviceApi.register(data);
    expect(mockApi.post).toHaveBeenCalledWith('/user-devices/', data);
  });
});

// ── update ──

describe('update', () => {
  it('calls PATCH /user-devices/:id with body', () => {
    const data = { serialNumber: 'SN-456' } as any;
    userDeviceApi.update('ud-1', data);
    expect(mockApi.patch).toHaveBeenCalledWith('/user-devices/ud-1', data);
  });
});
