import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Policy, PolicyContext } from '@asko/authorization';
import { ChatPrivacyService } from '../services/chat-privacy.service';

/**
 * Assert that each participant in the conversation creation request
 * accepts conversations from the requester.
 *
 * Delegates to `ChatPrivacyService.canCreateConversation()` which
 * handles role-based privilege bypass and Redis-cached preference lookup.
 *
 * Replaces the inline privacy-check loop in `chat.controller.ts`.
 */
@Injectable()
export class ConversationCreationPolicy implements Policy {
    constructor(private readonly chatPrivacy: ChatPrivacyService) {}

    async authorize(ctx: PolicyContext): Promise<boolean> {
        const participantIds: string[] = (ctx.body as any)?.participantIds ?? [];
        await Promise.all(participantIds.map(async (id) => {
            const allowed = await this.chatPrivacy.canCreateConversation(ctx.user.roles, id);
            if (!allowed) throw new ForbiddenException('Пользователь не принимает новые чаты');
        }));
        return true;
    }
}
