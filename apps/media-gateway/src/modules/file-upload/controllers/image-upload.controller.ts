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
import { FileClientService } from 'modules/file-client/file-client.service';
import {
    ADMIN_ROLES,
    AttachImageDto,
    CreateImageFromUrlDto,
    ImageTypeEnum,
} from '@asko/shared';
import {
    RequiredRoles,
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

const GENERIC_IMAGE_MAX_SIZE = 10 * 1024 * 1024;
const GENERIC_IMAGE_MIME = /(jpg|jpeg|png|webp)$/;

@ApiTags('File Upload')
@Controller('file-upload/image')
export class ImageUploadController {
    constructor(
        private readonly fileService: FileClientService,
    ) {}

    @ApiCreatedResponse({ type: ImageResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post('upload')
    @UseInterceptors(new StreamingUploadInterceptor(GENERIC_IMAGE_MAX_SIZE))
    async upload(
        @StreamingFile() upload: StreamingUploadPayload,
    ) {
        assertMime(upload.mimeType, GENERIC_IMAGE_MIME);
        return this.fileService.upload(
            upload.stream, upload.filename, upload.mimeType,
            { maxBytes: GENERIC_IMAGE_MAX_SIZE },
            upload.fields.alt,
        );
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Delete('delete/:imageId')
    async remove(@Param('imageId') imageId: string) {
        return this.fileService.remove(imageId);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Put('unattach/:imageId')
    async unattach(@Param('imageId') imageId: string) {
        return this.fileService.unattachImage(imageId);
    }

    @ApiCreatedResponse({ type: ImageResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
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
    @RequiredRoles(...ADMIN_ROLES)
    @Post('from-url')
    async createFromUrl(@Body() dto: CreateImageFromUrlDto) {
        return this.fileService.createFromUrl(dto.url, dto.ownerType, dto.ownerId);
    }
}
