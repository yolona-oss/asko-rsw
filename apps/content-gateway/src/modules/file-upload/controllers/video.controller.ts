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
import { VideoResponseDto } from 'common/dto/responses';

const { maxBytes: VIDEO_MAX_SIZE, mime: VIDEO_MIME } = UPLOAD_LIMITS.video;

@ApiTags('Article uploads')
@Controller('articles')
export class ArticleVideoUploadController {
    constructor(private readonly fileService: ContentFileClientService) {}

    @ApiCreatedResponse({ type: VideoResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post(':id/videos')
    @UseInterceptors(new StreamingUploadInterceptor(VIDEO_MAX_SIZE))
    async uploadArticleVideo(
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        assertMime(upload.mimeType, VIDEO_MIME);
        const res = await this.fileService.uploadFile(
            upload.stream, upload.filename, upload.mimeType,
            { maxBytes: VIDEO_MAX_SIZE },
            { ownerType: ImageTypeEnum.Article, ownerId: id },
        );
        return { video: res.video };
    }
}
