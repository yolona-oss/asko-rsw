import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { SignedEventPublisher } from '@asko/observability';
import { PaymentEventService, PaymentEventType, PaymentEvent } from './payment-event.service';

describe('PaymentEventService', () => {
    let service: PaymentEventService;
    let notificationClient: { connect: jest.Mock; emit: jest.Mock };
    let repairClient: { connect: jest.Mock; emit: jest.Mock };
    let emMock: Partial<EntityManager>;
    let publisherMock: { emit: jest.Mock };

    beforeEach(async () => {
        notificationClient = {
            connect: jest.fn().mockResolvedValue(undefined),
            emit: jest.fn().mockReturnValue(of(undefined)),
        };
        repairClient = {
            connect: jest.fn().mockResolvedValue(undefined),
            emit: jest.fn().mockReturnValue(of(undefined)),
        };
        emMock = {
            create: jest.fn().mockReturnValue({}),
            persistAndFlush: jest.fn().mockResolvedValue(undefined),
        };
        publisherMock = {
            emit: jest.fn().mockReturnValue(of(undefined)),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentEventService,
                { provide: EntityManager, useValue: emMock },
                { provide: 'EVENTS_SERVICE', useValue: notificationClient },
                { provide: 'REPAIR_EVENTS_SERVICE', useValue: repairClient },
                { provide: SignedEventPublisher, useValue: publisherMock },
            ],
        }).compile();

        service = module.get<PaymentEventService>(PaymentEventService);
    });

    describe('onModuleInit', () => {
        it('should connect both clients', async () => {
            await service.onModuleInit();

            expect(notificationClient.connect).toHaveBeenCalledTimes(1);
            expect(repairClient.connect).toHaveBeenCalledTimes(1);
        });

        it('should not throw if notification client connect fails', async () => {
            notificationClient.connect.mockRejectedValue(new Error('Connection failed'));

            await expect(service.onModuleInit()).resolves.not.toThrow();
            expect(notificationClient.connect).toHaveBeenCalledTimes(1);
            expect(repairClient.connect).toHaveBeenCalledTimes(1);
        });

        it('should not throw if repair client connect fails', async () => {
            repairClient.connect.mockRejectedValue(new Error('Connection failed'));

            await expect(service.onModuleInit()).resolves.not.toThrow();
            expect(notificationClient.connect).toHaveBeenCalledTimes(1);
            expect(repairClient.connect).toHaveBeenCalledTimes(1);
        });

        it('should not throw if both clients fail to connect', async () => {
            notificationClient.connect.mockRejectedValue(new Error('Notification connection failed'));
            repairClient.connect.mockRejectedValue(new Error('Repair connection failed'));

            await expect(service.onModuleInit()).resolves.not.toThrow();
            expect(notificationClient.connect).toHaveBeenCalledTimes(1);
            expect(repairClient.connect).toHaveBeenCalledTimes(1);
        });
    });

    describe('emit', () => {
        const mockEvent: PaymentEvent = {
            type: PaymentEventType.PAYMENT_PAID,
            paymentId: 'pay-123',
            userId: 'user-456',
            targetType: 'repair',
            targetId: 'repair-789',
            amount: 5000,
            currency: 'RUB',
            provider: 'yookassa',
            timestamp: new Date('2026-01-15T10:00:00Z'),
        };

        it('should emit event to both clients with correct event type and data', async () => {
            await service.emit(mockEvent);

            expect(publisherMock.emit).toHaveBeenCalledTimes(2);
            expect(publisherMock.emit).toHaveBeenCalledWith(notificationClient, PaymentEventType.PAYMENT_PAID, mockEvent);
            expect(publisherMock.emit).toHaveBeenCalledWith(repairClient, PaymentEventType.PAYMENT_PAID, mockEvent);
        });

        it('should emit payment.created event to both clients', async () => {
            const createdEvent: PaymentEvent = {
                ...mockEvent,
                type: PaymentEventType.PAYMENT_CREATED,
            };

            await service.emit(createdEvent);

            expect(publisherMock.emit).toHaveBeenCalledWith(notificationClient, PaymentEventType.PAYMENT_CREATED, createdEvent);
            expect(publisherMock.emit).toHaveBeenCalledWith(repairClient, PaymentEventType.PAYMENT_CREATED, createdEvent);
        });

        it('should emit payment.failed event to both clients', async () => {
            const failedEvent: PaymentEvent = {
                ...mockEvent,
                type: PaymentEventType.PAYMENT_FAILED,
            };

            await service.emit(failedEvent);

            expect(publisherMock.emit).toHaveBeenCalledWith(notificationClient, PaymentEventType.PAYMENT_FAILED, failedEvent);
            expect(publisherMock.emit).toHaveBeenCalledWith(repairClient, PaymentEventType.PAYMENT_FAILED, failedEvent);
        });

        it('should emit event with minimal fields', async () => {
            const minimalEvent: PaymentEvent = {
                type: PaymentEventType.WITHDRAW_CREATED,
                paymentId: 'wd-001',
                amount: 3000,
                currency: 'RUB',
                timestamp: new Date('2026-02-01T12:00:00Z'),
            };

            await service.emit(minimalEvent);

            expect(publisherMock.emit).toHaveBeenCalledWith(notificationClient, PaymentEventType.WITHDRAW_CREATED, minimalEvent);
            expect(publisherMock.emit).toHaveBeenCalledWith(repairClient, PaymentEventType.WITHDRAW_CREATED, minimalEvent);
        });
    });
});
