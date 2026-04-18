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
import { AttachVideoDto, UPLOAD_LIMITS, VideoTypeEnum } from '@asko/shared';
import { Permissions, Permission } from '@asko/authorization';
import {
    FileClientService,
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
    @Permissions(Permission.FILE_ADMIN_MANAGE)
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
    @Permissions(Permission.FILE_ADMIN_MANAGE)
    @Delete('delete/:videoId')
    async remove(@Param('videoId') videoId: string) {
        return this.fileService.removeVideo(videoId);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Permissions(Permission.FILE_ADMIN_MANAGE)
    @Put('unattach/:videoId')
    async unattach(@Param('videoId') videoId: string) {
        return this.fileService.unattachVideo(videoId);
    }

    @ApiCreatedResponse({ type: VideoResponseDto })
    @Permissions(Permission.FILE_ADMIN_MANAGE)
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
