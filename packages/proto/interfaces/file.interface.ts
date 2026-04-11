import { Observable } from 'rxjs';

// ─── Common ────────────────────────────────────────────────────────────

export interface FileData {
    buffer: Uint8Array;
    originalname: string;
    mimetype: string;
}

// ─── Requests ──────────────────────────────────────────────────────────

export interface UploadFileRequest {
    file: FileData;
    alt: string;
    visibility?: string;
    creatorId?: string;
    conversationId?: string;
}

export interface UploadWithOwnerRequest {
    file: FileData;
    ownerId: string;
    visibility?: string;
    creatorId?: string;
    conversationId?: string;
}

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

export interface UploadVideoRequest {
    file: FileData;
    visibility?: string;
    creatorId?: string;
    conversationId?: string;
}

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

export interface UploadDocumentRequest {
    file: FileData;
    ownerType: string;
    ownerId: string;
    visibility?: string;
    creatorId?: string;
    conversationId?: string;
}

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
    upload(request: UploadFileRequest): Observable<ImageResponse>;
    streamUpload(request: UploadFileRequest): Observable<ImageResponse>;
    uploadUserAvatar(request: UploadWithOwnerRequest): Observable<ImageResponse>;
    uploadDeviceCatalogImage(request: UploadWithOwnerRequest): Observable<ImageResponse>;
    uploadDeviceImage(request: UploadWithOwnerRequest): Observable<ImageResponse>;
    uploadArticleImage(request: UploadWithOwnerRequest): Observable<ImageResponse>;
    uploadRepairRequestImage(request: UploadWithOwnerRequest): Observable<ImageResponse>;
    uploadReviewImage(request: UploadWithOwnerRequest): Observable<ImageResponse>;
    uploadDevicePartImage(request: UploadWithOwnerRequest): Observable<ImageResponse>;
    uploadBrokenPartImage(request: UploadWithOwnerRequest): Observable<ImageResponse>;
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
    uploadVideo(request: UploadVideoRequest): Observable<VideoResponse>;
    uploadRepairRequestVideo(request: UploadWithOwnerRequest): Observable<VideoResponse>;
    uploadReviewVideo(request: UploadWithOwnerRequest): Observable<VideoResponse>;
    uploadDeviceVideo(request: UploadWithOwnerRequest): Observable<VideoResponse>;
    uploadArticleVideo(request: UploadWithOwnerRequest): Observable<VideoResponse>;
    removeVideo(request: VideoIdRequest): Observable<EmptyFileResponse>;
    findAttachedVideos(request: FindAttachedRequest): Observable<VideoListResponse>;
    attachVideo(request: AttachVideoRequest): Observable<VideoResponse>;
    unattachVideo(request: VideoIdRequest): Observable<EmptyFileResponse>;

    // Document operations
    uploadBrokenPartDocument(request: UploadWithOwnerRequest): Observable<DocumentResponse>;
    uploadRepairRequestDocument(request: UploadWithOwnerRequest): Observable<DocumentResponse>;
    uploadDocument(request: UploadDocumentRequest): Observable<DocumentResponse>;
    getDocument(request: DocumentIdRequest): Observable<DocumentResponse>;
    getDocumentsByOwner(request: FindAttachedRequest): Observable<DocumentListResponse>;
    deleteDocument(request: DocumentIdRequest): Observable<EmptyFileResponse>;

    // Access control
    getFileAccess(request: GetFileAccessRequest): Observable<FileAccessResponse>;
}
