import { Controller, Get, Post, Put, Delete, Param, Query, Body, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ChatClientService } from 'modules/chat-client/chat-client.service';
import { UserClientService } from 'modules/user-client/user-client.service';
import { ChatGateway } from '../gateways/chat.gateway';
import { ChatPrivacyService } from '../services/chat-privacy.service';
import {
    ConversationResponseDto,
    PaginatedConversationsResponseDto,
    ChatMessageResponseDto,
    PaginatedMessagesResponseDto,
    ChatUnreadCountResponseDto,
    ParticipantListResponseDto,
    PresenceResponseDto,
    BulkPresenceResponseDto,
    EmptyResponseDto,
} from 'common/dto/responses';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatClient: ChatClientService,
        private readonly chatGateway: ChatGateway,
        private readonly userClient: UserClientService,
        private readonly chatPrivacy: ChatPrivacyService,
    ) {}

    // ─── Conversations ────────────────────────────────────────────────

    @ApiCreatedResponse({ type: ConversationResponseDto })
    @Post('conversations')
    async createConversation(
        @Req() req: any,
        @Body() body: { type: string; name?: string; participantIds: string[] },
    ) {
        const userId = req.user?.id;
        const userRoles: string[] = req.user?.roles ?? [];

        // Privacy check: verify each participant accepts conversations
        for (const participantId of body.participantIds) {
            const allowed = await this.chatPrivacy.canCreateConversation(userRoles, participantId);
            if (!allowed) {
                throw new ForbiddenException('Пользователь не принимает новые чаты');
            }
        }

        const result = await this.chatClient.createConversation(
            userId, body.type, body.name ?? '', body.participantIds,
        );

        // Emit to other participants via WebSocket
        const recipientIds = body.participantIds.filter(id => id !== userId);
        if (recipientIds.length > 0 && result.conversation) {
            this.chatGateway.emitConversationCreated(recipientIds, result.conversation);
        }

        return result;
    }

    @ApiOkResponse({ type: PaginatedConversationsResponseDto })
    @Get('conversations')
    async listConversations(
        @Req() req: any,
        @Query('offset') offset?: string,
        @Query('limit') limit?: string,
    ) {
        const userId = req.user?.id;
        return this.chatClient.listUserConversations(
            userId,
            offset ? parseInt(offset) : 0,
            limit ? parseInt(limit) : 20,
        );
    }

    @ApiOkResponse({ type: ConversationResponseDto })
    @Get('conversations/:id')
    async getConversation(@Param('id') id: string, @Req() req: any) {
        const userId = req.user?.id;
        return this.chatClient.getConversation(id, userId);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('conversations/:id')
    async deleteConversation(@Param('id') id: string, @Req() req: any) {
        const userId = req.user?.id;
        return this.chatClient.deleteConversation(id, userId);
    }

    // ─── Participants ─────────────────────────────────────────────────

    @ApiOkResponse({ type: ParticipantListResponseDto })
    @Get('conversations/:id/participants')
    async listParticipants(@Param('id') id: string) {
        return this.chatClient.listParticipants(id);
    }

    @ApiCreatedResponse({ type: EmptyResponseDto })
    @Post('conversations/:id/participants')
    async addParticipant(
        @Param('id') id: string,
        @Body() body: { userId: string },
        @Req() req: any,
    ) {
        const addedBy = req.user?.id;
        return this.chatClient.addParticipant(id, body.userId, addedBy);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('conversations/:id/participants/:userId')
    async removeParticipant(
        @Param('id') id: string,
        @Param('userId') userId: string,
        @Req() req: any,
    ) {
        const removedBy = req.user?.id;
        return this.chatClient.removeParticipant(id, userId, removedBy);
    }

    // ─── Messages ─────────────────────────────────────────────────────

    @ApiCreatedResponse({ type: ChatMessageResponseDto })
    @Post('conversations/:id/messages')
    async sendMessage(
        @Param('id') conversationId: string,
        @Req() req: any,
        @Body() body: { type: string; text?: string; attachment?: Record<string, any> },
    ) {
        const userId = req.user?.id;
        const result = await this.chatClient.sendMessage(
            conversationId, userId, body.type, body.text ?? '', body.attachment,
        );

        // Emit via WebSocket
        this.chatGateway.emitNewMessage(conversationId, result.message);

        return result;
    }

    @ApiOkResponse({ type: PaginatedMessagesResponseDto })
    @Get('conversations/:id/messages')
    async listMessages(
        @Param('id') conversationId: string,
        @Req() req: any,
        @Query('offset') offset?: string,
        @Query('limit') limit?: string,
        @Query('beforeId') beforeId?: string,
    ) {
        const userId = req.user?.id;
        return this.chatClient.listMessages(
            conversationId, userId,
            offset ? parseInt(offset) : 0,
            limit ? parseInt(limit) : 50,
            beforeId,
        );
    }

    @ApiOkResponse({ type: ChatMessageResponseDto })
    @Put('messages/:id')
    async updateMessage(
        @Param('id') messageId: string,
        @Body() body: { text: string },
        @Req() req: any,
    ) {
        const userId = req.user?.id;
        const result = await this.chatClient.updateMessage(messageId, userId, body.text);

        // Emit via WebSocket
        if (result.message) {
            this.chatGateway.emitMessageUpdated(result.message.conversationId, result.message);
        }

        return result;
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('messages/:id')
    async deleteMessage(@Param('id') messageId: string, @Req() req: any) {
        const userId = req.user?.id;
        // We need the message's conversation ID before deleting
        const result = await this.chatClient.deleteMessage(messageId, userId);
        return result;
    }

    @ApiOkResponse({ type: ChatUnreadCountResponseDto })
    @Get('unread-count')
    async getUnreadCount(@Req() req: any) {
        const userId = req.user?.id;
        return this.chatClient.getUnreadCount(userId);
    }

    // ─── Presence ─────────────────────────────────────────────────────

    @ApiOkResponse({ type: PresenceResponseDto })
    @Get('presence/:userId')
    async getPresence(@Param('userId') userId: string) {
        return this.chatClient.getPresence(userId);
    }

    @ApiOkResponse({ type: BulkPresenceResponseDto })
    @Post('presence/bulk')
    async getBulkPresence(@Body() body: { userIds: string[] }) {
        return this.chatClient.getBulkPresence(body.userIds);
    }

    // ─── User Search ─────────────────────────────────────────────────

    @ApiOkResponse()
    @Get('search-users')
    async searchUsers(
        @Req() req: any,
        @Query('q') query: string,
        @Query('limit') limit?: string,
    ) {
        const userId = req.user?.id;
        const userRoles: string[] = req.user?.roles ?? [];
        const result = await this.userClient.searchUsersForChat({
            query: query || '',
            requesterId: userId,
            requesterRoles: userRoles,
            limit: limit ? parseInt(limit) : 20,
        });
        return { users: result.users ?? [] };
    }
}
