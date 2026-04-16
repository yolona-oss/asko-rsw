import {
    Controller,
    Param,
    Post,
    UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from '@asko/shared';
import {
    JwtAuthUser,
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
} from '@asko/gateway-common';
import { RepairFileClientService } from 'modules/repair/services/repair-file-client.service';
import { RepairAccessService } from 'modules/repair/services/repair-access.service';
import { ImageResponseDto, VideoResponseDto } from 'common/dto/responses';

const IMAGE_MAX_SIZE = 10 * 1024 * 1024;
const IMAGE_MIME = /(jpg|jpeg|png|webp)$/;
const VIDEO_MAX_SIZE = 100 * 1024 * 1024;
const VIDEO_MIME = /(mp4|webm|mov|quicktime)$/;

@ApiTags('Review uploads')
@Controller()
export class ReviewUploadController {
    constructor(
        private readonly fileService: RepairFileClientService,
        private readonly repairAccess: RepairAccessService,
    ) {}

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Post('reviews/:id/images')
    @UseInterceptors(new StreamingUploadInterceptor(IMAGE_MAX_SIZE))
    async uploadReviewImage(
        @JwtAuthUser() user: JwtPayload,
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        await this.repairAccess.assertReviewOwner(user, id);
        assertMime(upload.mimeType, IMAGE_MIME);
        return this.fileService.uploadReviewImage(
            upload.stream, upload.filename, upload.mimeType, id,
            { maxBytes: IMAGE_MAX_SIZE },
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
}
