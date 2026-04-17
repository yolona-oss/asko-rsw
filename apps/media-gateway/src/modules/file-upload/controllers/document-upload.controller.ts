import {
    Controller,
    Get,
    Post,
    Query,
    UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ADMIN_ROLES, UPLOAD_LIMITS } from '@asko/shared';
import {
    FileClientService,
    RequiredRoles,
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
} from '@asko/gateway-common';

const { maxBytes: DOCUMENT_MAX_SIZE, mime: DOCUMENT_MIME_REGEX } = UPLOAD_LIMITS.document;

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
