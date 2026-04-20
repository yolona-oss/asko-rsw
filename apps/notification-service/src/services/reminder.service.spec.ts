jest.mock('@mikro-orm/postgresql', () => ({
    EntityManager: jest.fn(),
    FilterQuery: jest.fn(),
    CreateRequestContext: () => (_target: any, _key: string, descriptor: PropertyDescriptor) => descriptor,
}));

jest.mock('entities/reminder-job.entity', () => ({
    ReminderJobEntity: class ReminderJobEntity {},
}));

jest.mock('entities/notification.entity', () => ({
    NotificationEntity: class NotificationEntity {},
}));

jest.mock('./notification.service', () => ({
    NotificationService: class NotificationService {},
}));

import { ReminderService } from './reminder.service';
import { ReminderJobEntity } from 'entities/reminder-job.entity';

describe('ReminderService', () => {
    let service: ReminderService;
    let mockEm: {
        create: jest.Mock;
        findOne: jest.Mock;
        find: jest.Mock;
        persistAndFlush: jest.Mock;
        flush: jest.Mock;
    };
    let mockNotificationService: {
        hasUnreadForTarget: jest.Mock;
        createNotification: jest.Mock;
    };
    let mockConfig: { reminders: { sweepBatchSize: number } };

    beforeEach(() => {
        mockEm = {
            create: jest.fn((_entity: any, data: any) => ({ ...data })),
            findOne: jest.fn(),
            find: jest.fn(),
            persistAndFlush: jest.fn().mockResolvedValue(undefined),
            flush: jest.fn().mockResolvedValue(undefined),
        };
        mockNotificationService = {
            hasUnreadForTarget: jest.fn(),
            createNotification: jest.fn().mockResolvedValue(undefined),
        };
        mockConfig = { reminders: { sweepBatchSize: 100 } };

        service = new ReminderService(
            mockEm as any,
            mockNotificationService as any,
            mockConfig as any,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('scheduleReminder', () => {
        const baseParams = {
            kind: 'payment_unpaid' as const,
            targetType: 'payment',
            targetId: 'p1',
            recipientUserIds: ['u1'],
            notificationType: 'invoice_unpaid_reminder',
            title: 'Счёт ещё не оплачен',
            body: 'Оплатите счёт',
            intervalMs: 1000,
            maxFires: 3,
        };

        it('should create a new reminder when none active exists', async () => {
            mockEm.findOne.mockResolvedValue(null);

            const result = await service.scheduleReminder(baseParams);

            expect(mockEm.findOne).toHaveBeenCalledWith(ReminderJobEntity, {
                kind: 'payment_unpaid',
                targetType: 'payment',
                targetId: 'p1',
                status: 'active',
            });
            expect(mockEm.create).toHaveBeenCalled();
            expect(mockEm.persistAndFlush).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect((result as any).kind).toBe('payment_unpaid');
            expect((result as any).recipientUserIds).toEqual(['u1']);
        });

        it('should dedupe when an active reminder already exists', async () => {
            const existing = { id: 'existing-1', kind: 'payment_unpaid', status: 'active' };
            mockEm.findOne.mockResolvedValue(existing);

            const result = await service.scheduleReminder(baseParams);

            expect(result).toBe(existing);
            expect(mockEm.create).not.toHaveBeenCalled();
            expect(mockEm.persistAndFlush).not.toHaveBeenCalled();
        });

        it('should dedupe recipientUserIds and strip falsy values', async () => {
            mockEm.findOne.mockResolvedValue(null);

            const result = await service.scheduleReminder({
                ...baseParams,
                recipientUserIds: ['u1', 'u2', 'u1', '', undefined as any, 'u3'],
            });

            expect((result as any).recipientUserIds).toEqual(['u1', 'u2', 'u3']);
        });

        it('should throw when no recipients provided', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await expect(
                service.scheduleReminder({ ...baseParams, recipientUserIds: [] }),
            ).rejects.toThrow(/no recipients/);
        });

        it('should use firstFireAt when provided', async () => {
            mockEm.findOne.mockResolvedValue(null);
            const firstFireAt = new Date('2026-05-01T00:00:00Z');

            const result = await service.scheduleReminder({ ...baseParams, firstFireAt });

            expect((result as any).nextFireAt).toEqual(firstFireAt);
        });
    });

    describe('cancelReminder', () => {
        it('should bulk update all matching active jobs', async () => {
            const jobs = [
                { id: 'j1', status: 'active', cancelReason: undefined },
                { id: 'j2', status: 'active', cancelReason: undefined },
            ];
            mockEm.find.mockResolvedValue(jobs);

            const count = await service.cancelReminder('payment', 'p1', 'payment.paid');

            expect(count).toBe(2);
            expect(mockEm.find).toHaveBeenCalledWith(ReminderJobEntity, {
                targetType: 'payment',
                targetId: 'p1',
                status: 'active',
            });
            for (const j of jobs) {
                expect(j.status).toBe('cancelled');
                expect(j.cancelReason).toBe('payment.paid');
            }
            expect(mockEm.flush).toHaveBeenCalled();
        });

        it('should filter by kinds when provided', async () => {
            mockEm.find.mockResolvedValue([]);

            await service.cancelReminder('repair', 'r1', 'repair.completed', [
                'repair_assignment_pending',
                'repair_in_progress_stuck',
            ]);

            expect(mockEm.find).toHaveBeenCalledWith(ReminderJobEntity, {
                targetType: 'repair',
                targetId: 'r1',
                status: 'active',
                kind: { $in: ['repair_assignment_pending', 'repair_in_progress_stuck'] },
            });
        });

        it('should return 0 and skip flush when no matches', async () => {
            mockEm.find.mockResolvedValue([]);

            const count = await service.cancelReminder('payment', 'p1', 'payment.paid');

            expect(count).toBe(0);
            expect(mockEm.flush).not.toHaveBeenCalled();
        });
    });

    describe('fireDueReminders', () => {
        const makeJob = (overrides: Partial<any> = {}) => ({
            id: 'job-1',
            kind: 'payment_unpaid',
            targetType: 'payment',
            targetId: 'p1',
            recipientUserIds: ['u1'],
            notificationType: 'invoice_unpaid_reminder',
            title: 'T',
            body: 'B',
            metadata: { paymentId: 'p1' },
            intervalMs: 1000,
            maxFires: 3,
            fireCount: 0,
            status: 'active',
            nextFireAt: new Date(Date.now() - 1000),
            ...overrides,
        });

        it('should fire a notification, bump fireCount, and advance nextFireAt', async () => {
            const job = makeJob();
            mockEm.find.mockResolvedValue([job]);
            mockNotificationService.hasUnreadForTarget.mockResolvedValue(false);

            const before = Date.now();
            await service.fireDueReminders();

            expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'u1',
                    type: 'invoice_unpaid_reminder',
                    title: 'T',
                    body: 'B',
                    targetType: 'payment',
                    targetId: 'p1',
                    metadata: expect.objectContaining({ paymentId: 'p1', reminderAttempt: 1 }),
                }),
            );
            expect(job.fireCount).toBe(1);
            expect(job.nextFireAt.getTime()).toBeGreaterThanOrEqual(before + job.intervalMs - 50);
            expect(job.status).toBe('active');
            expect(mockEm.flush).toHaveBeenCalled();
        });

        it('should skip recipients with unread prior and NOT bump fireCount when all skipped', async () => {
            const job = makeJob({ recipientUserIds: ['u1', 'u2'] });
            mockEm.find.mockResolvedValue([job]);
            mockNotificationService.hasUnreadForTarget.mockResolvedValue(true);

            await service.fireDueReminders();

            expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
            expect(job.fireCount).toBe(0);
            expect(job.status).toBe('active');
        });

        it('should bump fireCount when at least one recipient fires', async () => {
            const job = makeJob({ recipientUserIds: ['u1', 'u2'] });
            mockEm.find.mockResolvedValue([job]);
            mockNotificationService.hasUnreadForTarget
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false);

            await service.fireDueReminders();

            expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(1);
            expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'u2',
                    metadata: expect.objectContaining({ reminderAttempt: 1 }),
                }),
            );
            expect(job.fireCount).toBe(1);
        });

        it('should mark job as exhausted when fireCount reaches maxFires', async () => {
            const job = makeJob({ fireCount: 2, maxFires: 3 });
            mockEm.find.mockResolvedValue([job]);
            mockNotificationService.hasUnreadForTarget.mockResolvedValue(false);

            await service.fireDueReminders();

            expect(job.fireCount).toBe(3);
            expect(job.status).toBe('exhausted');
        });

        it('should return early when no due jobs', async () => {
            mockEm.find.mockResolvedValue([]);

            await service.fireDueReminders();

            expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
            expect(mockEm.flush).not.toHaveBeenCalled();
        });

        it('should continue processing remaining jobs if one throws', async () => {
            const job1 = makeJob({ id: 'j1' });
            const job2 = makeJob({ id: 'j2', recipientUserIds: ['u2'] });
            mockEm.find.mockResolvedValue([job1, job2]);
            mockNotificationService.hasUnreadForTarget.mockResolvedValue(false);
            mockNotificationService.createNotification
                .mockRejectedValueOnce(new Error('boom'))
                .mockResolvedValueOnce(undefined);

            await service.fireDueReminders();

            expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(2);
            expect(job2.fireCount).toBe(1);
            expect(mockEm.flush).toHaveBeenCalled();
        });
    });
});
