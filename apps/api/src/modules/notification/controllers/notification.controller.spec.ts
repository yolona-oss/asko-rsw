jest.mock('../gateways/notify.gateway', () => ({
    NotificationGateway: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../services/common-notification.service', () => ({
    NotificationService: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('modules/notification-client/notification-client.service', () => ({
    NotificationClientService: jest.fn().mockImplementation(() => ({})),
}));

import { NotificationController } from './notification.controller';

describe('NotificationController', () => {
    let controller: NotificationController;

    const mockNotificationClient = {
        listUserNotifications: jest.fn(),
        getUnreadCount: jest.fn(),
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        deleteNotification: jest.fn(),
    };

    const mockNotificationWs = {};

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new NotificationController(
            mockNotificationClient as any,
            mockNotificationWs as any,
        );
    });

    describe('list', () => {
        it('should list notifications with default pagination', async () => {
            const mockResult = { data: [], overallCount: 0 };
            mockNotificationClient.listUserNotifications.mockResolvedValue(mockResult);

            const req = { user: { id: 'user-1' } };
            const result = await controller.list(req);

            expect(mockNotificationClient.listUserNotifications).toHaveBeenCalledWith('user-1', 0, 20, false);
            expect(result).toEqual(mockResult);
        });

        it('should parse offset, limit, and unreadOnly from query', async () => {
            const mockResult = { data: [], overallCount: 0 };
            mockNotificationClient.listUserNotifications.mockResolvedValue(mockResult);

            const req = { user: { id: 'user-1' } };
            await controller.list(req, '10', '5', 'true');

            expect(mockNotificationClient.listUserNotifications).toHaveBeenCalledWith('user-1', 10, 5, true);
        });
    });

    describe('unreadCount', () => {
        it('should return unread count for the user', async () => {
            const mockResult = { count: 5 };
            mockNotificationClient.getUnreadCount.mockResolvedValue(mockResult);

            const req = { user: { id: 'user-1' } };
            const result = await controller.unreadCount(req);

            expect(mockNotificationClient.getUnreadCount).toHaveBeenCalledWith('user-1');
            expect(result).toEqual(mockResult);
        });
    });

    describe('markAsRead', () => {
        it('should mark a notification as read', async () => {
            mockNotificationClient.markAsRead.mockResolvedValue({});

            const req = { user: { id: 'user-1' } };
            await controller.markAsRead('notif-1', req);

            expect(mockNotificationClient.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all notifications as read', async () => {
            mockNotificationClient.markAllAsRead.mockResolvedValue({});

            const req = { user: { id: 'user-1' } };
            await controller.markAllAsRead(req);

            expect(mockNotificationClient.markAllAsRead).toHaveBeenCalledWith('user-1');
        });
    });

    describe('delete', () => {
        it('should delete a notification', async () => {
            mockNotificationClient.deleteNotification.mockResolvedValue({});

            const req = { user: { id: 'user-1' } };
            await controller.delete('notif-1', req);

            expect(mockNotificationClient.deleteNotification).toHaveBeenCalledWith('notif-1', 'user-1');
        });
    });
});
