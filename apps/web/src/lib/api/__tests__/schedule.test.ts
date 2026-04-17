import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { scheduleApi } = await import('../schedule');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
  mockApi.put.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
});

describe('getAll', () => {
  it('calls GET /schedule with params', () => {
    const params = { page: 1, limit: 10, userId: 'u1', type: 'work' };
    scheduleApi.getAll(params);
    expect(mockApi.get).toHaveBeenCalledWith('/schedule', { params });
  });

  it('calls GET /schedule without params', () => {
    scheduleApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/schedule', { params: undefined });
  });
});

describe('createVacation', () => {
  it('calls POST /schedule/vacation with body', () => {
    const data = { userId: 'u1', dateFrom: '2026-06-01', durationDays: 14, note: 'Summer break' };
    scheduleApi.createVacation(data);
    expect(mockApi.post).toHaveBeenCalledWith('/schedule/vacation', data);
  });
});

describe('createSickLeave', () => {
  it('calls POST /schedule/sick-leave with body', () => {
    const data = { userId: 'u1', dateFrom: '2026-01-01', durationDays: 5 };
    scheduleApi.createSickLeave(data);
    expect(mockApi.post).toHaveBeenCalledWith('/schedule/sick-leave', data);
  });
});

describe('createOvertime', () => {
  it('calls POST /schedule/overtime with body', () => {
    const data = { userId: 'u1', date: '2026-01-01', startTime: '18:00', endTime: '20:00' };
    scheduleApi.createOvertime(data);
    expect(mockApi.post).toHaveBeenCalledWith('/schedule/overtime', data);
  });
});

describe('createOverride', () => {
  it('calls POST /schedule/override with body', () => {
    const data = { userId: 'u1', date: '2026-01-01', startTime: '09:00', endTime: '18:00' };
    scheduleApi.createOverride(data);
    expect(mockApi.post).toHaveBeenCalledWith('/schedule/override', data);
  });
});

describe('updateVacation', () => {
  it('calls PUT /schedule/vacation/:id with body', () => {
    scheduleApi.updateVacation('v-1', { dateTo: '2026-06-10' });
    expect(mockApi.put).toHaveBeenCalledWith('/schedule/vacation/v-1', { dateTo: '2026-06-10' });
  });
});

describe('delete', () => {
  it('calls DELETE /schedule/:id', () => {
    scheduleApi.delete('sch-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/schedule/sch-1');
  });
});

describe('approve', () => {
  it('calls POST /schedule/:id/approve', () => {
    scheduleApi.approve('sch-1');
    expect(mockApi.post).toHaveBeenCalledWith('/schedule/sch-1/approve');
  });
});

describe('reject', () => {
  it('calls POST /schedule/:id/reject', () => {
    scheduleApi.reject('sch-1');
    expect(mockApi.post).toHaveBeenCalledWith('/schedule/sch-1/reject');
  });
});

describe('patternGet', () => {
  it('calls GET /schedule/pattern/:userId', () => {
    scheduleApi.patternGet('u1');
    expect(mockApi.get).toHaveBeenCalledWith('/schedule/pattern/u1');
  });
});

describe('patternUpsert', () => {
  it('calls PUT /schedule/pattern/:userId with body', () => {
    const data = {
      cycleLength: 7,
      anchorDate: '2026-01-01',
      defaultStartTime: '09:00',
      defaultEndTime: '18:00',
      slots: [{ work: true, startTime: '09:00', endTime: '18:00' }],
    };
    scheduleApi.patternUpsert('u1', data);
    expect(mockApi.put).toHaveBeenCalledWith('/schedule/pattern/u1', data);
  });
});

describe('patternDelete', () => {
  it('calls DELETE /schedule/pattern/:userId', () => {
    scheduleApi.patternDelete('u1');
    expect(mockApi.delete).toHaveBeenCalledWith('/schedule/pattern/u1');
  });
});

describe('patternGetMany', () => {
  it('calls GET /schedule/patterns with comma-joined userIds', () => {
    scheduleApi.patternGetMany(['u1', 'u2', 'u3']);
    expect(mockApi.get).toHaveBeenCalledWith('/schedule/patterns', {
      params: { userIds: 'u1,u2,u3' },
    });
  });

  it('handles single userId', () => {
    scheduleApi.patternGetMany(['u1']);
    expect(mockApi.get).toHaveBeenCalledWith('/schedule/patterns', {
      params: { userIds: 'u1' },
    });
  });
});

describe('patternApprove', () => {
  it('calls POST /schedule/pattern/:userId/approve', () => {
    scheduleApi.patternApprove('u1');
    expect(mockApi.post).toHaveBeenCalledWith('/schedule/pattern/u1/approve');
  });
});

describe('patternReject', () => {
  it('calls POST /schedule/pattern/:userId/reject', () => {
    scheduleApi.patternReject('u1');
    expect(mockApi.post).toHaveBeenCalledWith('/schedule/pattern/u1/reject');
  });
});

describe('patternHistory', () => {
  it('calls GET /schedule/pattern/:userId/history with params', () => {
    const params = { page: 1, limit: 20, dateFrom: '2026-01-01' };
    scheduleApi.patternHistory('u1', params);
    expect(mockApi.get).toHaveBeenCalledWith('/schedule/pattern/u1/history', { params });
  });

  it('calls GET /schedule/pattern/:userId/history without params', () => {
    scheduleApi.patternHistory('u1');
    expect(mockApi.get).toHaveBeenCalledWith('/schedule/pattern/u1/history', { params: undefined });
  });
});

describe('scheduleReport', () => {
  it('calls GET /schedule/report/:userId with dateFrom and dateTo params', () => {
    scheduleApi.scheduleReport('u1', '2026-01-01', '2026-01-31');
    expect(mockApi.get).toHaveBeenCalledWith('/schedule/report/u1', {
      params: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
    });
  });
});
