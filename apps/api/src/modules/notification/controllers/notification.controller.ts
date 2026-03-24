import { Controller, Get, Post, Delete, Param, Query, Req } from '@nestjs/common';
import { NotificationClientService } from 'modules/notification-client/notification-client.service';
import { NotificationService } from '../services/common-notification.service';

@Controller('notifications')
export class NotificationController {
    constructor(
        private readonly notificationClient: NotificationClientService,
        private readonly notificationWs: NotificationService,
    ) {}

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

    @Get('unread-count')
    async unreadCount(@Req() req: any) {
        const userId = req.user?.id;
        return this.notificationClient.getUnreadCount(userId);
    }

    @Post(':id/read')
    async markAsRead(@Param('id') id: string, @Req() req: any) {
        const userId = req.user?.id;
        return this.notificationClient.markAsRead(id, userId);
    }

    @Post('read-all')
    async markAllAsRead(@Req() req: any) {
        const userId = req.user?.id;
        return this.notificationClient.markAllAsRead(userId);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Req() req: any) {
        const userId = req.user?.id;
        return this.notificationClient.deleteNotification(id, userId);
    }
}
