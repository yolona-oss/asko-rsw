import {
    Controller,
    Param,
    Post,
    UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ImageTypeEnum, UPLOAD_LIMITS } from '@asko/shared';
import { Permissions, Permission } from '@asko/authorization';
import {
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
} from '@asko/gateway-common';
import { RepairFileClientService } from 'modules/repair/services/repair-file-client.service';
import { ImageResponseDto, VideoResponseDto } from 'common/dto/responses';

const { maxBytes: IMAGE_MAX_SIZE, mime: IMAGE_MIME } = UPLOAD_LIMITS.image;
const { maxBytes: VIDEO_MAX_SIZE, mime: VIDEO_MIME } = UPLOAD_LIMITS.video;

@ApiTags('Device uploads')
@Controller()
export class DeviceUploadController {
    constructor(private readonly fileService: RepairFileClientService) {}

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Permissions(Permission.DEVICE_MANAGE)
    @Post('devices/:id/images')
    @UseInterceptors(new StreamingUploadInterceptor(IMAGE_MAX_SIZE))
    async uploadDeviceImage(
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        assertMime(upload.mimeType, IMAGE_MIME);
        const res = await this.fileService.uploadFile(
            upload.stream, upload.filename, upload.mimeType,
            { maxBytes: IMAGE_MAX_SIZE },
            { ownerType: ImageTypeEnum.Device, ownerId: id },
        );
        return { image: res.image };
    }

    @ApiCreatedResponse({ type: VideoResponseDto })
    @Permissions(Permission.DEVICE_MANAGE)
    @Post('devices/:id/videos')
    @UseInterceptors(new StreamingUploadInterceptor(VIDEO_MAX_SIZE))
    async uploadDeviceVideo(
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        assertMime(upload.mimeType, VIDEO_MIME);
        const res = await this.fileService.uploadFile(
            upload.stream, upload.filename, upload.mimeType,
            { maxBytes: VIDEO_MAX_SIZE },
            { ownerType: ImageTypeEnum.Device, ownerId: id },
        );
        return { video: res.video };
    }

    @ApiCreatedResponse({ type: ImageResponseDto })
    @Permissions(Permission.DEVICE_MANAGE)
    @Post('parts/:id/images')
    @UseInterceptors(new StreamingUploadInterceptor(IMAGE_MAX_SIZE))
    async uploadDevicePartImage(
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('id') id: string,
    ) {
        assertMime(upload.mimeType, IMAGE_MIME);
        const res = await this.fileService.uploadFile(
            upload.stream, upload.filename, upload.mimeType,
            { maxBytes: IMAGE_MAX_SIZE },
            { ownerType: ImageTypeEnum.DevicePart, ownerId: id },
        );
        return { image: res.image };
    }
}
