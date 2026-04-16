import { Controller, Param, Post, UseInterceptors } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ADMIN_ROLES } from '@asko/shared';
import {
    RequiredRoles,
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
} from '@asko/gateway-common';
import { ContentFileClientService } from 'modules/file-client/file-client.service';
import { ImageResponseDto } from 'common/dto/responses';

const IMAGE_MAX_SIZE = 10 * 1024 * 1024;
const IMAGE_MIME = /(jpg|jpeg|png|webp)$/;

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
        return this.fileService.uploadArticleImage(
            upload.stream, upload.filename, upload.mimeType, id,
            { maxBytes: IMAGE_MAX_SIZE },
        );
    }
}
