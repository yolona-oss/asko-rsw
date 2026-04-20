import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ChatClientService } from 'modules/chat-client/chat-client.service';
import { UserClientService, JwtAuthUser } from '@asko/gateway-common';
import { CheckPolicy } from '@asko/authorization';
import { ChatGateway } from '../gateways/chat.gateway';
import { ConversationCreationPolicy } from '../policies/conversation-creation.policy';
import { AccessTokenPayload } from '@asko/shared';
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
    ) {}

    // ─── Conversations ────────────────────────────────────────────────

    @ApiCreatedResponse({ type: ConversationResponseDto })
    @CheckPolicy(ConversationCreationPolicy)
    @Post('conversations')
    async createConversation(
        @JwtAuthUser() user: AccessTokenPayload,
        @Body() body: { type: string; name?: string; participantIds: string[]; avatarUrl?: string },
    ) {
        const result = await this.chatClient.createConversation(
            user.sub, body.type, body.name ?? '', body.participantIds, body.avatarUrl,
        );

        // Emit to other participants via WebSocket
        const recipientIds = body.participantIds.filter(id => id !== user.sub);
        if (recipientIds.length > 0 && result.conversation) {
            this.chatGateway.emitConversationCreated(recipientIds, result.conversation);
        }

        return result;
    }

    @ApiOkResponse({ type: PaginatedConversationsResponseDto })
    @Get('conversations')
    async listConversations(
        @JwtAuthUser() user: AccessTokenPayload,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.chatClient.listUserConversations(
            user.sub,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        );
    }

    @ApiOkResponse({ type: ConversationResponseDto })
    @Get('conversations/:id')
    async getConversation(@Param('id') id: string, @JwtAuthUser() user: AccessTokenPayload) {
        return this.chatClient.getConversation(id, user.sub);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('conversations/:id')
    async deleteConversation(@Param('id') id: string, @JwtAuthUser() user: AccessTokenPayload) {
        return this.chatClient.deleteConversation(id, user.sub);
    }

    // ─── Participants ─────────────────────────────────────────────────

    @ApiOkResponse({ type: ParticipantListResponseDto })
    @Get('conversations/:id/participants')
    async listParticipants(@Param('id') id: string, @JwtAuthUser() user: AccessTokenPayload) {
        return this.chatClient.listParticipants(id, user.sub);
    }

    @ApiCreatedResponse({ type: EmptyResponseDto })
    @Post('conversations/:id/participants')
    async addParticipant(
        @Param('id') id: string,
        @Body() body: { userId: string },
        @JwtAuthUser() user: AccessTokenPayload,
    ) {
        return this.chatClient.addParticipant(id, body.userId, user.sub);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('conversations/:id/participants/:userId')
    async removeParticipant(
        @Param('id') id: string,
        @Param('userId') targetUserId: string,
        @JwtAuthUser() user: AccessTokenPayload,
    ) {
        return this.chatClient.removeParticipant(id, targetUserId, user.sub);
    }

    // ─── Messages ─────────────────────────────────────────────────────

    @ApiCreatedResponse({ type: ChatMessageResponseDto })
    @Post('conversations/:id/messages')
    async sendMessage(
        @Param('id') conversationId: string,
        @JwtAuthUser() user: AccessTokenPayload,
        @Body() body: { type: string; text?: string; attachment?: Record<string, any> },
    ) {
        const result = await this.chatClient.sendMessage(
            conversationId, user.sub, body.type, body.text ?? '', body.attachment,
        );

        // Emit via WebSocket
        this.chatGateway.emitNewMessage(conversationId, result.message);

        return result;
    }

    @ApiOkResponse({ type: PaginatedMessagesResponseDto })
    @Get('conversations/:id/messages')
    async listMessages(
        @Param('id') conversationId: string,
        @JwtAuthUser() user: AccessTokenPayload,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('beforeId') beforeId?: string,
    ) {
        return this.chatClient.listMessages(
            conversationId, user.sub,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 50,
            beforeId,
        );
    }

    @ApiOkResponse({ type: ChatMessageResponseDto })
    @Put('messages/:id')
    async updateMessage(
        @Param('id') messageId: string,
        @Body() body: { text: string },
        @JwtAuthUser() user: AccessTokenPayload,
    ) {
        const result = await this.chatClient.updateMessage(messageId, user.sub, body.text);

        // Emit via WebSocket
        if (result.message) {
            this.chatGateway.emitMessageUpdated(result.message.conversationId, result.message);
        }

        return result;
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('messages/:id')
    async deleteMessage(@Param('id') messageId: string, @JwtAuthUser() user: AccessTokenPayload) {
        const result = await this.chatClient.deleteMessage(messageId, user.sub);
        return result;
    }

    @ApiOkResponse({ type: ChatUnreadCountResponseDto })
    @Get('unread-count')
    async getUnreadCount(@JwtAuthUser() user: AccessTokenPayload) {
        return this.chatClient.getUnreadCount(user.sub);
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
        @JwtAuthUser() user: AccessTokenPayload,
        @Query('q') query: string,
        @Query('limit') limit?: string,
    ) {
        const result = await this.userClient.searchUsersForChat({
            query: query || '',
            requesterId: user.sub,
            requesterRoles: user.roles,
            limit: limit ? parseInt(limit) : 20,
        });
        return { users: result.users ?? [] };
    }
}
