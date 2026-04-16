import {
    Controller,
    Param,
    Post,
    UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ADMIN_ROLES, JwtPayload } from '@asko/shared';
import {
    JwtAuthUser,
    RequiredRoles,
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
} from '@asko/gateway-common';
import { RepairFileClientService } from 'modules/file-client/file-client.service';
import { RepairAccessService } from 'modules/repair-client/repair-access.service';
import { VideoResponseDto } from 'common/dto/responses';

const VIDEO_MAX_SIZE = 100 * 1024 * 1024;
const VIDEO_MIME = /(mp4|webm|mov|quicktime)$/;

@ApiTags('Repair uploads')
@Controller()
export class RepairVideoUploadController {
    constructor(
        private readonly fileService: RepairFileClientService,
        private readonly repairAccess: RepairAccessService,
    ) {}

    @ApiCreatedResponse({ type: VideoResponseDto })
    @Post('repair-requests/:id/videos')
    @UseInterceptors(new StreamingUploadInterceptor(VIDEO_MAX_SIZE))
    async uploadRepairRequestVideo(
        @JwtAuthUser() user: JwtPayload,
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        await this.repairAccess.assertRepairRequestParticipant(user, id);
        assertMime(upload.mimeType, VIDEO_MIME);
        return this.fileService.uploadRepairRequestVideo(
            upload.stream, upload.filename, upload.mimeType, id,
            { maxBytes: VIDEO_MAX_SIZE },
        );
    }

    @ApiCreatedResponse({ type: VideoResponseDto })
    @Post('reviews/:id/videos')
    @UseInterceptors(new StreamingUploadInterceptor(VIDEO_MAX_SIZE))
    async uploadReviewVideo(
        @JwtAuthUser() user: JwtPayload,
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        await this.repairAccess.assertReviewOwner(user, id);
        assertMime(upload.mimeType, VIDEO_MIME);
        return this.fileService.uploadReviewVideo(
            upload.stream, upload.filename, upload.mimeType, id,
            { maxBytes: VIDEO_MAX_SIZE },
        );
    }

    @ApiCreatedResponse({ type: VideoResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post('devices/:id/videos')
    @UseInterceptors(new StreamingUploadInterceptor(VIDEO_MAX_SIZE))
    async uploadDeviceVideo(
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        assertMime(upload.mimeType, VIDEO_MIME);
        return this.fileService.uploadDeviceVideo(
            upload.stream, upload.filename, upload.mimeType, id,
            { maxBytes: VIDEO_MAX_SIZE },
        );
    }
}
