import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from '@asko/gateway-common';
import { ImageTypeEnum } from '@asko/shared';

import type {
    FileServiceClient,
    ImageRecord,
    ImageResponse,
    ImageListResponse,
    CountResponse,
    EmptyFileResponse,
    VideoRecord,
    VideoResponse,
    VideoListResponse,
    FileAccessResponse,
    DocumentRecord,
    DocumentResponse,
    DocumentListResponse,
} from '@asko/proto';

@Injectable()
export class FileClientService implements OnModuleInit {
    private fileService!: FileServiceClient;

    constructor(
        @Inject('FILE_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.fileService = this.client.getService<FileServiceClient>('FileService');
    }

    private toFileData(file: Express.Multer.File) {
        return {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
        };
    }

    /** Parse imageJson from gRPC string to object for REST responses */
    private parseRecord(record: ImageRecord): ImageRecord & { imageJson: any } {
        try {
            return { ...record, imageJson: JSON.parse(record.imageJson) };
        } catch {
            return record as any;
        }
    }

    private parseImageResponse(res: ImageResponse) {
        return { image: this.parseRecord(res.image) };
    }

    private parseImageListResponse(res: ImageListResponse) {
        return { images: (res.images ?? []).map((r) => this.parseRecord(r)) };
    }

    // --- Upload operations ---

    async upload(file: Express.Multer.File, alt?: string) {
        const res = await grpcCall(this.fileService.upload({
            file: this.toFileData(file),
            alt: alt ?? '',
        }));
        return this.parseImageResponse(res);
    }

    async streamUpload(file: Express.Multer.File, alt?: string) {
        const res = await grpcCall(this.fileService.streamUpload({
            file: this.toFileData(file),
            alt: alt ?? '',
        }));
        return this.parseImageResponse(res);
    }

    async uploadUserAvatar(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadUserAvatar({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async uploadDeviceCatalogImage(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadDeviceCatalogImage({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async uploadDeviceImage(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadDeviceImage({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async uploadArticleImage(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadArticleImage({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async uploadRepairRequestImage(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadRepairRequestImage({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async uploadReviewImage(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadReviewImage({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async uploadDevicePartImage(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadDevicePartImage({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async uploadBrokenPartImage(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadBrokenPartImage({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    // --- URL operations ---

    async createFromUrl(url: string, ownerType?: ImageTypeEnum, ownerId?: string, order?: number) {
        const res = await grpcCall(this.fileService.createFromUrl({
            url,
            ownerType: ownerType ?? '',
            ownerId: ownerId ?? '',
            order: order ?? 0,
        }));
        return this.parseImageResponse(res);
    }

    // --- Management operations ---

    remove(id: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.remove({ id }));
    }

    unattachImage(imageId: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.unattachImage({ id: imageId }));
    }

    async attachImage(imageId: string, dto: { ownerType: ImageTypeEnum; ownerId: string }) {
        const res = await grpcCall(this.fileService.attachImage({
            imageId,
            ownerType: dto.ownerType,
            ownerId: dto.ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async findAttachedImages(ownerType: ImageTypeEnum, ownerId: string) {
        const res = await grpcCall(this.fileService.findAttachedImages({ ownerType, ownerId }));
        return this.parseImageListResponse(res);
    }

    countAttached(ownerId: string, ownerType: ImageTypeEnum): Promise<CountResponse> {
        return grpcCall(this.fileService.countAttached({ ownerId, ownerType }));
    }

    deleteByOwner(ownerType: ImageTypeEnum, ownerId: string): Promise<CountResponse> {
        return grpcCall(this.fileService.deleteByOwner({ ownerType, ownerId }));
    }

    // --- Reorder operations ---

    reorderImages(ownerType: ImageTypeEnum, ownerId: string, schema: { id: string; order: number }[]): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.reorderImages({ ownerType, ownerId, schema }));
    }

    async reorderByIds(ownerType: ImageTypeEnum, ownerId: string, imageIds: string[]) {
        const res = await grpcCall(this.fileService.reorderByIds({ ownerType, ownerId, imageIds }));
        return this.parseImageListResponse(res);
    }

    // --- Video helpers ---

    private parseVideoRecord(record: VideoRecord): VideoRecord & { videoJson: any } {
        try {
            return { ...record, videoJson: JSON.parse(record.videoJson) };
        } catch {
            return record as any;
        }
    }

    private parseVideoResponse(res: VideoResponse) {
        return { video: this.parseVideoRecord(res.video) };
    }

    private parseVideoListResponse(res: VideoListResponse) {
        return { videos: (res.videos ?? []).map((r) => this.parseVideoRecord(r)) };
    }

    // --- Video upload operations ---

    async uploadVideo(file: Express.Multer.File) {
        const res = await grpcCall(this.fileService.uploadVideo({
            file: this.toFileData(file),
        }));
        return this.parseVideoResponse(res);
    }

    async uploadRepairRequestVideo(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadRepairRequestVideo({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseVideoResponse(res);
    }

    async uploadReviewVideo(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadReviewVideo({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseVideoResponse(res);
    }

    async uploadDeviceVideo(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadDeviceVideo({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseVideoResponse(res);
    }

    async uploadArticleVideo(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadArticleVideo({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseVideoResponse(res);
    }

    // --- Video management operations ---

    removeVideo(id: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.removeVideo({ id }));
    }

    unattachVideo(videoId: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.unattachVideo({ id: videoId }));
    }

    async attachVideo(videoId: string, dto: { ownerType: string; ownerId: string }) {
        const res = await grpcCall(this.fileService.attachVideo({
            videoId,
            ownerType: dto.ownerType,
            ownerId: dto.ownerId,
        }));
        return this.parseVideoResponse(res);
    }

    async findAttachedVideos(ownerType: string, ownerId: string) {
        const res = await grpcCall(this.fileService.findAttachedVideos({ ownerType, ownerId }));
        return this.parseVideoListResponse(res);
    }

    // --- Access control ---

    getFileAccess(id: string, type: string): Promise<FileAccessResponse> {
        return grpcCall(this.fileService.getFileAccess({ id, type }));
    }

    // --- Documents ---

    private toDocumentResponse(res: DocumentResponse) {
        return { document: res.document };
    }

    private toDocumentListResponse(res: DocumentListResponse) {
        return { documents: res.documents ?? [] };
    }

    async uploadBrokenPartDocument(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadBrokenPartDocument({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.toDocumentResponse(res);
    }

    async uploadRepairRequestDocument(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadRepairRequestDocument({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.toDocumentResponse(res);
    }

    async uploadDocument(file: Express.Multer.File, ownerType: string, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadDocument({
            file: this.toFileData(file),
            ownerType,
            ownerId,
        }));
        return this.toDocumentResponse(res);
    }

    async getDocument(id: string): Promise<DocumentRecord> {
        const res = await grpcCall(this.fileService.getDocument({ id }));
        return res.document;
    }

    async getDocumentsByOwner(ownerType: string, ownerId: string) {
        const res = await grpcCall(this.fileService.getDocumentsByOwner({ ownerType, ownerId }));
        return this.toDocumentListResponse(res);
    }

    deleteDocument(id: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.deleteDocument({ id }));
    }
}
