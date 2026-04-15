jest.mock('@mikro-orm/postgresql', () => ({
    EntityManager: jest.fn(),
    CreateRequestContext: () => (_target: any, _key: string, descriptor: PropertyDescriptor) => descriptor,
}));

jest.mock('common/error', () => {
    class MockAppError extends Error {
        public errorCode: number;
        constructor(type: number, options?: { message?: string }) {
            super(options?.message ?? 'AppError');
            this.errorCode = type;
        }
    }
    return {
        AppErrors: {
            dbEntityExists: (msg?: string) => new MockAppError(604, { message: msg }),
            dbEntityNotFound: (msg?: string) => new MockAppError(605, { message: msg }),
        },
    };
});

jest.mock('entities/repairer.entity', () => ({
    Repairer: class Repairer {},
}));

import { RepairerService } from './repairer.service';

describe('RepairerService', () => {
    let service: RepairerService;
    let mockEm: {
        findOne: jest.Mock;
        find: jest.Mock;
        findAndCount: jest.Mock;
        create: jest.Mock;
        persist: jest.Mock;
        persistAndFlush: jest.Mock;
        flush: jest.Mock;
        removeAndFlush: jest.Mock;
        count: jest.Mock;
    };

    beforeEach(() => {
        mockEm = {
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            persist: jest.fn(),
            persistAndFlush: jest.fn(),
            flush: jest.fn(),
            removeAndFlush: jest.fn(),
            count: jest.fn(),
        };
        service = new RepairerService(mockEm as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('creates a new repairer when no existing found', async () => {
            const newRepairer = { id: 'rep-1', userId: 'user-1', city: 'Moscow', specializations: ['screens'] };
            mockEm.findOne.mockResolvedValue(null);
            mockEm.create.mockReturnValue(newRepairer);
            mockEm.persistAndFlush.mockResolvedValue(undefined);

            const result = await service.create('user-1', 'Moscow', ['screens']);

            expect(mockEm.findOne).toHaveBeenCalledWith(expect.anything(), { userId: 'user-1' });
            expect(mockEm.create).toHaveBeenCalledWith(expect.anything(), {
                userId: 'user-1',
                city: 'Moscow',
                specializations: ['screens'],
                timezone: expect.any(String),
            });
            expect(mockEm.persistAndFlush).toHaveBeenCalledWith(newRepairer);
            expect(result).toBe(newRepairer);
        });

        it('throws when repairer already exists', async () => {
            mockEm.findOne.mockResolvedValue({ id: 'rep-1', userId: 'user-1' });

            await expect(service.create('user-1', 'Moscow')).rejects.toThrow('Repairer profile already exists');
            expect(mockEm.create).not.toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('updates repairer fields', async () => {
            const repairer = {
                id: 'rep-1',
                city: 'Moscow',
                specializations: ['screens'],
                isActive: true,
            };
            mockEm.findOne.mockResolvedValue(repairer);
            mockEm.flush.mockResolvedValue(undefined);

            const result = await service.update('rep-1', {
                city: 'SPb',
                specializations: ['batteries'],
                isActive: false,
            });

            expect(result.city).toBe('SPb');
            expect(result.specializations).toEqual(['batteries']);
            expect(result.isActive).toBe(false);
            expect(mockEm.flush).toHaveBeenCalled();
        });

        it('only updates provided fields', async () => {
            const repairer = {
                id: 'rep-1',
                city: 'Moscow',
                specializations: ['screens'],
                isActive: true,
            };
            mockEm.findOne.mockResolvedValue(repairer);
            mockEm.flush.mockResolvedValue(undefined);

            const result = await service.update('rep-1', { city: 'SPb' });

            expect(result.city).toBe('SPb');
            expect(result.specializations).toEqual(['screens']);
            expect(result.isActive).toBe(true);
        });

        it('throws when repairer not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await expect(service.update('rep-999', { city: 'SPb' })).rejects.toThrow('Repairer not found');
        });
    });

    describe('updateLocation', () => {
        it('updates latitude and longitude', async () => {
            const repairer = {
                id: 'rep-1',
                userId: 'user-1',
                latitude: undefined as number | undefined,
                longitude: undefined as number | undefined,
                lastLocationUpdate: undefined as Date | undefined,
            };
            mockEm.findOne.mockResolvedValue(repairer);
            mockEm.flush.mockResolvedValue(undefined);

            const result = await service.updateLocation('user-1', 55.7558, 37.6173);

            expect(result.latitude).toBe(55.7558);
            expect(result.longitude).toBe(37.6173);
            expect(result.lastLocationUpdate).toBeInstanceOf(Date);
            expect(mockEm.flush).toHaveBeenCalled();
        });

        it('throws when repairer not found by userId', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await expect(service.updateLocation('user-999', 55.0, 37.0)).rejects.toThrow('Repairer not found');
        });
    });

    describe('getMyProfile', () => {
        it('returns repairer', async () => {
            const repairer = { id: 'rep-1', userId: 'user-1', city: 'Moscow' };
            mockEm.findOne.mockResolvedValue(repairer);

            const result = await service.getMyProfile('user-1');

            expect(result).toBe(repairer);
            expect(mockEm.findOne).toHaveBeenCalledWith(expect.anything(), { userId: 'user-1' });
        });

        it('throws when not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await expect(service.getMyProfile('user-999')).rejects.toThrow('Repairer profile not found');
        });
    });

    describe('findAll', () => {
        it('returns paginated results', async () => {
            const repairers = [
                { id: 'rep-1', city: 'Moscow' },
                { id: 'rep-2', city: 'SPb' },
            ];
            mockEm.findAndCount.mockResolvedValue([repairers, 2]);

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result).toEqual({ data: repairers, total: 2 });
            expect(mockEm.findAndCount).toHaveBeenCalledWith(
                expect.anything(),
                {},
                { limit: 10, offset: 0, orderBy: { createdAt: 'DESC' } },
            );
        });

        it('uses default limit of 20 and page 1', async () => {
            mockEm.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll({});

            expect(mockEm.findAndCount).toHaveBeenCalledWith(
                expect.anything(),
                {},
                { limit: 20, offset: 0, orderBy: { createdAt: 'DESC' } },
            );
        });

        it('calculates offset correctly for page 3', async () => {
            mockEm.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll({ page: 3, limit: 10 });

            expect(mockEm.findAndCount).toHaveBeenCalledWith(
                expect.anything(),
                {},
                { limit: 10, offset: 20, orderBy: { createdAt: 'DESC' } },
            );
        });

        it('applies search filter', async () => {
            mockEm.findAndCount.mockResolvedValue([[], 0]);

            await service.findAll({ search: 'Mosc' });

            expect(mockEm.findAndCount).toHaveBeenCalledWith(
                expect.anything(),
                { $or: [{ city: { $ilike: '%Mosc%' } }] },
                { limit: 20, offset: 0, orderBy: { createdAt: 'DESC' } },
            );
        });
    });

    describe('findById', () => {
        it('returns repairer by id', async () => {
            const repairer = { id: 'rep-1' };
            mockEm.findOne.mockResolvedValue(repairer);

            const result = await service.findById('rep-1');

            expect(result).toBe(repairer);
            expect(mockEm.findOne).toHaveBeenCalledWith(expect.anything(), { id: 'rep-1' });
        });

        it('throws when not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await expect(service.findById('rep-999')).rejects.toThrow('Repairer not found');
        });
    });

    describe('findByUserId', () => {
        it('returns repairer by userId', async () => {
            const repairer = { id: 'rep-1', userId: 'user-1' };
            mockEm.findOne.mockResolvedValue(repairer);

            const result = await service.findByUserId('user-1');

            expect(result).toBe(repairer);
            expect(mockEm.findOne).toHaveBeenCalledWith(expect.anything(), { userId: 'user-1' });
        });

        it('throws when not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await expect(service.findByUserId('user-999')).rejects.toThrow('Repairer not found');
        });
    });

    describe('findActiveInCity', () => {
        it('returns active repairers in a city', async () => {
            const repairers = [
                { id: 'rep-1', city: 'Moscow', isActive: true },
                { id: 'rep-2', city: 'Moscow', isActive: true },
            ];
            mockEm.find.mockResolvedValue(repairers);

            const result = await service.findActiveInCity('Moscow');

            expect(result).toEqual(repairers);
            expect(mockEm.find).toHaveBeenCalledWith(expect.anything(), { city: 'Moscow', isActive: true });
        });
    });

    describe('incrementCompleted', () => {
        it('increments completedRepairs counter', async () => {
            const repairer = { id: 'rep-1', completedRepairs: 5 };
            mockEm.findOne.mockResolvedValue(repairer);
            mockEm.flush.mockResolvedValue(undefined);

            await service.incrementCompleted('rep-1');

            expect(repairer.completedRepairs).toBe(6);
            expect(mockEm.flush).toHaveBeenCalled();
        });

        it('does nothing when not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await service.incrementCompleted('rep-999');

            expect(mockEm.flush).not.toHaveBeenCalled();
        });
    });

    describe('updateLastLocation', () => {
        it('updates latitude, longitude, and lastLocationUpdate', async () => {
            const repairer = {
                id: 'rep-1',
                latitude: undefined as number | undefined,
                longitude: undefined as number | undefined,
                lastLocationUpdate: undefined as Date | undefined,
            };
            mockEm.findOne.mockResolvedValue(repairer);
            mockEm.flush.mockResolvedValue(undefined);

            await service.updateLastLocation('rep-1', 59.9343, 30.3351);

            expect(repairer.latitude).toBe(59.9343);
            expect(repairer.longitude).toBe(30.3351);
            expect(repairer.lastLocationUpdate).toBeInstanceOf(Date);
            expect(mockEm.flush).toHaveBeenCalled();
        });

        it('does nothing when not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await service.updateLastLocation('rep-999', 59.0, 30.0);

            expect(mockEm.flush).not.toHaveBeenCalled();
        });
    });
});
