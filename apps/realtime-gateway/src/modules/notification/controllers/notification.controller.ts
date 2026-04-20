import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { NotificationClientService } from 'modules/notification-client/notification-client.service';
import { NotificationService } from '../services/common-notification.service';
import { JwtAuthUser } from '@asko/gateway-common';
import { AccessTokenPayload, UpdateNotificationPreferencesDto, RegisterPushSubscriptionDto } from '@asko/shared';
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
        @JwtAuthUser() user: AccessTokenPayload,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('unreadOnly') unreadOnly?: string,
        @Query('group') group?: string,
        @Query('readStatus') readStatus?: string,
    ) {
        const effectiveReadStatus = readStatus || (unreadOnly === 'true' ? 'unread' : '');
        return this.notificationClient.listUserNotifications(user.sub, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            group: group || undefined,
            readStatus: effectiveReadStatus || undefined,
        });
    }

    @ApiOkResponse({ type: UnreadCountResponseDto })
    @Get('unread-count')
    async unreadCount(@JwtAuthUser() user: AccessTokenPayload) {
        return this.notificationClient.getUnreadCount(user.sub);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Post(':id/read')
    async markAsRead(@Param('id') id: string, @JwtAuthUser() user: AccessTokenPayload) {
        return this.notificationClient.markAsRead(id, user.sub);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Post('read-all')
    async markAllAsRead(@JwtAuthUser() user: AccessTokenPayload) {
        return this.notificationClient.markAllAsRead(user.sub);
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete(':id')
    async delete(@Param('id') id: string, @JwtAuthUser() user: AccessTokenPayload) {
        return this.notificationClient.deleteNotification(id, user.sub);
    }

    // ─── Preferences ────────────────────────────────────────────────────

    @ApiOkResponse({ type: NotificationPreferencesResponseDto })
    @Get('preferences')
    async getPreferences(@JwtAuthUser() user: AccessTokenPayload) {
        return this.notificationClient.getNotificationPreferences(user.sub);
    }

    @ApiOkResponse({ type: NotificationPreferencesResponseDto })
    @Put('preferences')
    async updatePreferences(
        @JwtAuthUser() user: AccessTokenPayload,
        @Body() dto: UpdateNotificationPreferencesDto,
    ) {
        const groups = (dto.groups ?? []).map(g => ({
            group: g.group,
            inApp: g.in_app,
            push: g.push,
            email: g.email,
        }));
        return this.notificationClient.updateNotificationPreferences(
            user.sub,
            dto.globalMute,
            groups,
            dto.globalMute !== undefined,
        );
    }

    // ─── Push Subscriptions ─────────────────────────────────────────────

    @ApiOkResponse({ type: PushSubscriptionResponseDto })
    @Post('push-subscriptions')
    async registerPushSubscription(
        @JwtAuthUser() user: AccessTokenPayload,
        @Body() dto: RegisterPushSubscriptionDto,
    ) {
        return this.notificationClient.registerPushSubscription(
            user.sub,
            dto.endpoint,
            dto.p256dh,
            dto.auth,
            dto.userAgent,
        );
    }

    @ApiOkResponse({ type: EmptyResponseDto })
    @Delete('push-subscriptions')
    async unregisterPushSubscription(
        @JwtAuthUser() user: AccessTokenPayload,
        @Body() dto: { endpoint: string },
    ) {
        return this.notificationClient.unregisterPushSubscription(user.sub, dto.endpoint);
    }

    @ApiOkResponse({ type: PushSubscriptionListResponseDto })
    @Get('push-subscriptions')
    async listPushSubscriptions(@JwtAuthUser() user: AccessTokenPayload) {
        return this.notificationClient.listPushSubscriptions(user.sub);
    }
}
