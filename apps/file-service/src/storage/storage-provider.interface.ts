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

export interface StorageProvider {
    uploadImage(file: Express.Multer.File, folder?: string): Promise<CloudinaryUploadResult>;
    uploadImageBuffer(buffer: Buffer, filename: string, folder?: string): Promise<CloudinaryUploadResult>;
    uploadStream(stream: NodeJS.ReadableStream, mimeType: string): Promise<CloudinaryUploadResult | undefined>;
    deleteImage(id: string): Promise<void>;
    deleteImages(ids: string[]): Promise<void>;
    generateThumbnail(url: string, width: number, height: number): Promise<string>;
    generateMultipleSizes(url: string): Promise<{ thumbnail: string; medium: string; large: string }>;
    generateSizedUrl(url: string, width: number, height: number, fit: 'cover' | 'inside'): string;

    uploadVideo(file: Express.Multer.File, folder?: string): Promise<VideoUploadResult>;
    deleteVideo(id: string): Promise<void>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
