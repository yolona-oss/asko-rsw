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
import { VideoResponseDto } from 'common/dto/responses';

const { maxBytes: VIDEO_MAX_SIZE, mime: VIDEO_MIME } = UPLOAD_LIMITS.video;

@ApiTags('Article uploads')
@Controller('articles')
export class ArticleVideoUploadController {
    constructor(private readonly fileService: FileClientService) {}

    @ApiCreatedResponse({ type: VideoResponseDto })
    @Permissions(Permission.ARTICLE_UPLOAD)
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
