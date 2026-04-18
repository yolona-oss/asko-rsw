export type ResourceType = 'image' | 'video' | 'raw';

export interface StorageUploadMeta {
    originalname: string;
    mimetype: string;
}

/**
 * Unified result returned by `upload()`. Superset of image, video, and
 * document metadata — entity construction picks the relevant fields.
 */
export interface StorageUploadResult {
    publicId: string;
    url: string;
    secureUrl: string;
    originalFilename: string;
    format: string;
    resourceType: string;
    // image-specific
    width?: number;
    height?: number;
    version?: number;
    signature?: string;
    // video-specific
    duration?: number;
    // common
    size?: number;
}

export interface StorageProvider {
    /** Upload a file stream. */
    upload(
        stream: NodeJS.ReadableStream,
        meta: StorageUploadMeta,
        resourceType: ResourceType,
        folder: string,
    ): Promise<StorageUploadResult>;

    /** Delete a single stored object. */
    delete(publicId: string, resourceType: ResourceType): Promise<void>;

    /** Delete multiple stored objects. */
    deleteBatch(publicIds: string[], resourceType: ResourceType): Promise<void>;

    /** Generate a URL for a resized variant (Cloudinary transforms, others return as-is). */
    generateSizedUrl(url: string, width: number, height: number, fit: 'cover' | 'inside'): string;

    /**
     * Upload a buffer to a specific storage key. Used by resize/compress
     * processors to write variants alongside the original without generating
     * new UUIDs. Returns the public URL for the key.
     */
    put(key: string, data: Buffer, contentType: string): Promise<string>;

    /**
     * Download a stored file as a readable stream. Used by resize/compress
     * processors in S3 and local modes. Cloudinary mode uses URL transforms
     * and never calls this.
     */
    download(publicId: string, resourceType: ResourceType): Promise<NodeJS.ReadableStream>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
