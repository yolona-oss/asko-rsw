import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => { mockApi = createMockApi(); return { api: mockApi }; });

const { fileUploadApi } = await import('../file-upload');

beforeEach(() => Object.values(mockApi).forEach(fn => fn.mockClear()));

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };
const fakeFile = new File(['data'], 'test.jpg', { type: 'image/jpeg' });

// ── Generic uploads ──

describe('generic uploads', () => {
  it('uploadImage posts to /file-upload/image/upload with FormData', () => {
    fileUploadApi.uploadImage(fakeFile);
    expect(mockApi.post).toHaveBeenCalledWith(
      '/file-upload/image/upload',
      expect.any(FormData),
      expect.objectContaining(MULTIPART),
    );
  });

  it('uploadVideo posts to /file-upload/video/upload with FormData', () => {
    const fakeVideo = new File(['data'], 'test.mp4', { type: 'video/mp4' });
    fileUploadApi.uploadVideo(fakeVideo);
    expect(mockApi.post).toHaveBeenCalledWith(
      '/file-upload/video/upload',
      expect.any(FormData),
      expect.objectContaining(MULTIPART),
    );
  });
});

// ── Target-specific image uploads (hosted on owning gateways) ──

describe('target image uploads', () => {
  it('uploadAvatar posts to /auth/users/:userId/avatar', () => {
    fileUploadApi.uploadAvatar(fakeFile, 'u-1');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/auth/users/u-1/avatar',
      expect.any(FormData),
      expect.objectContaining(MULTIPART),
    );
  });

  it.each([
    ['uploadDeviceImage', 'devices'],
    ['uploadArticleImage', 'articles'],
    ['uploadRepairRequestImage', 'repair-requests'],
    ['uploadReviewImage', 'reviews'],
    ['uploadDevicePartImage', 'parts'],
  ] as const)('%s posts to /%s/:ownerId/images', (method, prefix) => {
    (fileUploadApi as any)[method](fakeFile, 'owner-1');
    expect(mockApi.post).toHaveBeenCalledWith(
      `/${prefix}/owner-1/images`,
      expect.any(FormData),
      expect.objectContaining(MULTIPART),
    );
  });

  it('uploadBrokenPartImage posts to /repair-requests/broken-parts/:partId/images', () => {
    fileUploadApi.uploadBrokenPartImage(fakeFile, 'bp-1');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/repair-requests/broken-parts/bp-1/images',
      expect.any(FormData),
      expect.objectContaining(MULTIPART),
    );
  });
});

// ── Document uploads ──

describe('document uploads', () => {
  const fakeDoc = new File(['data'], 'report.pdf', { type: 'application/pdf' });

  it('uploadBrokenPartDocument posts to correct path', () => {
    fileUploadApi.uploadBrokenPartDocument(fakeDoc, 'bp-1');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/repair-requests/broken-parts/bp-1/documents',
      expect.any(FormData),
      expect.objectContaining(MULTIPART),
    );
  });

  it('uploadRepairRequestDocument posts to correct path', () => {
    fileUploadApi.uploadRepairRequestDocument(fakeDoc, 'rr-1');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/repair-requests/rr-1/documents',
      expect.any(FormData),
      expect.objectContaining(MULTIPART),
    );
  });

  it('deleteDocument calls DELETE', () => {
    fileUploadApi.deleteDocument('doc-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/repair-requests/documents/doc-1');
  });

  it('getAttachedDocuments calls GET with params', () => {
    fileUploadApi.getAttachedDocuments('repair-request', 'rr-1');
    expect(mockApi.get).toHaveBeenCalledWith('/file-upload/document/attached', {
      params: { ownerType: 'repair-request', ownerId: 'rr-1' },
    });
  });
});

// ── Target-specific video uploads (hosted on owning gateways) ──

describe('target video uploads', () => {
  const fakeVideo = new File(['data'], 'clip.mp4', { type: 'video/mp4' });

  it.each([
    ['uploadRepairRequestVideo', 'repair-requests'],
    ['uploadReviewVideo', 'reviews'],
    ['uploadDeviceVideo', 'devices'],
    ['uploadArticleVideo', 'articles'],
  ] as const)('%s posts to /%s/:ownerId/videos', (method, prefix) => {
    (fileUploadApi as any)[method](fakeVideo, 'owner-1');
    expect(mockApi.post).toHaveBeenCalledWith(
      `/${prefix}/owner-1/videos`,
      expect.any(FormData),
      expect.objectContaining(MULTIPART),
    );
  });
});

