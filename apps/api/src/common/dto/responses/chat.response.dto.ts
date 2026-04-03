import { ApiProperty } from '@nestjs/swagger';

export class ParticipantRecordDto {
    id: string;
    userId: string;
    conversationId: string;
    role: string;
    lastReadMessageId?: string;
    joinedAt: string;
}

export class ChatMessageRecordDto {
    id: string;
    conversationId: string;
    senderId: string;
    type: string;
    text?: string;
    attachmentJson?: string;
    isEdited: boolean;
    createdAt: string;
    updatedAt: string;
}

export class ConversationRecordDto {
    id: string;
    type: string;
    name?: string;
    creatorId: string;
    @ApiProperty({ type: [ParticipantRecordDto] })
    participants: ParticipantRecordDto[];
    lastMessage?: ChatMessageRecordDto;
    unreadCount: number;
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
    status: string;
    activity: string;
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
