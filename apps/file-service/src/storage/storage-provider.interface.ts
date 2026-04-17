import { CloudinaryUploadResult } from 'services/cloudinary.service';

export interface VideoUploadResult {
    public_id: string;
    format: string;
    resource_type: string;
    url: string;
    secure_url: string;
    original_filename: string;
    duration?: number;
    size?: number;
}

export interface StreamUploadMeta {
    originalname: string;
    mimetype: string;
    visibility?: string;
    creatorId?: string;
    conversationId?: string;
    alt?: string;
}

export interface StorageProvider {
    uploadImageStream(stream: NodeJS.ReadableStream, meta: StreamUploadMeta, folder?: string): Promise<CloudinaryUploadResult>;
    deleteImage(id: string): Promise<void>;
    deleteImages(ids: string[]): Promise<void>;
    generateSizedUrl(url: string, width: number, height: number, fit: 'cover' | 'inside'): string;

    uploadVideoStream(stream: NodeJS.ReadableStream, meta: StreamUploadMeta, folder?: string): Promise<VideoUploadResult>;
    deleteVideo(id: string): Promise<void>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