// ── Upload options: progress + signal + validation ──

describe('upload options', () => {
  it('wires onProgress to axios onUploadProgress', async () => {
    const onProgress = vi.fn();
    fileUploadApi.uploadRepairRequestImage(fakeFile, 'r-1', { onProgress });

    const config = mockApi.post.mock.calls[0][2];
    expect(config.onUploadProgress).toBeTypeOf('function');

    // Simulate a progress event (50% of 2 KB)
    config.onUploadProgress({ loaded: 1024, total: 2048 });
    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it('wires AbortSignal to axios config', async () => {
    const ctrl = new AbortController();
    fileUploadApi.uploadRepairRequestImage(fakeFile, 'r-1', { signal: ctrl.signal });

    const config = mockApi.post.mock.calls[0][2];
    expect(config.signal).toBe(ctrl.signal);
  });

  it('throws UploadValidationError for oversize image', async () => {
    // Craft a 12 MB File — exceeds image limit (10 MB)
    const big = new File([new Uint8Array(12 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' });
    const { UploadValidationError } = await import('../upload-limits');
    expect(() => fileUploadApi.uploadRepairRequestImage(big, 'r-1')).toThrow(UploadValidationError);
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('throws UploadValidationError for wrong mime', async () => {
    const txt = new File(['hello'], 'note.txt', { type: 'text/plain' });
    const { UploadValidationError } = await import('../upload-limits');
    expect(() => fileUploadApi.uploadRepairRequestImage(txt, 'r-1')).toThrow(UploadValidationError);
    expect(mockApi.post).not.toHaveBeenCalled();
  });
});

// ── Attach / detach / query ──

describe('attach / detach / query', () => {
  it('attachImage posts with ownerType and ownerId', () => {
    fileUploadApi.attachImage('img-1', 'device', 'dev-1');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/file-upload/image/attach/img-1', { ownerType: 'device', ownerId: 'dev-1' },
    );
  });

  it('unattachImage calls PUT', () => {
    fileUploadApi.unattachImage('img-1');
    expect(mockApi.put).toHaveBeenCalledWith('/file-upload/image/unattach/img-1');
  });

  it('deleteImage calls DELETE', () => {
    fileUploadApi.deleteImage('img-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/file-upload/image/delete/img-1');
  });

  it('getAttachedImages calls GET with params', () => {
    fileUploadApi.getAttachedImages('device', 'dev-1');
    expect(mockApi.get).toHaveBeenCalledWith('/file-upload/image/attached', {
      params: { ownerType: 'device', ownerId: 'dev-1' },
    });
  });

  it('getAttachedImages passes _silent when requested', () => {
    fileUploadApi.getAttachedImages('device', 'dev-1', true);
    expect(mockApi.get).toHaveBeenCalledWith('/file-upload/image/attached', {
      params: { ownerType: 'device', ownerId: 'dev-1' },
      _silent: true,
    });
  });

  it('attachVideo posts with ownerType and ownerId', () => {
    fileUploadApi.attachVideo('vid-1', 'device', 'dev-1');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/file-upload/video/attach/vid-1', { ownerType: 'device', ownerId: 'dev-1' },
    );
  });

  it('unattachVideo calls PUT', () => {
    fileUploadApi.unattachVideo('vid-1');
    expect(mockApi.put).toHaveBeenCalledWith('/file-upload/video/unattach/vid-1');
  });

  it('deleteVideo calls DELETE', () => {
    fileUploadApi.deleteVideo('vid-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/file-upload/video/delete/vid-1');
  });

  it('getAttachedVideos calls GET with params', () => {
    fileUploadApi.getAttachedVideos('device', 'dev-1');
    expect(mockApi.get).toHaveBeenCalledWith('/file-upload/video/attached', {
      params: { ownerType: 'device', ownerId: 'dev-1' },
    });
  });

  it('getAttachedVideos passes _silent when requested', () => {
    fileUploadApi.getAttachedVideos('device', 'dev-1', true);
    expect(mockApi.get).toHaveBeenCalledWith('/file-upload/video/attached', {
      params: { ownerType: 'device', ownerId: 'dev-1' },
      _silent: true,
    });
  });
});
