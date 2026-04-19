import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationTargetType, NotificationType, NotificationUrgency } from '@asko/shared';

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
