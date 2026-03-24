import { Controller, Get, Post, Delete, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { NotificationClientService } from 'modules/notification-client/notification-client.service';
import { NotificationService } from '../services/common-notification.service';
import {
    PaginatedNotificationsResponseDto,
    UnreadCountResponseDto,
    EmptyResponseDto,
} from 'common/dto/responses';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
    constructor(
        private readonly notificationClient: NotificationClientService,
        private readonly notificationWs: NotificationService,
    ) {}

    @ApiOkResponse({ type: PaginatedNotificationsResponseDto })
    @Get()
    async list(
        @Req() req: any,
        @Query('offset') offset?: string,
        @Query('limit') limit?: string,
        @Query('unreadOnly') unreadOnly?: string,
    ) {
        const userId = req.user?.id;
        return this.notificationClient.listUserNotifications(
            userId,
            offset ? parseInt(offset) : 0,
            limit ? parseInt(limit) : 20,
            unreadOnly === 'true',
        );
    }

    @ApiOkResponse({ type: UnreadCountResponseDto })
    @Get('unread-count')
    async unreadCount(@Req() req: any) {
        const userId = req.user?.id;
        return this.notificationClient.getUnreadCount(userId);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Post(':id/read')
    async markAsRead(@Param('id') id: string, @Req() req: any) {
        const userId = req.user?.id;
        return this.notificationClient.markAsRead(id, userId);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Post('read-all')
    async markAllAsRead(@Req() req: any) {
        const userId = req.user?.id;
        return this.notificationClient.markAllAsRead(userId);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete(':id')
    async delete(@Param('id') id: string, @Req() req: any) {
        const userId = req.user?.id;
        return this.notificationClient.deleteNotification(id, userId);
    }
}
