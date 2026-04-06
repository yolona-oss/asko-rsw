import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { NotificationClientService } from 'modules/notification-client/notification-client.service';
import { NotificationService } from '../services/common-notification.service';
import { JwtAuthUser } from '@asko/gateway-common';
import { JwtPayload } from '@asko/shared';
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
        @JwtAuthUser() user: JwtPayload,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('unreadOnly') unreadOnly?: string,
    ) {
        return this.notificationClient.listUserNotifications(
            user.id,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            unreadOnly === 'true',
        );
    }

    @ApiOkResponse({ type: UnreadCountResponseDto })
    @Get('unread-count')
    async unreadCount(@JwtAuthUser() user: JwtPayload) {
        return this.notificationClient.getUnreadCount(user.id);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Post(':id/read')
    async markAsRead(@Param('id') id: string, @JwtAuthUser() user: JwtPayload) {
        return this.notificationClient.markAsRead(id, user.id);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Post('read-all')
    async markAllAsRead(@JwtAuthUser() user: JwtPayload) {
        return this.notificationClient.markAllAsRead(user.id);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete(':id')
    async delete(@Param('id') id: string, @JwtAuthUser() user: JwtPayload) {
        return this.notificationClient.deleteNotification(id, user.id);
    }
}
