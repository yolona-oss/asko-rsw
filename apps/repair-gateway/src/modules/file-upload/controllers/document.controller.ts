import {
    Controller,
    Delete,
    Param,
    Post,
    UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppErrors, ImageTypeEnum, JwtPayload } from '@asko/shared';
import {
    JwtAuthUser,
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
    isAdmin,
} from '@asko/gateway-common';
import { RepairFileClientService } from 'modules/file-client/file-client.service';
import { RepairAccessService } from 'modules/repair-client/repair-access.service';
import { EmptyResponseDto } from 'common/dto/responses';

const DOCUMENT_MIME_REGEX = /(pdf|jpeg|jpg|png|webp|msword|wordprocessingml\.document|ms-excel|spreadsheetml\.sheet|plain|csv)$/i;
const DOCUMENT_MAX_SIZE = 20 * 1024 * 1024;

@ApiTags('Repair uploads')
@Controller()
export class RepairDocumentUploadController {
    constructor(
        private readonly fileService: RepairFileClientService,
        private readonly repairAccess: RepairAccessService,
    ) {}

    @ApiCreatedResponse()
    @Post('repair-requests/:id/documents')
    @UseInterceptors(new StreamingUploadInterceptor(DOCUMENT_MAX_SIZE))
    async uploadRepairRequestDocument(
        @JwtAuthUser() user: JwtPayload,
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        await this.repairAccess.assertRepairRequestParticipant(user, id);
        assertMime(upload.mimeType, DOCUMENT_MIME_REGEX);
        return this.fileService.uploadRepairRequestDocument(
            upload.stream, upload.filename, upload.mimeType, id,
            { maxBytes: DOCUMENT_MAX_SIZE }, user.sub,
        );
    }

    @ApiCreatedResponse()
    @Post('repair-requests/broken-parts/:partId/documents')
    @UseInterceptors(new StreamingUploadInterceptor(DOCUMENT_MAX_SIZE))
    async uploadBrokenPartDocument(
        @JwtAuthUser() user: JwtPayload,
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('partId') partId: string,
    ) {
        await this.repairAccess.assertBrokenPartAccess(user, partId);
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
            await this.repairAccess.assertRepairRequestParticipant(user, doc.ownerId);
        } else if (doc.ownerType === ImageTypeEnum.BrokenPart) {
            await this.repairAccess.assertBrokenPartAccess(user, doc.ownerId);
        } else {
            throw AppErrors.forbidden('Нет прав на удаление документа');
        }

        return this.fileService.deleteDocument(documentId);
    }
}
