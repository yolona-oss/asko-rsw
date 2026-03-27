jest.mock('@asko/shared', () => ({
    PresenceStatus: { ONLINE: 'online', OFFLINE: 'offline' },
    UserActivity: { IDLE: 'idle', TYPING: 'typing', UPLOADING_IMAGE: 'uploading_image', UPLOADING_VIDEO: 'uploading_video' },
}));

jest.mock('@mikro-orm/postgresql', () => ({
    EntityManager: jest.fn(),
    CreateRequestContext: () => (_target: any, _key: string, descriptor: PropertyDescriptor) => descriptor,
}));

jest.mock('entities/user-presence.entity', () => ({
    UserPresence: class UserPresence {},
}));

import { PresenceService } from './presence.service';
import { UserPresence } from 'entities/user-presence.entity';

describe('PresenceService', () => {
    let service: PresenceService;
    let mockEm: {
        findOne: jest.Mock;
        find: jest.Mock;
        create: jest.Mock;
        persist: jest.Mock;
        persistAndFlush: jest.Mock;
        flush: jest.Mock;
    };

    beforeEach(() => {
        mockEm = {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            persist: jest.fn(),
            persistAndFlush: jest.fn().mockResolvedValue(undefined),
            flush: jest.fn().mockResolvedValue(undefined),
        };
        service = new PresenceService(mockEm as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('updatePresence', () => {
        it('should create a new presence when none exists for the user', async () => {
            mockEm.findOne.mockResolvedValue(null);
            const createdPresence = {
                userId: 'user-1',
                status: 'online',
                activity: 'idle',
                conversationId: undefined,
                lastSeenAt: expect.any(Date),
            };
            mockEm.create.mockReturnValue(createdPresence);

            await service.updatePresence('user-1', 'online', 'idle');

            expect(mockEm.findOne).toHaveBeenCalledWith(UserPresence, { userId: 'user-1' });
            expect(mockEm.create).toHaveBeenCalledWith(UserPresence, {
                userId: 'user-1',
                status: 'online',
                activity: 'idle',
                conversationId: undefined,
                lastSeenAt: expect.any(Date),
            });
            expect(mockEm.persistAndFlush).toHaveBeenCalledWith(createdPresence);
        });

        it('should create a new presence with conversationId when provided', async () => {
            mockEm.findOne.mockResolvedValue(null);
            const createdPresence = {
                userId: 'user-1',
                status: 'online',
                activity: 'typing',
                conversationId: 'conv-1',
                lastSeenAt: expect.any(Date),
            };
            mockEm.create.mockReturnValue(createdPresence);

            await service.updatePresence('user-1', 'online', 'typing', 'conv-1');

            expect(mockEm.create).toHaveBeenCalledWith(UserPresence, {
                userId: 'user-1',
                status: 'online',
                activity: 'typing',
                conversationId: 'conv-1',
                lastSeenAt: expect.any(Date),
            });
            expect(mockEm.persistAndFlush).toHaveBeenCalledWith(createdPresence);
        });

        it('should update existing presence when one already exists', async () => {
            const existingPresence = {
                userId: 'user-1',
                status: 'offline',
                activity: 'idle',
                conversationId: undefined,
                lastSeenAt: new Date('2025-01-01'),
            };
            mockEm.findOne.mockResolvedValue(existingPresence);

            await service.updatePresence('user-1', 'online', 'typing', 'conv-1');

            expect(existingPresence.status).toBe('online');
            expect(existingPresence.activity).toBe('typing');
            expect(existingPresence.conversationId).toBe('conv-1');
            expect(existingPresence.lastSeenAt).toBeInstanceOf(Date);
            expect(existingPresence.lastSeenAt.getTime()).toBeGreaterThan(new Date('2025-01-01').getTime());
            expect(mockEm.flush).toHaveBeenCalled();
            expect(mockEm.create).not.toHaveBeenCalled();
            expect(mockEm.persistAndFlush).not.toHaveBeenCalled();
        });

        it('should default activity to IDLE when empty string is provided', async () => {
            mockEm.findOne.mockResolvedValue(null);
            mockEm.create.mockReturnValue({});

            await service.updatePresence('user-1', 'online', '');

            expect(mockEm.create).toHaveBeenCalledWith(UserPresence, {
                userId: 'user-1',
                status: 'online',
                activity: 'idle',
                conversationId: undefined,
                lastSeenAt: expect.any(Date),
            });
        });

        it('should default activity to IDLE when updating existing presence with empty activity', async () => {
            const existingPresence = {
                userId: 'user-1',
                status: 'offline',
                activity: 'typing',
                conversationId: undefined,
                lastSeenAt: new Date('2025-01-01'),
            };
            mockEm.findOne.mockResolvedValue(existingPresence);

            await service.updatePresence('user-1', 'online', '');

            expect(existingPresence.activity).toBe('idle');
            expect(mockEm.flush).toHaveBeenCalled();
        });
    });

    describe('getPresence', () => {
        it('should return a presence record when found', async () => {
            const presence = {
                userId: 'user-1',
                status: 'online',
                activity: 'idle',
                lastSeenAt: new Date(),
            };
            mockEm.findOne.mockResolvedValue(presence);

            const result = await service.getPresence('user-1');

            expect(result).toBe(presence);
            expect(mockEm.findOne).toHaveBeenCalledWith(UserPresence, { userId: 'user-1' });
        });

        it('should return null when no presence is found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            const result = await service.getPresence('nonexistent');

            expect(result).toBeNull();
            expect(mockEm.findOne).toHaveBeenCalledWith(UserPresence, { userId: 'nonexistent' });
        });
    });

    describe('getBulkPresence', () => {
        it('should return an empty array for empty input', async () => {
            const result = await service.getBulkPresence([]);

            expect(result).toEqual([]);
            expect(mockEm.find).not.toHaveBeenCalled();
        });

        it('should call find with $in filter for non-empty input', async () => {
            const presences = [
                { userId: 'user-1', status: 'online', activity: 'idle', lastSeenAt: new Date() },
                { userId: 'user-2', status: 'offline', activity: 'idle', lastSeenAt: new Date() },
            ];
            mockEm.find.mockResolvedValue(presences);

            const result = await service.getBulkPresence(['user-1', 'user-2']);

            expect(result).toBe(presences);
            expect(mockEm.find).toHaveBeenCalledWith(UserPresence, {
                userId: { $in: ['user-1', 'user-2'] },
            });
        });

        it('should handle a single user ID', async () => {
            const presences = [{ userId: 'user-1', status: 'online', activity: 'idle', lastSeenAt: new Date() }];
            mockEm.find.mockResolvedValue(presences);

            const result = await service.getBulkPresence(['user-1']);

            expect(result).toBe(presences);
            expect(mockEm.find).toHaveBeenCalledWith(UserPresence, {
                userId: { $in: ['user-1'] },
            });
        });
    });
});
