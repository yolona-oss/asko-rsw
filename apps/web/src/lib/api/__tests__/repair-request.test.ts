import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { repairRequestApi } = await import('../repair-request');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.put.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
});

// ── List / Get ──

describe('getAll', () => {
  it('calls GET /repair-requests with params', () => {
    const params = { page: 1, limit: 10, search: 'abc', status: 'new' };
    repairRequestApi.getAll(params);
    expect(mockApi.get).toHaveBeenCalledWith('/repair-requests', { params });
  });

  it('calls GET /repair-requests without params', () => {
    repairRequestApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/repair-requests', { params: undefined });
  });
});

describe('getMy', () => {
  it('calls GET /repair-requests/my with params', () => {
    const params = { page: 2, limit: 5 };
    repairRequestApi.getMy(params);
    expect(mockApi.get).toHaveBeenCalledWith('/repair-requests/my', { params });
  });

  it('calls GET /repair-requests/my without params', () => {
    repairRequestApi.getMy();
    expect(mockApi.get).toHaveBeenCalledWith('/repair-requests/my', { params: undefined });
  });
});

describe('getAssigned', () => {
  it('calls GET /repair-requests/assigned with params', () => {
    const params = { page: 1, limit: 20, status: 'in_progress' };
    repairRequestApi.getAssigned(params);
    expect(mockApi.get).toHaveBeenCalledWith('/repair-requests/assigned', { params });
  });

  it('calls GET /repair-requests/assigned without params', () => {
    repairRequestApi.getAssigned();
    expect(mockApi.get).toHaveBeenCalledWith('/repair-requests/assigned', { params: undefined });
  });
});

describe('getActive', () => {
  it('calls GET /repair-requests/active', () => {
    repairRequestApi.getActive();
    expect(mockApi.get).toHaveBeenCalledWith('/repair-requests/active');
  });
});

describe('getOne', () => {
  it('calls GET /repair-requests/:id', () => {
    repairRequestApi.getOne('req-123');
    expect(mockApi.get).toHaveBeenCalledWith('/repair-requests/req-123');
  });
});

describe('create', () => {
  it('calls POST /repair-requests with body', () => {
    const data = { deviceId: 'dev-1', description: 'broken' } as any;
    repairRequestApi.create(data);
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests', data);
  });
});

// ── Status changes ──

describe('assign', () => {
  it('calls POST /repair-requests/:id/assign with repairerId', () => {
    repairRequestApi.assign('req-1', 'rep-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/assign', { repairerId: 'rep-1' });
  });
});

describe('accept', () => {
  it('calls POST /repair-requests/:id/accept', () => {
    repairRequestApi.accept('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/accept');
  });
});

describe('start', () => {
  it('calls POST /repair-requests/:id/start', () => {
    repairRequestApi.start('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/start');
  });
});

describe('reassign', () => {
  it('calls POST /repair-requests/:id/reassign with repairerId', () => {
    repairRequestApi.reassign('req-1', 'rep-2');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/reassign', { repairerId: 'rep-2' });
  });
});

describe('acceptChat', () => {
  it('calls POST /repair-requests/:id/chat/accept', () => {
    repairRequestApi.acceptChat('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/chat/accept');
  });
});

describe('detachChat', () => {
  it('calls POST /repair-requests/:id/chat/detach', () => {
    repairRequestApi.detachChat('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/chat/detach');
  });
});

describe('getPaused', () => {
  it('calls GET /repair-requests/paused with params', () => {
    const params = { page: 1, limit: 10 };
    repairRequestApi.getPaused(params);
    expect(mockApi.get).toHaveBeenCalledWith('/repair-requests/paused', { params });
  });

  it('calls GET /repair-requests/paused without params', () => {
    repairRequestApi.getPaused();
    expect(mockApi.get).toHaveBeenCalledWith('/repair-requests/paused', { params: undefined });
  });
});

describe('pause', () => {
  it('calls POST /repair-requests/:id/pause', () => {
    repairRequestApi.pause('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/pause');
  });
});

describe('resume', () => {
  it('calls POST /repair-requests/:id/resume', () => {
    repairRequestApi.resume('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/resume');
  });
});

