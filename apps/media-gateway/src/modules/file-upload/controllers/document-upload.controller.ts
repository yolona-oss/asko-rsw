import {
    Controller,
    Get,
    Post,
    Query,
    UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FileClientService } from 'modules/file-client/file-client.service';
import { ADMIN_ROLES } from '@asko/shared';
import {
    RequiredRoles,
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
} from '@asko/gateway-common';

const DOCUMENT_MIME_REGEX = /(pdf|jpeg|jpg|png|webp|msword|wordprocessingml\.document|ms-excel|spreadsheetml\.sheet|plain|csv)$/i;
const DOCUMENT_MAX_SIZE = 20 * 1024 * 1024;

@ApiTags('File Upload')
@Controller('file-upload/document')
export class DocumentUploadController {
    constructor(
        private readonly fileService: FileClientService,
    ) {}

    @ApiCreatedResponse()
    @RequiredRoles(...ADMIN_ROLES)
    @Post('upload')
    @UseInterceptors(new StreamingUploadInterceptor(DOCUMENT_MAX_SIZE))
    async uploadGeneric(@StreamingFile() upload: StreamingUploadPayload) {
        assertMime(upload.mimeType, DOCUMENT_MIME_REGEX);
        return this.fileService.uploadDocument(
            upload.stream, upload.filename, upload.mimeType, '', '',
            { maxBytes: DOCUMENT_MAX_SIZE },
        );
    }

    @ApiOkResponse()
    @Get('attached')
    async listAttached(
        @Query('ownerType') ownerType: string,
        @Query('ownerId') ownerId: string,
    ) {
        return this.fileService.getDocumentsByOwner(ownerType, ownerId);
    }
}
