import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    ConversationType,
    MessageStatus,
    MessageType,
    ParticipantRole,
    PresenceStatus,
    UserActivity,
} from '@asko/shared';

export class ParticipantRecordDto {
    id: string;
    userId: string;
    conversationId: string;
    @ApiProperty({ enum: ParticipantRole, enumName: 'ParticipantRole' })
    role: ParticipantRole;
    lastReadMessageId?: string;
    joinedAt: string;
}

export class ChatMessageRecordDto {
    id: string;
    conversationId: string;
    senderId: string;
    @ApiProperty({ enum: MessageType, enumName: 'MessageType' })
    type: MessageType;
    text?: string;
    attachmentJson?: string;
    isEdited: boolean;
    @ApiPropertyOptional({ enum: MessageStatus, enumName: 'MessageStatus' })
    status?: MessageStatus;
    deliveredAt?: string;
    readAt?: string;
    createdAt: string;
    updatedAt: string;
}

export class ConversationRecordDto {
    id: string;
    @ApiProperty({ enum: ConversationType, enumName: 'ConversationType' })
    type: ConversationType;
    name?: string;
    creatorId: string;
    @ApiProperty({ type: [ParticipantRecordDto] })
    participants: ParticipantRecordDto[];
    lastMessage?: ChatMessageRecordDto;
    unreadCount: number;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export class ConversationResponseDto {
    conversation: ConversationRecordDto;
}

export class PaginatedConversationsResponseDto {
    @ApiProperty({ type: [ConversationRecordDto] })
    data: ConversationRecordDto[];
    overallCount: number;
    page: number;
    limit: number;
}

export class ChatMessageResponseDto {
    message: ChatMessageRecordDto;
}

export class PaginatedMessagesResponseDto {
    @ApiProperty({ type: [ChatMessageRecordDto] })
    data: ChatMessageRecordDto[];
    overallCount: number;
    page: number;
    limit: number;
}

export class ChatUnreadCountResponseDto {
    count: number;
}

export class ParticipantListResponseDto {
    @ApiProperty({ type: [ParticipantRecordDto] })
    participants: ParticipantRecordDto[];
}

export class PresenceRecordDto {
    userId: string;
    @ApiProperty({ enum: PresenceStatus, enumName: 'PresenceStatus' })
    status: PresenceStatus;
    @ApiProperty({ enum: UserActivity, enumName: 'UserActivity' })
    activity: UserActivity;
    conversationId?: string;
    lastSeenAt: string;
}

export class PresenceResponseDto {
    presence: PresenceRecordDto;
}

export class BulkPresenceResponseDto {
    @ApiProperty({ type: [PresenceRecordDto] })
    presences: PresenceRecordDto[];
}
