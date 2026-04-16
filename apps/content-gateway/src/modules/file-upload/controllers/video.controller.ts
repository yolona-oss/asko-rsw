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
import { FileClientService } from 'modules/file-client/file-client.service';
import { VideoResponseDto } from 'common/dto/responses';

const VIDEO_MAX_SIZE = 100 * 1024 * 1024;
const VIDEO_MIME = /(mp4|webm|mov|quicktime)$/;

@ApiTags('Article uploads')
@Controller('articles')
export class ArticleVideoUploadController {
    constructor(private readonly fileService: FileClientService) {}

    @ApiCreatedResponse({ type: VideoResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post(':id/videos')
    @UseInterceptors(new StreamingUploadInterceptor(VIDEO_MAX_SIZE))
    async uploadArticleVideo(
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        assertMime(upload.mimeType, VIDEO_MIME);
        return this.fileService.uploadArticleVideo(
            upload.stream, upload.filename, upload.mimeType, id,
            { maxBytes: VIDEO_MAX_SIZE },
        );
    }
}
