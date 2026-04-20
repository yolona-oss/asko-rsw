import { Injectable } from '@nestjs/common';
import { FileVisibility, msg } from '@asko/shared';
import type { JwtPayload } from '@asko/shared';
import type { FileAccessResponse } from '@asko/proto';
import { AppErrors, AppError } from 'common/error';
import { ChatClientService } from 'modules/chat-client/chat-client.service';
import type { FileVisibilityHandler } from './visibility-handler.interface';

@Injectable()
export class ParticipantsOnlyVisibilityHandler implements FileVisibilityHandler {
    readonly visibility = FileVisibility.PARTICIPANTS_ONLY;

    constructor(private readonly chatClient: ChatClientService) {}

    async authorize(access: FileAccessResponse, user?: JwtPayload): Promise<void> {
        if (!user) throw AppErrors.unauthorized({ key: msg.file.authRequired });
        if (!access.conversationId) throw AppErrors.forbidden({ key: msg.file.accessDenied });
        try {
            const { participants } = await this.chatClient.listParticipants(access.conversationId);
            const isParticipant = participants.some((p) => p.userId === user.sub);
            if (!isParticipant) throw AppErrors.forbidden({ key: msg.file.accessDenied });
        } catch (e) {
            if (e instanceof AppError) throw e;
            throw AppErrors.forbidden({ key: msg.file.accessDenied });
        }
    }
}