describe('refuse', () => {
  it('calls POST /repair-requests/:id/refuse with reason', () => {
    repairRequestApi.refuse('req-1', 'too expensive');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/refuse', { reason: 'too expensive' });
  });
});

describe('setPrice', () => {
  it('calls POST /repair-requests/:id/set-price with body', () => {
    const data = { totalPrice: 5000 } as any;
    repairRequestApi.setPrice('req-1', data);
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/set-price', data);
  });
});

// ── AVR ──

describe('generateAvr', () => {
  it('calls POST /repair-requests/:id/avr/generate with data', () => {
    const data = { completionNote: 'done' };
    repairRequestApi.generateAvr('req-1', data);
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/avr/generate', data);
  });

  it('sends empty object when data is undefined', () => {
    repairRequestApi.generateAvr('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/avr/generate', {});
  });
});

describe('resetAvr', () => {
  it('calls POST /repair-requests/:id/avr/reset', () => {
    repairRequestApi.resetAvr('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/avr/reset');
  });
});

describe('initiateAvrSigning', () => {
  it('calls POST /repair-requests/:id/avr/sign/initiate', () => {
    repairRequestApi.initiateAvrSigning('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/avr/sign/initiate');
  });
});

describe('resendAvrOtp', () => {
  it('calls POST /repair-requests/:id/avr/sign/resend', () => {
    repairRequestApi.resendAvrOtp('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/avr/sign/resend');
  });
});

describe('verifyAvrSigning', () => {
  it('calls POST /repair-requests/:id/avr/sign/verify with body', () => {
    const data = { code: '123456' };
    repairRequestApi.verifyAvrSigning('req-1', data);
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/avr/sign/verify', data);
  });
});

describe('confirmAvrOffline', () => {
  it('calls POST /repair-requests/:id/avr/offline/confirm', () => {
    repairRequestApi.confirmAvrOffline('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/avr/offline/confirm');
  });
});

describe('uploadAvrScan', () => {
  it('calls POST /repair-requests/:id/avr/scan/upload with FormData and multipart header', () => {
    const file = new File(['content'], 'scan.pdf', { type: 'application/pdf' });
    repairRequestApi.uploadAvrScan('req-1', file);

    expect(mockApi.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = mockApi.post.mock.calls[0];
    expect(url).toBe('/repair-requests/req-1/avr/scan/upload');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBe(file);
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });
  });
});

// ── Payments ──

describe('pay', () => {
  it('calls POST /repair-requests/:id/pay', () => {
    repairRequestApi.pay('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/pay');
  });
});

describe('dummyPay', () => {
  it('calls POST /repair-requests/:id/dummy-pay', () => {
    repairRequestApi.dummyPay('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/dummy-pay');
  });
});

describe('getPayments', () => {
  it('calls GET /repair-requests/:id/payments', () => {
    repairRequestApi.getPayments('req-1');
    expect(mockApi.get).toHaveBeenCalledWith('/repair-requests/req-1/payments');
  });
});

// ── Work steps ──

describe('getSteps', () => {
  it('calls GET /repair-requests/:id/steps', () => {
    repairRequestApi.getSteps('req-1');
    expect(mockApi.get).toHaveBeenCalledWith('/repair-requests/req-1/steps');
  });
});

describe('addStep', () => {
  it('calls POST /repair-requests/:id/steps with body', () => {
    const data = { title: 'Diagnostics' } as any;
    repairRequestApi.addStep('req-1', data);
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/steps', data);
  });
});

describe('updateStep', () => {
  it('calls POST /repair-requests/:id/steps/:stepId/update with body', () => {
    const data = { title: 'Updated' };
    repairRequestApi.updateStep('req-1', 'step-1', data);
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/steps/step-1/update', data);
  });
});

describe('completeStep', () => {
  it('calls POST /repair-requests/:id/steps/:stepId/complete', () => {
    repairRequestApi.completeStep('req-1', 'step-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/steps/step-1/complete');
  });
});

