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
import { ADMIN_ROLES, AttachVideoDto, UPLOAD_LIMITS, VideoTypeEnum } from '@asko/shared';
import {
    FileClientService,
    RequiredRoles,
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
} from '@asko/gateway-common';
import {
    VideoResponseDto,
    EmptyResponseDto,
    VideoListResponseDto,
} from 'common/dto/responses';

const { maxBytes: VIDEO_MAX_SIZE, mime: VIDEO_MIME } = UPLOAD_LIMITS.video;

@ApiTags('Video Upload')
@Controller('file-upload/video')
export class VideoUploadController {
    constructor(
        private readonly fileService: FileClientService,
    ) {}

    @ApiCreatedResponse({ type: VideoResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post('upload')
    @UseInterceptors(new StreamingUploadInterceptor(VIDEO_MAX_SIZE))
    async upload(@StreamingFile() upload: StreamingUploadPayload) {
        assertMime(upload.mimeType, VIDEO_MIME);
        const res = await this.fileService.uploadFile(
            upload.stream, upload.filename, upload.mimeType,
            { maxBytes: VIDEO_MAX_SIZE },
        );
        return { video: res.video };
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Delete('delete/:videoId')
    async remove(@Param('videoId') videoId: string) {
        return this.fileService.removeVideo(videoId);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Put('unattach/:videoId')
    async unattach(@Param('videoId') videoId: string) {
        return this.fileService.unattachVideo(videoId);
    }

    @ApiCreatedResponse({ type: VideoResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post('attach/:videoId')
    async attach(
        @Param('videoId') videoId: string,
        @Body() dto: AttachVideoDto,
    ) {
        return this.fileService.attachVideo(videoId, {
            ownerType: dto.ownerType,
            ownerId: dto.ownerId,
        });
    }

    @ApiOkResponse({ type: VideoListResponseDto })
    @Get('attached')
    async listAttached(
        @Query('ownerType') ownerType: VideoTypeEnum,
        @Query('ownerId') ownerId: string,
    ) {
        return this.fileService.findAttachedVideos(ownerType, ownerId);
    }
}
