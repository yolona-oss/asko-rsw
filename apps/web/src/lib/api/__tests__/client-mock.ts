/**
 * Shared mock setup for client-side API tests.
 * Each test file should call `setupClientMock()` after `vi.mock('../client', ...)`.
 */
import { vi } from 'vitest';

export function createMockApi() {
  return {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  };
}

export type MockApi = ReturnType<typeof createMockApi>;
