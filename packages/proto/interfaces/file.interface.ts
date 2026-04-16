import { Observable } from 'rxjs';

// ─── Streaming upload payload ──────────────────────────────────────────

/**
 * Sent once as the first chunk of every streaming upload RPC.
 * Carries the metadata the server needs before file bytes arrive.
 */
export interface UploadStart {
    originalname: string;
    mimetype: string;
    ownerId: string;
    visibility?: string;
    creatorId?: string;
    conversationId?: string;
    alt?: string;
}

/**
 * Client-streaming payload for all file upload RPCs. First message
 * carries `start`; subsequent messages carry `data`.
 */
export interface UploadChunk {
    start?: UploadStart;
    data?: Uint8Array;
}

// ─── Requests ──────────────────────────────────────────────────────────

export interface CreateFromUrlRequest {
    url: string;
    ownerType: string;
    ownerId: string;
    order: number;
}

export interface ImageIdRequest {
    id: string;
}

export interface AttachImageRequest {
    imageId: string;
    ownerType: string;
    ownerId: string;
}

export interface FindAttachedRequest {
    ownerType: string;
    ownerId: string;
}

export interface CountAttachedRequest {
    ownerId: string;
    ownerType: string;
}

export interface ReorderItem {
    id: string;
    order: number;
}

export interface ReorderImagesRequest {
    ownerType: string;
    ownerId: string;
    schema: ReorderItem[];
}

export interface ReorderByIdsRequest {
    ownerType: string;
    ownerId: string;
    imageIds: string[];
}

// ─── Responses ─────────────────────────────────────────────────────────

export interface EmptyFileResponse {}

export interface ImageRecord {
    id: string;
    imageJson: string;
    alt: string;
    order: number;
    ownerType: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    visibility?: string;
    creatorId?: string;
    conversationId?: string;
}

export interface ImageResponse {
    image: ImageRecord;
}

export interface ImageListResponse {
    images: ImageRecord[];
}

export interface CountResponse {
    count: number;
}

// ─── Video Requests ───────────────────────────────────────────────────

export interface VideoIdRequest {
    id: string;
}

export interface AttachVideoRequest {
    videoId: string;
    ownerType: string;
    ownerId: string;
}

// ─── Video Responses ──────────────────────────────────────────────────

export interface VideoRecord {
    id: string;
    videoJson: string;
    order: number;
    ownerType: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    visibility?: string;
    creatorId?: string;
    conversationId?: string;
}

export interface VideoResponse {
    video: VideoRecord;
}

export interface VideoListResponse {
    videos: VideoRecord[];
}

// ─── Access control ──────────────────────────────────────────────────

export interface GetFileAccessRequest {
    id: string;
    type: string;
}

export interface FileAccessResponse {
    id: string;
    visibility?: string;
    creatorId?: string;
    conversationId?: string;
    storageUrl: string;
    publicId: string;
}

// ─── Documents ────────────────────────────────────────────────────────

export interface DocumentIdRequest {
    id: string;
}

export interface DocumentRecord {
    id: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    ownerType: string;
    ownerId: string;
    storageUrl: string;
    publicId: string;
    createdAt: string;
}

export interface DocumentResponse {
    document: DocumentRecord;
}

export interface DocumentListResponse {
    documents: DocumentRecord[];
}

// ─── gRPC Service Interface ────────────────────────────────────────────

export interface FileServiceClient {
    upload(stream: Observable<UploadChunk>): Observable<ImageResponse>;
    uploadUserAvatar(stream: Observable<UploadChunk>): Observable<ImageResponse>;
    uploadDeviceImage(stream: Observable<UploadChunk>): Observable<ImageResponse>;
    uploadArticleImage(stream: Observable<UploadChunk>): Observable<ImageResponse>;
    uploadRepairRequestImage(stream: Observable<UploadChunk>): Observable<ImageResponse>;
    uploadReviewImage(stream: Observable<UploadChunk>): Observable<ImageResponse>;
    uploadDevicePartImage(stream: Observable<UploadChunk>): Observable<ImageResponse>;
    uploadBrokenPartImage(stream: Observable<UploadChunk>): Observable<ImageResponse>;
    createFromUrl(request: CreateFromUrlRequest): Observable<ImageResponse>;

    remove(request: ImageIdRequest): Observable<EmptyFileResponse>;
    unattachImage(request: ImageIdRequest): Observable<EmptyFileResponse>;
    attachImage(request: AttachImageRequest): Observable<ImageResponse>;
    findAttachedImages(request: FindAttachedRequest): Observable<ImageListResponse>;
    countAttached(request: CountAttachedRequest): Observable<CountResponse>;
    deleteByOwner(request: FindAttachedRequest): Observable<CountResponse>;

    reorderImages(request: ReorderImagesRequest): Observable<EmptyFileResponse>;
    reorderByIds(request: ReorderByIdsRequest): Observable<ImageListResponse>;

    // Video operations
    uploadVideo(stream: Observable<UploadChunk>): Observable<VideoResponse>;
    uploadRepairRequestVideo(stream: Observable<UploadChunk>): Observable<VideoResponse>;
    uploadReviewVideo(stream: Observable<UploadChunk>): Observable<VideoResponse>;
    uploadDeviceVideo(stream: Observable<UploadChunk>): Observable<VideoResponse>;
    uploadArticleVideo(stream: Observable<UploadChunk>): Observable<VideoResponse>;
    removeVideo(request: VideoIdRequest): Observable<EmptyFileResponse>;
    findAttachedVideos(request: FindAttachedRequest): Observable<VideoListResponse>;
    attachVideo(request: AttachVideoRequest): Observable<VideoResponse>;
    unattachVideo(request: VideoIdRequest): Observable<EmptyFileResponse>;

    // Document operations
    uploadBrokenPartDocument(stream: Observable<UploadChunk>): Observable<DocumentResponse>;
    uploadRepairRequestDocument(stream: Observable<UploadChunk>): Observable<DocumentResponse>;
    uploadDocument(stream: Observable<UploadChunk>): Observable<DocumentResponse>;
    getDocument(request: DocumentIdRequest): Observable<DocumentResponse>;
    getDocumentsByOwner(request: FindAttachedRequest): Observable<DocumentListResponse>;
    deleteDocument(request: DocumentIdRequest): Observable<EmptyFileResponse>;

    // Access control
    getFileAccess(request: GetFileAccessRequest): Observable<FileAccessResponse>;
}
