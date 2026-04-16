import type { AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import type { IImageAttachment, ImageResponse } from './types';
import { api } from './client';
import { assertUploadLimit, type UploadKind } from './upload-limits';

interface VideoResponse {
    video: {
        id: string;
        videoJson: {
            public_id: string;
            format: string;
            resource_type: string;
            url: string;
            secure_url: string;
            original_filename: string;
            duration?: number;
            size?: number;
        };
        order: number;
        ownerType?: string;
        ownerId?: string;
        createdAt?: string;
        updatedAt?: string;
    };
}

export interface DocumentAttachment {
    id: string;
    filename?: string;
    mimeType?: string;
    sizeBytes?: number;
    ownerType?: string;
    ownerId?: string;
    createdAt?: string;
}

interface DocumentResponse {
    document: DocumentAttachment;
}

/**
 * Per-upload UX options that every helper accepts. Keep this stable —
 * it's the integration point for progress bars and cancel buttons across
 * every form that uploads files.
 */
export interface UploadOptions {
    /** Receives 0–100; called on xhr upload.progress events. */
    onProgress?: (pct: number) => void;
    /** AbortSignal — lets components cancel an in-flight upload. */
    signal?: AbortSignal;
}

const MULTIPART: Pick<AxiosRequestConfig, 'headers'> = {
    headers: { 'Content-Type': 'multipart/form-data' },
};

function toForm(file: File | Blob, name = 'file'): FormData {
    const form = new FormData();
    form.append(name, file);
    return form;
}

/**
 * Build the axios config for a multipart upload. Wraps MULTIPART headers,
 * an xhr progress handler, and an abort signal. Pre-validates against the
 * given `kind` before returning — throws `UploadValidationError` on
 * oversize / wrong MIME, so callers never hit the network.
 */
function uploadConfig(
    file: File | Blob,
    kind: UploadKind,
    opts?: UploadOptions,
): AxiosRequestConfig {
    assertUploadLimit(file, kind);

    const config: AxiosRequestConfig = { ...MULTIPART };

    if (opts?.onProgress) {
        const cb = opts.onProgress;
        config.onUploadProgress = (ev: AxiosProgressEvent) => {
            if (!ev.total) return;
            const pct = Math.min(100, Math.round((ev.loaded / ev.total) * 100));
            cb(pct);
        };
    }

    if (opts?.signal) {
        config.signal = opts.signal;
    }

    return config;
}

export const fileUploadApi = {
    // ── Generic uploads (admin-only on media-gateway) ─────────────────────

    uploadImage(file: File, opts?: UploadOptions) {
        return api.post<ImageResponse>(
            '/file-upload/image/upload',
            toForm(file),
            uploadConfig(file, 'image', opts),
        );
    },

    uploadVideo(file: File, opts?: UploadOptions) {
        return api.post<VideoResponse>(
            '/file-upload/video/upload',
            toForm(file),
            uploadConfig(file, 'video', opts),
        );
    },

    uploadDocument(file: File, opts?: UploadOptions) {
        return api.post<DocumentResponse>(
            '/file-upload/document/upload',
            toForm(file),
            uploadConfig(file, 'document', opts),
        );
    },

    // ── Image uploads by target (hosted on owning gateways) ───────────────

    uploadAvatar(file: File | Blob, userId: string, opts?: UploadOptions) {
        return api.post<ImageResponse>(
            `/auth/users/${userId}/avatar`,
            toForm(file),
            uploadConfig(file, 'avatar', opts),
        );
    },

    uploadDeviceImage(file: File, ownerId: string, opts?: UploadOptions) {
        return api.post<ImageResponse>(
            `/devices/${ownerId}/images`,
            toForm(file),
            uploadConfig(file, 'image', opts),
        );
    },

    uploadArticleImage(file: File, ownerId: string, opts?: UploadOptions) {
        return api.post<ImageResponse>(
            `/articles/${ownerId}/images`,
            toForm(file),
            uploadConfig(file, 'image', opts),
        );
    },

    uploadRepairRequestImage(file: File, ownerId: string, opts?: UploadOptions) {
        return api.post<ImageResponse>(
            `/repair-requests/${ownerId}/images`,
            toForm(file),
            uploadConfig(file, 'image', opts),
        );
    },

    uploadReviewImage(file: File, ownerId: string, opts?: UploadOptions) {
        return api.post<ImageResponse>(
            `/reviews/${ownerId}/images`,
            toForm(file),
            uploadConfig(file, 'image', opts),
        );
    },

    uploadDevicePartImage(file: File, ownerId: string, opts?: UploadOptions) {
        return api.post<ImageResponse>(
            `/parts/${ownerId}/images`,
            toForm(file),
            uploadConfig(file, 'image', opts),
        );
    },

    uploadBrokenPartImage(file: File, ownerId: string, opts?: UploadOptions) {
        return api.post<ImageResponse>(
            `/repair-requests/broken-parts/${ownerId}/images`,
            toForm(file),
            uploadConfig(file, 'image', opts),
        );
    },

    // ── Document uploads ──────────────────────────────────────────────────

    uploadBrokenPartDocument(file: File, ownerId: string, opts?: UploadOptions) {
        return api.post<DocumentResponse>(
            `/repair-requests/broken-parts/${ownerId}/documents`,
            toForm(file),
            uploadConfig(file, 'document', opts),
        );
    },

    uploadRepairRequestDocument(file: File, ownerId: string, opts?: UploadOptions) {
        return api.post<DocumentResponse>(
            `/repair-requests/${ownerId}/documents`,
            toForm(file),
            uploadConfig(file, 'document', opts),
        );
    },

    deleteDocument(documentId: string) {
        return api.delete(`/repair-requests/documents/${documentId}`);
    },

    getAttachedDocuments(ownerType: string, ownerId: string) {
        return api.get<{ documents: DocumentAttachment[] }>('/file-upload/document/attached', {
            params: { ownerType, ownerId },
        });
    },

    // ── Video uploads by target ───────────────────────────────────────────

    uploadRepairRequestVideo(file: File, ownerId: string, opts?: UploadOptions) {
        return api.post<VideoResponse>(
            `/repair-requests/${ownerId}/videos`,
            toForm(file),
            uploadConfig(file, 'video', opts),
        );
    },

    uploadReviewVideo(file: File, ownerId: string, opts?: UploadOptions) {
        return api.post<VideoResponse>(
            `/reviews/${ownerId}/videos`,
            toForm(file),
            uploadConfig(file, 'video', opts),
        );
    },

    uploadDeviceVideo(file: File, ownerId: string, opts?: UploadOptions) {
        return api.post<VideoResponse>(
            `/devices/${ownerId}/videos`,
            toForm(file),
            uploadConfig(file, 'video', opts),
        );
    },

    uploadArticleVideo(file: File, ownerId: string, opts?: UploadOptions) {
        return api.post<VideoResponse>(
            `/articles/${ownerId}/videos`,
            toForm(file),
            uploadConfig(file, 'video', opts),
        );
    },

    // ── Attach / detach / query ───────────────────────────────────────────

    attachImage(imageId: string, ownerType: string, ownerId: string) {
        return api.post<ImageResponse>(`/file-upload/image/attach/${imageId}`, { ownerType, ownerId });
    },

    unattachImage(imageId: string) {
        return api.put(`/file-upload/image/unattach/${imageId}`);
    },

    deleteImage(imageId: string) {
        return api.delete(`/file-upload/image/delete/${imageId}`);
    },

    getAttachedImages(ownerType: string, ownerId: string, silent?: boolean) {
        return api.get<{ images: IImageAttachment[] }>('/file-upload/image/attached', {
            params: { ownerType, ownerId },
            ...(silent ? { _silent: true } : {}),
        } as any);
    },

    attachVideo(videoId: string, ownerType: string, ownerId: string) {
        return api.post(`/file-upload/video/attach/${videoId}`, { ownerType, ownerId });
    },

    unattachVideo(videoId: string) {
        return api.put(`/file-upload/video/unattach/${videoId}`);
    },

    deleteVideo(videoId: string) {
        return api.delete(`/file-upload/video/delete/${videoId}`);
    },

    getAttachedVideos(ownerType: string, ownerId: string, silent?: boolean) {
        return api.get<{ videos: any[] }>('/file-upload/video/attached', {
            params: { ownerType, ownerId },
            ...(silent ? { _silent: true } : {}),
        } as any);
    },
};

// Re-export validation types so consumers can catch/identify validation failures.
export { UploadValidationError, UPLOAD_LIMITS } from './upload-limits';
export type { UploadKind } from './upload-limits';
