import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Query,
    UploadedFile,
    UseInterceptors,
    ParseFilePipe,
    FileTypeValidator,
    MaxFileSizeValidator,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileClientService } from 'modules/file-client/file-client.service';
import { EmptyResponseDto } from 'common/dto/responses';

const DOCUMENT_MIME_REGEX = /(pdf|jpeg|jpg|png|webp|msword|wordprocessingml\.document|ms-excel|spreadsheetml\.sheet|plain|csv)$/i;
const DOCUMENT_MAX_SIZE = 20 * 1024 * 1024;

@ApiTags('File Upload')
@Controller('file-upload/document')
export class DocumentUploadController {
    constructor(private readonly fileService: FileClientService) {}

    @ApiCreatedResponse()
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadGeneric(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: DOCUMENT_MAX_SIZE }),
                    new FileTypeValidator({ fileType: DOCUMENT_MIME_REGEX }),
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        return this.fileService.uploadDocument(file, '', '');
    }

    @ApiCreatedResponse()
    @Post('upload/broken-part/:ownerId')
    @UseInterceptors(FileInterceptor('file'))
    async uploadBrokenPartDocument(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: DOCUMENT_MAX_SIZE }),
                    new FileTypeValidator({ fileType: DOCUMENT_MIME_REGEX }),
                ],
            }),
        )
        file: Express.Multer.File,
        @Param('ownerId') ownerId: string,
    ) {
        return this.fileService.uploadBrokenPartDocument(file, ownerId);
    }

    @ApiCreatedResponse()
    @Post('upload/repair-request/:ownerId')
    @UseInterceptors(FileInterceptor('file'))
    async uploadRepairRequestDocument(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: DOCUMENT_MAX_SIZE }),
                    new FileTypeValidator({ fileType: DOCUMENT_MIME_REGEX }),
                ],
            }),
        )
        file: Express.Multer.File,
        @Param('ownerId') ownerId: string,
    ) {
        return this.fileService.uploadRepairRequestDocument(file, ownerId);
    }

    @ApiOkResponse()
    @Get('attached')
    async listAttached(
        @Query('ownerType') ownerType: string,
        @Query('ownerId') ownerId: string,
    ) {
        return this.fileService.getDocumentsByOwner(ownerType, ownerId);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('delete/:documentId')
    async remove(@Param('documentId') documentId: string) {
        return this.fileService.deleteDocument(documentId);
    }
}
