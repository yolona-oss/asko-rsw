jest.mock('@mikro-orm/postgresql', () => ({
    EntityManager: jest.fn(),
    FilterQuery: jest.fn(),
    CreateRequestContext: () => (_target: any, _key: string, descriptor: PropertyDescriptor) => descriptor,
}));

jest.mock('entities/audience-membership.entity', () => ({
    AudienceMembershipEntity: class AudienceMembershipEntity {},
}));

import { AudienceProjectionService, AudienceKey } from './audience-projection.service';
import { AudienceMembershipEntity } from 'entities/audience-membership.entity';

describe('AudienceProjectionService', () => {
    let service: AudienceProjectionService;
    let mockEm: {
        create: jest.Mock;
        findOne: jest.Mock;
        find: jest.Mock;
        count: jest.Mock;
        persist: jest.Mock;
        persistAndFlush: jest.Mock;
        remove: jest.Mock;
        removeAndFlush: jest.Mock;
        flush: jest.Mock;
    };

    beforeEach(() => {
        mockEm = {
            create: jest.fn((_entity: any, data: any) => ({ ...data })),
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            persist: jest.fn(),
            persistAndFlush: jest.fn().mockResolvedValue(undefined),
            remove: jest.fn(),
            removeAndFlush: jest.fn().mockResolvedValue(undefined),
            flush: jest.fn().mockResolvedValue(undefined),
        };
        service = new AudienceProjectionService(mockEm as any);
    });

    afterEach(() => jest.clearAllMocks());

    describe('AudienceKey helpers', () => {
        it('formats role keys', () => {
            expect(AudienceKey.role('ADMIN')).toBe('role:ADMIN');
            expect(AudienceKey.role('MANAGER')).toBe('role:MANAGER');
        });

        it('formats certificate/feed keys', () => {
            expect(AudienceKey.certificateHolder()).toBe('certificate:holder');
            expect(AudienceKey.feed('123')).toBe('feed:123');
        });
    });

    describe('add', () => {
        it('creates a new row when none exists', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await service.add('u1', 'role:ADMIN', 'user.created');

            expect(mockEm.create).toHaveBeenCalledWith(AudienceMembershipEntity, expect.objectContaining({
                userId: 'u1', audienceKey: 'role:ADMIN', source: 'user.created',
            }));
            expect(mockEm.persistAndFlush).toHaveBeenCalled();
        });

        it('is idempotent when the row already exists', async () => {
            const existing = { userId: 'u1', audienceKey: 'role:ADMIN', source: 'old' };
            mockEm.findOne.mockResolvedValue(existing);

            await service.add('u1', 'role:ADMIN', 'user.role_added');

            expect(existing.source).toBe('user.role_added');
            expect(mockEm.create).not.toHaveBeenCalled();
            expect(mockEm.flush).toHaveBeenCalled();
        });
    });

    describe('addMany', () => {
        it('creates rows for missing keys and deduplicates input', async () => {
            mockEm.find.mockResolvedValue([]);

            const created = await service.addMany('u1', ['role:ADMIN', 'role:MANAGER', 'role:ADMIN', ''], 'user.created');

            expect(created).toBe(2);
            expect(mockEm.persist).toHaveBeenCalledTimes(2);
            expect(mockEm.flush).toHaveBeenCalled();
        });

        it('skips keys that already exist (overlap is fine)', async () => {
            mockEm.find.mockResolvedValue([{ userId: 'u1', audienceKey: 'role:MANAGER', source: null }]);

            const created = await service.addMany('u1', ['role:MANAGER', 'role:REPAIRER'], 'user.role_added');

            expect(created).toBe(1);
            expect(mockEm.persist).toHaveBeenCalledTimes(1);
        });

        it('returns 0 when no keys provided', async () => {
            const created = await service.addMany('u1', [], 'src');
            expect(created).toBe(0);
            expect(mockEm.find).not.toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('removes existing row and returns true', async () => {
            const row = { userId: 'u1', audienceKey: 'role:ADMIN' };
            mockEm.findOne.mockResolvedValue(row);

            const removed = await service.remove('u1', 'role:ADMIN');

            expect(removed).toBe(true);
            expect(mockEm.removeAndFlush).toHaveBeenCalledWith(row);
        });

        it('returns false when row not found', async () => {
            mockEm.findOne.mockResolvedValue(null);
            const removed = await service.remove('u1', 'role:ADMIN');
            expect(removed).toBe(false);
            expect(mockEm.removeAndFlush).not.toHaveBeenCalled();
        });
    });

    describe('removeAllForUser', () => {
        it('removes every membership for a user', async () => {
            const rows = [
                { userId: 'u1', audienceKey: 'role:ADMIN' },
                { userId: 'u1', audienceKey: 'role:MANAGER' },
                { userId: 'u1', audienceKey: 'certificate:holder' },
            ];
            mockEm.find.mockResolvedValue(rows);

            const count = await service.removeAllForUser('u1');

            expect(count).toBe(3);
            expect(mockEm.remove).toHaveBeenCalledTimes(3);
            expect(mockEm.flush).toHaveBeenCalled();
        });

        it('returns 0 when user has no memberships', async () => {
            mockEm.find.mockResolvedValue([]);
            const count = await service.removeAllForUser('u1');
            expect(count).toBe(0);
            expect(mockEm.flush).not.toHaveBeenCalled();
        });
    });

    describe('resolve / resolveMany', () => {
        it('returns userIds for a single audience key', async () => {
            mockEm.find.mockResolvedValue([
                { userId: 'u1', audienceKey: 'role:ADMIN' },
                { userId: 'u2', audienceKey: 'role:ADMIN' },
            ]);

            const ids = await service.resolve('role:ADMIN');

            expect(ids).toEqual(['u1', 'u2']);
            expect(mockEm.find).toHaveBeenCalledWith(AudienceMembershipEntity, { audienceKey: 'role:ADMIN' });
        });

        it('unions and dedupes userIds across multiple keys (overlap case)', async () => {
            mockEm.find.mockResolvedValue([
                { userId: 'u1', audienceKey: 'role:ADMIN' },
                { userId: 'u2', audienceKey: 'role:MANAGER' },
                { userId: 'u1', audienceKey: 'role:MANAGER' }, // u1 is in both groups
                { userId: 'u3', audienceKey: 'role:SUPER_ADMIN' },
            ]);

            const ids = await service.resolveMany(['role:ADMIN', 'role:MANAGER', 'role:SUPER_ADMIN']);

            expect(ids.sort()).toEqual(['u1', 'u2', 'u3']);
            expect(mockEm.find).toHaveBeenCalledWith(AudienceMembershipEntity, {
                audienceKey: { $in: ['role:ADMIN', 'role:MANAGER', 'role:SUPER_ADMIN'] },
            });
        });

        it('returns empty array for no keys', async () => {
            const ids = await service.resolveMany([]);
            expect(ids).toEqual([]);
            expect(mockEm.find).not.toHaveBeenCalled();
        });
    });
});
