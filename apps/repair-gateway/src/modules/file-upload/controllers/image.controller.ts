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
import { FileClientService } from 'modules/file-client/file-client.service';
import { RepairAccessService } from 'modules/repair-client/repair-access.service';
import { ImageResponseDto } from 'common/dto/responses';

const IMAGE_MAX_SIZE = 10 * 1024 * 1024;
const IMAGE_MIME = /(jpg|jpeg|png|webp)$/;

@ApiTags('Repair uploads')
@Controller()
export class RepairImageUploadController {
    constructor(
        private readonly fileService: FileClientService,
        private readonly repairAccess: RepairAccessService,
    ) {}

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Post('repair-requests/:id/images')
    @UseInterceptors(new StreamingUploadInterceptor(IMAGE_MAX_SIZE))
    async uploadRepairRequestImage(
        @JwtAuthUser() user: JwtPayload,
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        await this.repairAccess.assertRepairRequestParticipant(user, id);
        assertMime(upload.mimeType, IMAGE_MIME);
        return this.fileService.uploadRepairRequestImage(
            upload.stream, upload.filename, upload.mimeType, id,
            { maxBytes: IMAGE_MAX_SIZE },
        );
    }

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

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Post('repair-requests/broken-parts/:partId/images')
    @UseInterceptors(new StreamingUploadInterceptor(IMAGE_MAX_SIZE))
    async uploadBrokenPartImage(
        @JwtAuthUser() user: JwtPayload,
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('partId') partId: string,
    ) {
        await this.repairAccess.assertBrokenPartAccess(user, partId);
        assertMime(upload.mimeType, IMAGE_MIME);
        return this.fileService.uploadBrokenPartImage(
            upload.stream, upload.filename, upload.mimeType, partId,
            { maxBytes: IMAGE_MAX_SIZE },
        );
    }

    @ApiCreatedResponse({ type: ImageResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post('devices/:id/images')
    @UseInterceptors(new StreamingUploadInterceptor(IMAGE_MAX_SIZE))
    async uploadDeviceImage(
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        assertMime(upload.mimeType, IMAGE_MIME);
        return this.fileService.uploadDeviceImage(
            upload.stream, upload.filename, upload.mimeType, id,
            { maxBytes: IMAGE_MAX_SIZE },
        );
    }

    @ApiCreatedResponse({ type: ImageResponseDto })
    @RequiredRoles(...ADMIN_ROLES)
    @Post('parts/:id/images')
    @UseInterceptors(new StreamingUploadInterceptor(IMAGE_MAX_SIZE))
    async uploadDevicePartImage(
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        assertMime(upload.mimeType, IMAGE_MIME);
        return this.fileService.uploadDevicePartImage(
            upload.stream, upload.filename, upload.mimeType, id,
            { maxBytes: IMAGE_MAX_SIZE },
        );
    }
}
