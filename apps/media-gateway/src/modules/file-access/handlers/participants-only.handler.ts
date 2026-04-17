import { ForbiddenException, Injectable } from '@nestjs/common';
import { FileVisibility } from '@asko/shared';
import type { JwtPayload } from '@asko/shared';
import type { FileAccessResponse } from '@asko/proto';
import { ChatClientService } from 'modules/chat-client/chat-client.service';
import type { FileVisibilityHandler } from './visibility-handler.interface';

@Injectable()
export class ParticipantsOnlyVisibilityHandler implements FileVisibilityHandler {
    readonly visibility = FileVisibility.PARTICIPANTS_ONLY;

    constructor(private readonly chatClient: ChatClientService) {}

    async authorize(access: FileAccessResponse, user?: JwtPayload): Promise<void> {
        if (!user) throw new ForbiddenException('Authentication required');
        if (!access.conversationId) throw new ForbiddenException('Access denied');
        try {
            const { participants } = await this.chatClient.listParticipants(access.conversationId);
            const isParticipant = participants.some((p) => p.userId === user.sub);
            if (!isParticipant) throw new ForbiddenException('Access denied');
        } catch (e) {
            if (e instanceof ForbiddenException) throw e;
            throw new ForbiddenException('Access denied');
        }
    }
}
