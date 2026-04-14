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
      '/file-upload/image/upload', expect.any(FormData), MULTIPART,
    );
  });

  it('uploadVideo posts to /file-upload/video/upload with FormData', () => {
    fileUploadApi.uploadVideo(fakeFile);
    expect(mockApi.post).toHaveBeenCalledWith(
      '/file-upload/video/upload', expect.any(FormData), MULTIPART,
    );
  });
});

// ── Target-specific image uploads ──

describe('target image uploads', () => {
  it.each([
    ['uploadAvatar', 'avatar'],
    ['uploadDeviceImage', 'device'],
    ['uploadArticleImage', 'article'],
    ['uploadRepairRequestImage', 'repair-request'],
    ['uploadReviewImage', 'review'],
    ['uploadDevicePartImage', 'device-part'],
    ['uploadBrokenPartImage', 'broken-part'],
  ] as const)('%s posts to /file-upload/image/upload/%s/:ownerId', (method, target) => {
    (fileUploadApi as any)[method](fakeFile, 'owner-1');
    expect(mockApi.post).toHaveBeenCalledWith(
      `/file-upload/image/upload/${target}/owner-1`, expect.any(FormData), MULTIPART,
    );
  });
});

// ── Document uploads ──

describe('document uploads', () => {
  it('uploadBrokenPartDocument posts to correct path', () => {
    fileUploadApi.uploadBrokenPartDocument(fakeFile, 'bp-1');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/file-upload/document/upload/broken-part/bp-1', expect.any(FormData), MULTIPART,
    );
  });

  it('uploadRepairRequestDocument posts to correct path', () => {
    fileUploadApi.uploadRepairRequestDocument(fakeFile, 'rr-1');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/file-upload/document/upload/repair-request/rr-1', expect.any(FormData), MULTIPART,
    );
  });

  it('deleteDocument calls DELETE', () => {
    fileUploadApi.deleteDocument('doc-1');
    expect(mockApi.delete).toHaveBeenCalledWith('/file-upload/document/delete/doc-1');
  });

  it('getAttachedDocuments calls GET with params', () => {
    fileUploadApi.getAttachedDocuments('repair-request', 'rr-1');
    expect(mockApi.get).toHaveBeenCalledWith('/file-upload/document/attached', {
      params: { ownerType: 'repair-request', ownerId: 'rr-1' },
    });
  });
});

// ── Target-specific video uploads ──

describe('target video uploads', () => {
  it.each([
    ['uploadRepairRequestVideo', 'repair-request'],
    ['uploadReviewVideo', 'review'],
    ['uploadDeviceVideo', 'device'],
    ['uploadArticleVideo', 'article'],
  ] as const)('%s posts to /file-upload/video/upload/%s/:ownerId', (method, target) => {
    (fileUploadApi as any)[method](fakeFile, 'owner-1');
    expect(mockApi.post).toHaveBeenCalledWith(
      `/file-upload/video/upload/${target}/owner-1`, expect.any(FormData), MULTIPART,
    );
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
