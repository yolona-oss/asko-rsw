import { Controller, Param, Post, UseInterceptors } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ImageTypeEnum, UPLOAD_LIMITS } from '@asko/shared';
import { Permissions, Permission } from '@asko/authorization';
import {
    FileClientService,
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
} from '@asko/gateway-common';
import { ImageResponseDto } from 'common/dto/responses';

const { maxBytes: IMAGE_MAX_SIZE, mime: IMAGE_MIME } = UPLOAD_LIMITS.image;

@ApiTags('Article uploads')
@Controller('articles')
export class ArticleImageUploadController {
    constructor(private readonly fileService: FileClientService) {}

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Permissions(Permission.ARTICLE_UPLOAD)
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
