import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { NotificationClientService } from 'modules/notification-client/notification-client.service';
import { NotificationService } from '../services/common-notification.service';
import { JwtAuthUser } from '@asko/gateway-common';
import { JwtPayload, UpdateNotificationPreferencesDto, RegisterPushSubscriptionDto } from '@asko/shared';
import {
    PaginatedNotificationsResponseDto,
    UnreadCountResponseDto,
    EmptyResponseDto,
    NotificationPreferencesResponseDto,
    PushSubscriptionResponseDto,
    PushSubscriptionListResponseDto,
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

    // ─── Preferences ────────────────────────────────────────────────────

    @ApiOkResponse({ type: NotificationPreferencesResponseDto })
    @Get('preferences')
    async getPreferences(@JwtAuthUser() user: JwtPayload) {
        return this.notificationClient.getNotificationPreferences(user.id);
    }

    @ApiOkResponse({ type: NotificationPreferencesResponseDto })
    @Put('preferences')
    async updatePreferences(
        @JwtAuthUser() user: JwtPayload,
        @Body() dto: UpdateNotificationPreferencesDto,
    ) {
        const groups = (dto.groups ?? []).map(g => ({
            group: g.group,
            inApp: g.in_app,
            push: g.push,
            email: g.email,
        }));
        return this.notificationClient.updateNotificationPreferences(
            user.id,
            dto.globalMute,
            groups,
            dto.globalMute !== undefined,
        );
    }

    // ─── Push Subscriptions ─────────────────────────────────────────────

    @ApiOkResponse({ type: PushSubscriptionResponseDto })
    @Post('push-subscriptions')
    async registerPushSubscription(
        @JwtAuthUser() user: JwtPayload,
        @Body() dto: RegisterPushSubscriptionDto,
    ) {
        return this.notificationClient.registerPushSubscription(
            user.id,
            dto.endpoint,
            dto.p256dh,
            dto.auth,
            dto.userAgent,
        );
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('push-subscriptions')
    async unregisterPushSubscription(
        @JwtAuthUser() user: JwtPayload,
        @Body() dto: { endpoint: string },
    ) {
        return this.notificationClient.unregisterPushSubscription(user.id, dto.endpoint);
    }

    @ApiOkResponse({ type: PushSubscriptionListResponseDto })
    @Get('push-subscriptions')
    async listPushSubscriptions(@JwtAuthUser() user: JwtPayload) {
        return this.notificationClient.listPushSubscriptions(user.id);
    }
}