describe('deleteStep', () => {
  it('calls POST /repair-requests/:id/steps/:stepId/delete', () => {
    repairRequestApi.deleteStep('req-1', 'step-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/steps/step-1/delete');
  });
});

describe('lockSteps', () => {
  it('calls POST /repair-requests/:id/steps/lock', () => {
    repairRequestApi.lockSteps('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/steps/lock');
  });
});

describe('approveDiagnostics', () => {
  it('calls POST /repair-requests/:id/steps/diagnostics/approve', () => {
    repairRequestApi.approveDiagnostics('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/steps/diagnostics/approve');
  });
});

describe('declineDiagnostics', () => {
  it('calls POST /repair-requests/:id/steps/diagnostics/decline with reason', () => {
    repairRequestApi.declineDiagnostics('req-1', 'not acceptable');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/steps/diagnostics/decline', { reason: 'not acceptable' });
  });

  it('sends { reason: undefined } when reason is omitted', () => {
    repairRequestApi.declineDiagnostics('req-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/steps/diagnostics/decline', { reason: undefined });
  });
});

// ── Broken parts ──

describe('getBrokenParts', () => {
  it('calls GET /repair-requests/:id/broken-parts', () => {
    repairRequestApi.getBrokenParts('req-1');
    expect(mockApi.get).toHaveBeenCalledWith('/repair-requests/req-1/broken-parts');
  });
});

describe('addBrokenPart', () => {
  it('calls POST /repair-requests/:id/broken-parts with body', () => {
    const data = { name: 'Pump', note: 'leaking' };
    repairRequestApi.addBrokenPart('req-1', data);
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/broken-parts', data);
  });

  it('calls POST /repair-requests/:id/broken-parts with devicePartId', () => {
    const data = { devicePartId: 'dp-1', name: 'Pump' };
    repairRequestApi.addBrokenPart('req-1', data);
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/broken-parts', data);
  });
});

describe('suggestBrokenPart', () => {
  it('calls POST /repair-requests/:id/broken-parts/suggest with body', () => {
    const data = { name: 'Maybe pump', note: 'I think this is broken' };
    repairRequestApi.suggestBrokenPart('req-1', data);
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/broken-parts/suggest', data);
  });

  it('calls POST /repair-requests/:id/broken-parts/suggest with only name', () => {
    repairRequestApi.suggestBrokenPart('req-1', { name: 'Something' });
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/broken-parts/suggest', { name: 'Something' });
  });
});

describe('updateBrokenPart', () => {
  it('calls POST /repair-requests/:id/broken-parts/:partId/update with body', () => {
    const data = { name: 'Motor' };
    repairRequestApi.updateBrokenPart('req-1', 'part-1', data);
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/broken-parts/part-1/update', data);
  });
});

describe('updateBrokenPartStatus', () => {
  it('calls POST /repair-requests/:id/broken-parts/:partId/status with body', () => {
    repairRequestApi.updateBrokenPartStatus('req-1', 'part-1', 'ordered');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/broken-parts/part-1/status', { status: 'ordered' });
  });
});

describe('deleteBrokenPart', () => {
  it('calls POST /repair-requests/:id/broken-parts/:partId/delete', () => {
    repairRequestApi.deleteBrokenPart('req-1', 'part-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/broken-parts/part-1/delete');
  });
});

describe('getBrokenPartImages', () => {
  it('calls GET /repair-requests/:id/broken-parts/:partId/images', () => {
    repairRequestApi.getBrokenPartImages('req-1', 'part-1');
    expect(mockApi.get).toHaveBeenCalledWith('/repair-requests/req-1/broken-parts/part-1/images');
  });
});

describe('orderBrokenPart', () => {
  it('calls POST /repair-requests/:id/broken-parts/:partId/order with data', () => {
    const data = { supplier: 'PartsCo' };
    repairRequestApi.orderBrokenPart('req-1', 'part-1', data);
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/broken-parts/part-1/order', data);
  });

  it('sends empty object when data is undefined', () => {
    repairRequestApi.orderBrokenPart('req-1', 'part-1');
    expect(mockApi.post).toHaveBeenCalledWith('/repair-requests/req-1/broken-parts/part-1/order', {});
  });
});
