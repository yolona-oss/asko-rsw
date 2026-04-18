import { Controller, Param, Post, UseInterceptors } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ImageTypeEnum, UPLOAD_LIMITS } from '@asko/shared';
import { CheckPolicy } from '@asko/authorization';
import {
    FileClientService,
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
} from '@asko/gateway-common';
import { SelfOrAdminPolicy } from './policies/self-or-admin.policy';

const { maxBytes: AVATAR_MAX_SIZE, mime: AVATAR_MIME } = UPLOAD_LIMITS.avatar;

@ApiTags('Users')
@Controller('auth/users')
export class UserController {
    constructor(private readonly fileService: FileClientService) {}

    @ApiCreatedResponse()
    @CheckPolicy(SelfOrAdminPolicy, { paramKey: 'userId' })
    @Post(':userId/avatar')
    @UseInterceptors(new StreamingUploadInterceptor(AVATAR_MAX_SIZE))
    async uploadAvatar(
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('userId') userId: string,
    ) {
        assertMime(upload.mimeType, AVATAR_MIME);
        const res = await this.fileService.uploadFile(
            upload.stream, upload.filename, upload.mimeType,
            { maxBytes: AVATAR_MAX_SIZE },
            { ownerType: ImageTypeEnum.User, ownerId: userId, replaceExisting: true },
        );
        return { image: res.image };
    }
}
