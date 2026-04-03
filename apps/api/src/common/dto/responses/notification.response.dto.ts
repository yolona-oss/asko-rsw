import { ApiProperty } from '@nestjs/swagger';

export class NotificationRecordDto {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    targetType?: string;
    targetId?: string;
    metadata?: string;
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
