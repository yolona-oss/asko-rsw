import { Controller, Param, Post, UseInterceptors } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { UPLOAD_LIMITS } from '@asko/shared';
import { CheckPolicy } from '@asko/authorization';
import {
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
} from '@asko/gateway-common';
import { AuthFileClientService } from 'modules/file-client/file-client.service';
import { SelfOrAdminPolicy } from './policies/self-or-admin.policy';

const { maxBytes: AVATAR_MAX_SIZE, mime: AVATAR_MIME } = UPLOAD_LIMITS.avatar;

@ApiTags('Users')
@Controller('auth/users')
export class UserController {
    constructor(private readonly fileService: AuthFileClientService) {}

    @ApiCreatedResponse()
    @CheckPolicy(SelfOrAdminPolicy, { paramKey: 'userId' })
    @Post(':userId/avatar')
    @UseInterceptors(new StreamingUploadInterceptor(AVATAR_MAX_SIZE))
    async uploadAvatar(
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('userId') userId: string,
    ) {
        assertMime(upload.mimeType, AVATAR_MIME);
        return this.fileService.uploadUserAvatar(
            upload.stream, upload.filename, upload.mimeType, userId,
            { maxBytes: AVATAR_MAX_SIZE },
        );
    }
}
