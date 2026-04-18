import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
    AttachImageDto,
    CreateImageFromUrlDto,
    ImageTypeEnum,
    UPLOAD_LIMITS,
} from '@asko/shared';
import { Permissions, Permission } from '@asko/authorization';
import {
    FileClientService,
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
} from '@asko/gateway-common';
import {
    ImageResponseDto,
    EmptyResponseDto,
    ImageListResponseDto,
} from 'common/dto/responses';

const { maxBytes: GENERIC_IMAGE_MAX_SIZE, mime: GENERIC_IMAGE_MIME } = UPLOAD_LIMITS.image;

@ApiTags('File Upload')
@Controller('file-upload/image')
export class ImageUploadController {
    constructor(
        private readonly fileService: FileClientService,
    ) {}

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Permissions(Permission.FILE_ADMIN_MANAGE)
    @Post('upload')
    @UseInterceptors(new StreamingUploadInterceptor(GENERIC_IMAGE_MAX_SIZE))
    async upload(
        @StreamingFile() upload: StreamingUploadPayload,
    ) {
        assertMime(upload.mimeType, GENERIC_IMAGE_MIME);
        const res = await this.fileService.uploadFile(
            upload.stream, upload.filename, upload.mimeType,
            { maxBytes: GENERIC_IMAGE_MAX_SIZE },
            { alt: upload.fields.alt },
        );
        return { image: res.image };
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Permissions(Permission.FILE_ADMIN_MANAGE)
    @Delete('delete/:imageId')
    async remove(@Param('imageId') imageId: string) {
        return this.fileService.remove(imageId);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Permissions(Permission.FILE_ADMIN_MANAGE)
    @Put('unattach/:imageId')
    async unattach(@Param('imageId') imageId: string) {
        return this.fileService.unattachImage(imageId);
    }

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Permissions(Permission.FILE_ADMIN_MANAGE)
    @Post('attach/:imageId')
    async attach(
        @Param('imageId') imageId: string,
        @Body() dto: AttachImageDto,
    ) {
        return this.fileService.attachImage(imageId, {
            ownerType: dto.ownerType as ImageTypeEnum,
            ownerId: dto.ownerId,
        });
    }

    @ApiOkResponse({ type: ImageListResponseDto })
    @Get('attached')
    async listAttached(
        @Query('ownerType') ownerType: ImageTypeEnum,
        @Query('ownerId') ownerId: string,
    ) {
        return this.fileService.findAttachedImages(ownerType, ownerId);
    }

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Permissions(Permission.FILE_ADMIN_MANAGE)
    @Post('from-url')
    async createFromUrl(@Body() dto: CreateImageFromUrlDto) {
        return this.fileService.createFromUrl(dto.url, dto.ownerType, dto.ownerId);
    }
}
