jest.mock('@mikro-orm/postgresql', () => ({
    EntityManager: jest.fn(),
    FilterQuery: jest.fn(),
    CreateRequestContext: () => (_target: any, _key: string, descriptor: PropertyDescriptor) => descriptor,
}));

jest.mock('common/error', () => ({
    AppErrors: {
        notificationNotFound: () => new Error('Notification not found'),
    },
}));

jest.mock('entities/notification.entity', () => ({
    NotificationEntity: class NotificationEntity {},
}));

jest.mock('channels/channel-registry', () => ({
    ChannelRegistry: jest.fn(),
}));

jest.mock('./notification-preferences.service', () => ({
    NotificationPreferencesService: jest.fn(),
}));

jest.mock('./user-info.service', () => ({
    UserInfoService: jest.fn(),
}));

import { NotificationService } from './notification.service';
import { NotificationEntity } from 'entities/notification.entity';

describe('NotificationService', () => {
    let service: NotificationService;
    let mockEm: {
        create: jest.Mock;
        findOne: jest.Mock;
        find: jest.Mock;
        findAndCount: jest.Mock;
        count: jest.Mock;
        persist: jest.Mock;
        persistAndFlush: jest.Mock;
        flush: jest.Mock;
        removeAndFlush: jest.Mock;
    };
    let mockChannelRegistry: { all: jest.Mock };
    let mockPreferencesService: { getPreferences: jest.Mock; shouldDeliver: jest.Mock };
    let mockUserInfoService: { getEmailInfo: jest.Mock };

    beforeEach(() => {
        mockEm = {
            create: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            count: jest.fn(),
            persist: jest.fn(),
            persistAndFlush: jest.fn().mockResolvedValue(undefined),
            flush: jest.fn().mockResolvedValue(undefined),
            removeAndFlush: jest.fn().mockResolvedValue(undefined),
        };
        mockChannelRegistry = {
            all: jest.fn().mockReturnValue([]),
        };
        mockPreferencesService = {
            getPreferences: jest.fn().mockResolvedValue({}),
            shouldDeliver: jest.fn().mockReturnValue(true),
        };
        mockUserInfoService = {
            getEmailInfo: jest.fn().mockResolvedValue(null),
        };

        service = new NotificationService(
            mockEm as any,
            mockChannelRegistry as any,
            mockPreferencesService as any,
            mockUserInfoService as any,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createNotification', () => {
        const mockNotification = {
            id: 'n1',
            userId: 'u1',
            type: 'payment',
            title: 'Payment received',
            body: 'You received a payment of 500 RUB',
            targetType: undefined,
            targetId: undefined,
            metadata: undefined,
            urgency: undefined,
            isRead: false,
            createdAt: new Date('2026-03-20T12:00:00Z'),
        };

        beforeEach(() => {
            mockEm.create.mockReturnValue(mockNotification);
        });

        it('should create and persist a notification', async () => {
            const result = await service.createNotification({
                userId: 'u1',
                type: 'payment',
                title: 'Payment received',
                body: 'You received a payment of 500 RUB',
            });

            expect(mockEm.create).toHaveBeenCalledWith(NotificationEntity, {
                userId: 'u1',
                type: 'payment',
                title: 'Payment received',
                body: 'You received a payment of 500 RUB',
                targetType: undefined,
                targetId: undefined,
                metadata: undefined,
                urgency: undefined,
            });
            expect(mockEm.persistAndFlush).toHaveBeenCalledWith(mockNotification);
            expect(result).toBe(mockNotification);
        });

        it('should create notification with optional fields', async () => {
            const notificationWithOptionals = {
                ...mockNotification,
                targetType: 'repair',
                targetId: 'r123',
                metadata: { amount: 500 },
            };
            mockEm.create.mockReturnValue(notificationWithOptionals);

            const result = await service.createNotification({
                userId: 'u1',
                type: 'payment',
                title: 'Payment received',
                body: 'You received a payment of 500 RUB',
                targetType: 'repair',
                targetId: 'r123',
                metadata: { amount: 500 },
            });

            expect(mockEm.create).toHaveBeenCalledWith(NotificationEntity, {
                userId: 'u1',
                type: 'payment',
                title: 'Payment received',
                body: 'You received a payment of 500 RUB',
                targetType: 'repair',
                targetId: 'r123',
                metadata: { amount: 500 },
                urgency: undefined,
            });
            expect(result).toBe(notificationWithOptionals);
        });

        it('should dispatch to channels after creating notification', async () => {
            const mockChannel = {
                channelName: 'in_app',
                deliver: jest.fn().mockResolvedValue(undefined),
            };
            mockChannelRegistry.all.mockReturnValue([mockChannel]);

            await service.createNotification({
                userId: 'u1',
                type: 'payment',
                title: 'Payment received',
                body: 'You received a payment of 500 RUB',
            });

            // dispatchToChannels is fire-and-forget, give it a tick
            await new Promise(r => setTimeout(r, 10));

            expect(mockChannelRegistry.all).toHaveBeenCalled();
        });

        it('should not reject if channel dispatch fails', async () => {
            const mockChannel = {
                channelName: 'in_app',
                deliver: jest.fn().mockRejectedValue(new Error('Channel down')),
            };
            mockChannelRegistry.all.mockReturnValue([mockChannel]);

            await expect(
                service.createNotification({
                    userId: 'u1',
                    type: 'payment',
                    title: 'Title',
                    body: 'Body',
                }),
            ).resolves.toBe(mockNotification);
        });
    });

    describe('listUserNotifications', () => {
        it('should return paginated results', async () => {
            const notifications = [
                { id: 'n1', userId: 'u1', title: 'First' },
                { id: 'n2', userId: 'u1', title: 'Second' },
            ];
            mockEm.findAndCount.mockResolvedValue([notifications, 5]);

            const result = await service.listUserNotifications('u1', { offset: 0, limit: 10 });

            expect(result).toEqual({ data: notifications, overallCount: 5 });
            expect(mockEm.findAndCount).toHaveBeenCalledWith(
                NotificationEntity,
                { userId: 'u1' },
                { orderBy: { createdAt: 'DESC' }, offset: 0, limit: 10 },
            );
        });

        it('should filter by unreadOnly when true', async () => {
            mockEm.findAndCount.mockResolvedValue([[], 0]);

            await service.listUserNotifications('u1', { offset: 0, limit: 10, unreadOnly: true });

            expect(mockEm.findAndCount).toHaveBeenCalledWith(
                NotificationEntity,
                { userId: 'u1', isRead: false },
                { orderBy: { createdAt: 'DESC' }, offset: 0, limit: 10 },
            );
        });

        it('should not add isRead filter when unreadOnly is false', async () => {
            mockEm.findAndCount.mockResolvedValue([[], 0]);

            await service.listUserNotifications('u1', { offset: 5, limit: 20 });

            expect(mockEm.findAndCount).toHaveBeenCalledWith(
                NotificationEntity,
                { userId: 'u1' },
                { orderBy: { createdAt: 'DESC' }, offset: 5, limit: 20 },
            );
        });

        it('should return empty data when no notifications exist', async () => {
            mockEm.findAndCount.mockResolvedValue([[], 0]);

            const result = await service.listUserNotifications('u1', { offset: 0, limit: 10 });

            expect(result).toEqual({ data: [], overallCount: 0 });
        });
    });

    describe('markAsRead', () => {
        it('should mark a notification as read', async () => {
            const notification = {
                id: 'n1',
                userId: 'u1',
                isRead: false,
                readAt: undefined as Date | undefined,
            };
            mockEm.findOne.mockResolvedValue(notification);

            await service.markAsRead('n1', 'u1');

            expect(notification.isRead).toBe(true);
            expect(notification.readAt).toBeInstanceOf(Date);
            expect(mockEm.flush).toHaveBeenCalled();
            expect(mockEm.findOne).toHaveBeenCalledWith(NotificationEntity, {
                id: 'n1',
                userId: 'u1',
            });
        });

        it('should throw when notification is not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await expect(service.markAsRead('nonexistent', 'u1'))
                .rejects.toThrow('Notification not found');
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all unread notifications as read', async () => {
            const unreadNotifications = [
                { id: 'n1', userId: 'u1', isRead: false, readAt: undefined as Date | undefined },
                { id: 'n2', userId: 'u1', isRead: false, readAt: undefined as Date | undefined },
                { id: 'n3', userId: 'u1', isRead: false, readAt: undefined as Date | undefined },
            ];
            mockEm.find.mockResolvedValue(unreadNotifications);

            await service.markAllAsRead('u1');

            expect(mockEm.find).toHaveBeenCalledWith(NotificationEntity, {
                userId: 'u1',
                isRead: false,
            });

            for (const n of unreadNotifications) {
                expect(n.isRead).toBe(true);
                expect(n.readAt).toBeInstanceOf(Date);
            }

            // All notifications should have the same readAt timestamp
            expect(unreadNotifications[0].readAt).toEqual(unreadNotifications[1].readAt);
            expect(unreadNotifications[1].readAt).toEqual(unreadNotifications[2].readAt);

            expect(mockEm.flush).toHaveBeenCalled();
        });

        it('should handle no unread notifications gracefully', async () => {
            mockEm.find.mockResolvedValue([]);

            await service.markAllAsRead('u1');

            expect(mockEm.flush).toHaveBeenCalled();
        });
    });

    describe('getUnreadCount', () => {
        it('should return the count of unread notifications', async () => {
            mockEm.count.mockResolvedValue(7);

            const result = await service.getUnreadCount('u1');

            expect(result).toBe(7);
            expect(mockEm.count).toHaveBeenCalledWith(NotificationEntity, {
                userId: 'u1',
                isRead: false,
            });
        });

        it('should return 0 when there are no unread notifications', async () => {
            mockEm.count.mockResolvedValue(0);

            const result = await service.getUnreadCount('u1');

            expect(result).toBe(0);
        });
    });

    describe('hasUnreadForTarget', () => {
        it('should return true when unread notifications exist for target', async () => {
            mockEm.count.mockResolvedValue(2);

            const result = await service.hasUnreadForTarget('u1', 'payment', 'p1');

            expect(result).toBe(true);
            expect(mockEm.count).toHaveBeenCalledWith(NotificationEntity, {
                userId: 'u1',
                targetType: 'payment',
                targetId: 'p1',
                isRead: false,
            });
        });

        it('should return false when no unread notifications exist for target', async () => {
            mockEm.count.mockResolvedValue(0);

            const result = await service.hasUnreadForTarget('u1', 'payment', 'p1');

            expect(result).toBe(false);
        });
    });

    describe('deleteNotification', () => {
        it('should remove the notification', async () => {
            const notification = { id: 'n1', userId: 'u1' };
            mockEm.findOne.mockResolvedValue(notification);

            await service.deleteNotification('n1', 'u1');

            expect(mockEm.findOne).toHaveBeenCalledWith(NotificationEntity, {
                id: 'n1',
                userId: 'u1',
            });
            expect(mockEm.removeAndFlush).toHaveBeenCalledWith(notification);
        });

        it('should throw when notification is not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await expect(service.deleteNotification('nonexistent', 'u1'))
                .rejects.toThrow('Notification not found');
        });
    });
});
