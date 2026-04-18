import { Controller, Param, Post, UseInterceptors } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ADMIN_ROLES, ImageTypeEnum, UPLOAD_LIMITS } from '@asko/shared';
import {
    RequiredRoles,
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
} from '@asko/gateway-common';
import { ContentFileClientService } from 'modules/file-client/file-client.service';
import { ImageResponseDto } from 'common/dto/responses';

const { maxBytes: IMAGE_MAX_SIZE, mime: IMAGE_MIME } = UPLOAD_LIMITS.image;

@ApiTags('Article uploads')
@Controller('articles')
export class ArticleImageUploadController {
    constructor(private readonly fileService: ContentFileClientService) {}

    @ApiCreatedResponse({ type: ImageResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post(':id/images')
    @UseInterceptors(new StreamingUploadInterceptor(IMAGE_MAX_SIZE))
    async uploadArticleImage(
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        assertMime(upload.mimeType, IMAGE_MIME);
        const res = await this.fileService.uploadFile(
            upload.stream, upload.filename, upload.mimeType,
            { maxBytes: IMAGE_MAX_SIZE },
            { ownerType: ImageTypeEnum.Article, ownerId: id },
        );
        return { image: res.image };
    }
}
