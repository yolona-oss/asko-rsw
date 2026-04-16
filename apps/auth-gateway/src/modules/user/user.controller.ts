import { Controller, Param, Post, UseInterceptors } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { AppErrors, JwtPayload } from '@asko/shared';
import {
    JwtAuthUser,
    StreamingFile,
    StreamingUploadInterceptor,
    type StreamingUploadPayload,
    assertMime,
    isAdmin,
    isSelf,
} from '@asko/gateway-common';
import { FileClientService } from 'modules/file-client/file-client.service';

const AVATAR_MAX_SIZE = 5 * 1024 * 1024;
const AVATAR_MIME = /(jpg|jpeg|png|webp)$/;

@ApiTags('Users')
@Controller('auth/users')
export class UserController {
    constructor(private readonly fileService: FileClientService) {}

    @ApiCreatedResponse()
    @Post(':userId/avatar')
    @UseInterceptors(new StreamingUploadInterceptor(AVATAR_MAX_SIZE))
    async uploadAvatar(
        @JwtAuthUser() user: JwtPayload,
        @StreamingFile() upload: StreamingUploadPayload,
        @Param('userId') userId: string,
    ) {
        if (!isSelf(user, userId) && !isAdmin(user)) {
            throw AppErrors.forbidden('Нельзя менять аватар другого пользователя');
        }
        assertMime(upload.mimeType, AVATAR_MIME);
        return this.fileService.uploadUserAvatar(
            upload.stream, upload.filename, upload.mimeType, userId,
            { maxBytes: AVATAR_MAX_SIZE },
        );
    }
}
