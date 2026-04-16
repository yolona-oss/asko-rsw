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

/**
 * Metadata accompanying a streaming upload. All fields optional because
 * different call-sites fill different subsets (images don't need visibility,
 * documents need all of it, etc.).
 */
export interface StreamUploadMeta {
    originalname: string;
    mimetype: string;
    visibility?: string;
    creatorId?: string;
    conversationId?: string;
    alt?: string;
}

export interface StorageProvider {
    uploadImage(file: Express.Multer.File, folder?: string): Promise<CloudinaryUploadResult>;
    uploadImageBuffer(buffer: Buffer, filename: string, folder?: string): Promise<CloudinaryUploadResult>;
    uploadStream(stream: NodeJS.ReadableStream, mimeType: string): Promise<CloudinaryUploadResult | undefined>;
    uploadImageStream(stream: NodeJS.ReadableStream, meta: StreamUploadMeta, folder?: string): Promise<CloudinaryUploadResult>;
    deleteImage(id: string): Promise<void>;
    deleteImages(ids: string[]): Promise<void>;
    generateThumbnail(url: string, width: number, height: number): Promise<string>;
    generateMultipleSizes(url: string): Promise<{ thumbnail: string; medium: string; large: string }>;
    generateSizedUrl(url: string, width: number, height: number, fit: 'cover' | 'inside'): string;

    uploadVideo(file: Express.Multer.File, folder?: string): Promise<VideoUploadResult>;
    uploadVideoStream(stream: NodeJS.ReadableStream, meta: StreamUploadMeta, folder?: string): Promise<VideoUploadResult>;
    deleteVideo(id: string): Promise<void>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
