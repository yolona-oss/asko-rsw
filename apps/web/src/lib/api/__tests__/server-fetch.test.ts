import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const { serverGet } = await import('../server-fetch');

beforeEach(() => fetchMock.mockReset());

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) };
}

describe('serverGet', () => {
  it('returns parsed JSON on 200', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [1, 2] }));

    const result = await serverGet<{ data: number[] }>('/test');
    expect(result).toEqual({ data: [1, 2] });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('returns null on non-ok status', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, 404));
    expect(await serverGet('/missing')).toBeNull();
  });

  it('returns null on 500', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'fail' }, 500));
    expect(await serverGet('/error')).toBeNull();
  });

  it('returns null when json() throws', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => { throw new SyntaxError('Unexpected end of JSON input'); },
    });
    expect(await serverGet('/bad-json')).toBeNull();
  });

  it('prefixes path with API_URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await serverGet('/devices');
    const url: string = fetchMock.mock.calls[0][0];
    expect(url).toMatch(/^https?:\/\/.+\/devices$/);
  });
});
