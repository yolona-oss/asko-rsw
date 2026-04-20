import {
    Controller,
    Delete,
    Param,
    Post,
    UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppErrors, FileVisibility, ImageTypeEnum, JwtPayload, UPLOAD_LIMITS, msg } from '@asko/shared';
import { CheckPolicy, isAdmin } from '@asko/authorization';
import {
    JwtAuthUser,
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
} from '@asko/gateway-common';
import { RepairFileClientService } from '../services/repair-file-client.service';
import { RepairParticipantPolicy } from '../policies/repair-participant.policy';
import { BrokenPartAccessPolicy } from '../policies/broken-part-access.policy';
import { EmptyResponseDto, ImageResponseDto, VideoResponseDto } from 'common/dto/responses';

const { maxBytes: IMAGE_MAX_SIZE, mime: IMAGE_MIME } = UPLOAD_LIMITS.image;
const { maxBytes: VIDEO_MAX_SIZE, mime: VIDEO_MIME } = UPLOAD_LIMITS.video;
const { maxBytes: DOCUMENT_MAX_SIZE, mime: DOCUMENT_MIME_REGEX } = UPLOAD_LIMITS.document;

@ApiTags('Repair uploads')
@Controller()
export class RepairUploadController {
    constructor(
        private readonly fileService: RepairFileClientService,
        private readonly repairParticipantPolicy: RepairParticipantPolicy,
        private readonly brokenPartAccessPolicy: BrokenPartAccessPolicy,
    ) {}

    // ── Repair-request images / videos / documents ──

    @ApiCreatedResponse({ type: ImageResponseDto })
    @CheckPolicy(RepairParticipantPolicy)
    @Post('repair-requests/:id/images')
    @UseInterceptors(new StreamingUploadInterceptor(IMAGE_MAX_SIZE))
    async uploadRepairRequestImage(
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        assertMime(upload.mimeType, IMAGE_MIME);
        const res = await this.fileService.uploadFile(
            upload.stream, upload.filename, upload.mimeType,
            { maxBytes: IMAGE_MAX_SIZE },
            { ownerType: ImageTypeEnum.RepairRequest, ownerId: id },
        );
        return { image: res.image };
    }

    @ApiCreatedResponse({ type: VideoResponseDto })
    @CheckPolicy(RepairParticipantPolicy)
    @Post('repair-requests/:id/videos')
    @UseInterceptors(new StreamingUploadInterceptor(VIDEO_MAX_SIZE))
    async uploadRepairRequestVideo(
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        assertMime(upload.mimeType, VIDEO_MIME);
        const res = await this.fileService.uploadFile(
            upload.stream, upload.filename, upload.mimeType,
            { maxBytes: VIDEO_MAX_SIZE },
            { ownerType: ImageTypeEnum.RepairRequest, ownerId: id },
        );
        return { video: res.video };
    }

    @ApiCreatedResponse()
    @CheckPolicy(RepairParticipantPolicy)
    @Post('repair-requests/:id/documents')
    @UseInterceptors(new StreamingUploadInterceptor(DOCUMENT_MAX_SIZE))
    async uploadRepairRequestDocument(
        @JwtAuthUser() user: JwtPayload,
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        assertMime(upload.mimeType, DOCUMENT_MIME_REGEX);
        const res = await this.fileService.uploadFile(
            upload.stream, upload.filename, upload.mimeType,
            { maxBytes: DOCUMENT_MAX_SIZE },
            { ownerType: ImageTypeEnum.RepairRequest, ownerId: id, visibility: FileVisibility.ROLE_RESTRICTED, creatorId: user.sub },
        );
        return { document: res.document };
    }

    // ── Broken-part images / documents ──

    @ApiCreatedResponse({ type: ImageResponseDto })
    @CheckPolicy(BrokenPartAccessPolicy, { paramKey: 'partId' })
    @Post('repair-requests/broken-parts/:partId/images')
    @UseInterceptors(new StreamingUploadInterceptor(IMAGE_MAX_SIZE))
    async uploadBrokenPartImage(
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('partId') partId: string,
    ) {
        assertMime(upload.mimeType, IMAGE_MIME);
        const res = await this.fileService.uploadFile(
            upload.stream, upload.filename, upload.mimeType,
            { maxBytes: IMAGE_MAX_SIZE },
            { ownerType: ImageTypeEnum.BrokenPart, ownerId: partId },
        );
        return { image: res.image };
    }

    @ApiCreatedResponse()
    @CheckPolicy(BrokenPartAccessPolicy, { paramKey: 'partId' })
    @Post('repair-requests/broken-parts/:partId/documents')
    @UseInterceptors(new StreamingUploadInterceptor(DOCUMENT_MAX_SIZE))
    async uploadBrokenPartDocument(
        @JwtAuthUser() user: JwtPayload,
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('partId') partId: string,
    ) {
        assertMime(upload.mimeType, DOCUMENT_MIME_REGEX);
        const res = await this.fileService.uploadFile(
            upload.stream, upload.filename, upload.mimeType,
            { maxBytes: DOCUMENT_MAX_SIZE },
            { ownerType: ImageTypeEnum.BrokenPart, ownerId: partId, visibility: FileVisibility.ROLE_RESTRICTED, creatorId: user.sub },
        );
        return { document: res.document };
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('repair-requests/documents/:documentId')
    async deleteDocument(@JwtAuthUser() user: JwtPayload, @Param('documentId') documentId: string) {
        if (isAdmin(user)) {
            return this.fileService.deleteDocument(documentId);
        }

        const doc = await this.fileService.getDocument(documentId);
        if (!doc) throw AppErrors.notFound({ key: msg.file.documentNotFound });

        if (doc.ownerType === ImageTypeEnum.RepairRequest) {
            await this.repairParticipantPolicy.authorize({ user, params: { id: doc.ownerId }, body: undefined, query: {} });
        } else if (doc.ownerType === ImageTypeEnum.BrokenPart) {
            await this.brokenPartAccessPolicy.authorize({ user, params: { partId: doc.ownerId }, body: undefined, query: {} });
        } else {
            throw AppErrors.forbidden({ key: msg.access.noDeletePermission });
        }

        return this.fileService.deleteDocument(documentId);
    }
}
