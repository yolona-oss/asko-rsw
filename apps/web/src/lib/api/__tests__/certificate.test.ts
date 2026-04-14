import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { certificateApi } = await import('../certificate');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
});

// ── getAll ──

describe('getAll', () => {
  it('sends GET /certificates without params when none provided', () => {
    certificateApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/certificates', { params: undefined });
  });

  it('sends GET /certificates with params', () => {
    const params = { page: 1, limit: 10, search: 'cert', status: 'active', sortBy: 'createdAt', sortOrder: 'desc' };
    certificateApi.getAll(params);
    expect(mockApi.get).toHaveBeenCalledWith('/certificates', { params });
  });
});

// ── getMy (custom wrapper) ──

describe('getMy', () => {
  it('returns certificates array on success', async () => {
    const certs = [{ id: 'cert-1' }, { id: 'cert-2' }];
    mockApi.get.mockResolvedValue({ data: { certificates: certs } });

    const result = await certificateApi.getMy();
    expect(mockApi.get).toHaveBeenCalledWith('/certificates/my');
    expect(result).toEqual({ data: certs });
  });

  it('returns empty array when data is null', async () => {
    mockApi.get.mockResolvedValue({ data: null });

    const result = await certificateApi.getMy();
    expect(result).toEqual({ data: [] });
  });

  it('returns empty array when certificates field is missing', async () => {
    mockApi.get.mockResolvedValue({ data: {} });

    const result = await certificateApi.getMy();
    expect(result).toEqual({ data: [] });
  });

  it('returns empty array when certificates is undefined', async () => {
    mockApi.get.mockResolvedValue({ data: { certificates: undefined } });

    const result = await certificateApi.getMy();
    expect(result).toEqual({ data: [] });
  });

  it('returns provided empty certificates array as-is', async () => {
    mockApi.get.mockResolvedValue({ data: { certificates: [] } });

    const result = await certificateApi.getMy();
    expect(result).toEqual({ data: [] });
  });
});

// ── getDealer ──

describe('getDealer', () => {
  it('sends GET /certificates/dealer without params when none provided', () => {
    certificateApi.getDealer();
    expect(mockApi.get).toHaveBeenCalledWith('/certificates/dealer', { params: undefined });
  });

  it('sends GET /certificates/dealer with params', () => {
    const params = { page: 2, limit: 5, search: 'test', status: 'pending' };
    certificateApi.getDealer(params);
    expect(mockApi.get).toHaveBeenCalledWith('/certificates/dealer', { params });
  });
});

// ── getOne ──

describe('getOne', () => {
  it('sends GET /certificates/:id', () => {
    certificateApi.getOne('cert-1');
    expect(mockApi.get).toHaveBeenCalledWith('/certificates/cert-1');
  });
});

// ── add ──

describe('add', () => {
  it('sends POST /certificates/add with body', () => {
    const data = { userDeviceId: 'ud-1', durationMonths: 12 } as any;
    certificateApi.add(data);
    expect(mockApi.post).toHaveBeenCalledWith('/certificates/add', data);
  });
});

// ── create ──

describe('create', () => {
  it('sends POST /certificates/create with body', () => {
    const data = { userDeviceId: 'ud-1', durationMonths: 6 } as any;
    certificateApi.create(data);
    expect(mockApi.post).toHaveBeenCalledWith('/certificates/create', data);
  });
});

// ── selfCreate ──

describe('selfCreate', () => {
  it('sends POST /certificates/self-create with body', () => {
    const data = { deviceName: 'ASKO W6098X', serialNumber: 'SN-001' } as any;
    certificateApi.selfCreate(data);
    expect(mockApi.post).toHaveBeenCalledWith('/certificates/self-create', data);
  });
});

// ── reapply ──

describe('reapply', () => {
  it('sends POST /certificates/:id/reapply with body', () => {
    const data = { reason: 'Исправлены данные' } as any;
    certificateApi.reapply('cert-1', data);
    expect(mockApi.post).toHaveBeenCalledWith('/certificates/cert-1/reapply', data);
  });
});

// ── calculatePrice ──

describe('calculatePrice', () => {
  it('sends GET /certificates/calculate-price with query params', () => {
    certificateApi.calculatePrice('ud-1', 12);
    expect(mockApi.get).toHaveBeenCalledWith('/certificates/calculate-price', {
      params: { userDeviceId: 'ud-1', durationMonths: 12 },
    });
  });
});

// ── revoke ──

describe('revoke', () => {
  it('sends POST /certificates/:id/revoke', () => {
    certificateApi.revoke('cert-1');
    expect(mockApi.post).toHaveBeenCalledWith('/certificates/cert-1/revoke');
  });
});

// ── pay ──

describe('pay', () => {
  it('sends POST /certificates/:certId/pay', () => {
    certificateApi.pay('cert-1');
    expect(mockApi.post).toHaveBeenCalledWith('/certificates/cert-1/pay');
  });
});

// ── dummyPay ──

describe('dummyPay', () => {
  it('sends POST /certificates/:certId/dummy-pay', () => {
    certificateApi.dummyPay('cert-1');
    expect(mockApi.post).toHaveBeenCalledWith('/certificates/cert-1/dummy-pay');
  });
});

// ── generatePdf ──

describe('generatePdf', () => {
  it('sends POST /certificates/:certId/pdf/generate without force param', () => {
    certificateApi.generatePdf('cert-1');
    expect(mockApi.post).toHaveBeenCalledWith('/certificates/cert-1/pdf/generate', null, {
      params: undefined,
    });
  });

  it('sends POST with force=true param when force is true', () => {
    certificateApi.generatePdf('cert-1', true);
    expect(mockApi.post).toHaveBeenCalledWith('/certificates/cert-1/pdf/generate', null, {
      params: { force: 'true' },
    });
  });

  it('sends POST without force param when force is false', () => {
    certificateApi.generatePdf('cert-1', false);
    expect(mockApi.post).toHaveBeenCalledWith('/certificates/cert-1/pdf/generate', null, {
      params: undefined,
    });
  });
});
