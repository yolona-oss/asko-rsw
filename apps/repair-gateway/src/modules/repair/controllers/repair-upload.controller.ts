import {
    Controller,
    Delete,
    Param,
    Post,
    UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppErrors, ImageTypeEnum, JwtPayload } from '@asko/shared';
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

const IMAGE_MAX_SIZE = 10 * 1024 * 1024;
const IMAGE_MIME = /(jpg|jpeg|png|webp)$/;
const VIDEO_MAX_SIZE = 100 * 1024 * 1024;
const VIDEO_MIME = /(mp4|webm|mov|quicktime)$/;
const DOCUMENT_MIME_REGEX = /(pdf|jpeg|jpg|png|webp|msword|wordprocessingml\.document|ms-excel|spreadsheetml\.sheet|plain|csv)$/i;
const DOCUMENT_MAX_SIZE = 20 * 1024 * 1024;

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
        return this.fileService.uploadRepairRequestImage(
            upload.stream, upload.filename, upload.mimeType, id,
            { maxBytes: IMAGE_MAX_SIZE },
        );
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
        return this.fileService.uploadRepairRequestVideo(
            upload.stream, upload.filename, upload.mimeType, id,
            { maxBytes: VIDEO_MAX_SIZE },
        );
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
        return this.fileService.uploadRepairRequestDocument(
            upload.stream, upload.filename, upload.mimeType, id,
            { maxBytes: DOCUMENT_MAX_SIZE }, user.sub,
        );
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
        return this.fileService.uploadBrokenPartImage(
            upload.stream, upload.filename, upload.mimeType, partId,
            { maxBytes: IMAGE_MAX_SIZE },
        );
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
        return this.fileService.uploadBrokenPartDocument(
            upload.stream, upload.filename, upload.mimeType, partId,
            { maxBytes: DOCUMENT_MAX_SIZE }, user.sub,
        );
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('repair-requests/documents/:documentId')
    async deleteDocument(@JwtAuthUser() user: JwtPayload, @Param('documentId') documentId: string) {
        if (isAdmin(user)) {
            return this.fileService.deleteDocument(documentId);
        }

        const doc = await this.fileService.getDocument(documentId);
        if (!doc) throw AppErrors.notFound('Документ не найден');

        if (doc.ownerType === ImageTypeEnum.RepairRequest) {
            await this.repairParticipantPolicy.authorize({ user, params: { id: doc.ownerId }, body: undefined, query: {} });
        } else if (doc.ownerType === ImageTypeEnum.BrokenPart) {
            await this.brokenPartAccessPolicy.authorize({ user, params: { partId: doc.ownerId }, body: undefined, query: {} });
        } else {
            throw AppErrors.forbidden('Нет прав на удаление документа');
        }

        return this.fileService.deleteDocument(documentId);
    }
}
