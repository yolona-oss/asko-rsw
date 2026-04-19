import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationTargetType, NotificationType, NotificationUrgency, NotificationGroup, NotificationChannel } from '@asko/shared';

export class NotificationRecordDto {
    id: string;
    userId: string;
    @ApiProperty({ enum: NotificationType, enumName: 'NotificationType' })
    type: NotificationType;
    title: string;
    body: string;
    @ApiPropertyOptional({ enum: NotificationTargetType, enumName: 'NotificationTargetType' })
    targetType?: NotificationTargetType;
    targetId?: string;
    metadata?: string;
    @ApiProperty({ enum: NotificationUrgency, enumName: 'NotificationUrgency', default: NotificationUrgency.NORMAL })
    urgency: NotificationUrgency;
    isRead: boolean;
    readAt?: string;
    createdAt: string;
}

export class PaginatedNotificationsResponseDto {
    @ApiProperty({ type: [NotificationRecordDto] })
    data: NotificationRecordDto[];
    overallCount: number;
    page: number;
    limit: number;
}

export class UnreadCountResponseDto {
    count: number;
}

// ─── Preferences ────────────────────────────────────────────────────────

export class GroupPreferenceDto {
    @ApiProperty({ enum: NotificationGroup, enumName: 'NotificationGroup' })
    group: string;
    @ApiProperty({ name: 'in_app' })
    inApp: boolean;
    push: boolean;
    email: boolean;
}

export class NotificationPreferencesResponseDto {
    globalMute: boolean;
    @ApiProperty({ type: [GroupPreferenceDto] })
    groups: GroupPreferenceDto[];
}

// ─── Push Subscriptions ─────────────────────────────────────────────────

export class PushSubscriptionResponseDto {
    id: string;
    endpoint: string;
    createdAt: string;
}

export class PushSubscriptionListResponseDto {
    @ApiProperty({ type: [PushSubscriptionResponseDto] })
    subscriptions: PushSubscriptionResponseDto[];
}
