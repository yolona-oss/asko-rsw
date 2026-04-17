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
            dbEntityNotFound: (msg?: string) => new MockAppError(605, { message: msg }),
            badRequest: (msg?: string) => new MockAppError(400, { message: msg }),
            conflict: (msg?: string) => new MockAppError(409, { message: msg }),
            repairInvalidStatus: (msg?: string) => new MockAppError(1001, { message: msg }),
        },
    };
});

jest.mock('./repair-request-state-machine', () => {
    const actual = jest.requireActual('./repair-request-state-machine');
    return {
        ...actual,
        assertTransition: jest.fn(actual.assertTransition),
        assertActionTransition: jest.fn(actual.assertActionTransition),
        canTransition: jest.fn(actual.canTransition),
    };
});

jest.mock('../entities/repair-request.entity', () => ({ RepairRequest: class RepairRequest {} }));
jest.mock('modules/device/entities/user-device.entity', () => ({ UserDevice: class UserDevice {} }));
jest.mock('modules/certificate/entities/certificate.entity', () => ({ Certificate: class Certificate {} }));
jest.mock('modules/repairer/entities/repairer.entity', () => ({ Repairer: class Repairer {} }));
jest.mock('modules/device/entities/address.entity', () => ({ Address: class Address {} }));
jest.mock('../entities/work-step.entity', () => ({ WorkStep: class WorkStep {} }));
jest.mock('modules/schedule/entities/wschedule.entity', () => ({
    WSchedule: class WSchedule {},
    ScheduleEntryType: { VACATION: 'vacation', SICK_LEAVE: 'sick_leave', EXTRA_DAY: 'extra_day', OVERTIME: 'overtime' },
    ScheduleStatus: { APPROVED: 'approved' },
}));
jest.mock('../entities/broken-part.entity', () => ({ BrokenPart: class BrokenPart {} }));
jest.mock('modules/device/entities/device-part.entity', () => ({ DevicePart: class DevicePart {} }));

// Mock service imports to cut off transitive entity chains (uuid ESM)
jest.mock('./broken-part.service', () => ({ BrokenPartService: jest.fn() }));
jest.mock('modules/certificate/services/certificate.service', () => ({ CertificateService: jest.fn() }));
jest.mock('modules/shared-services/services/signature.service', () => ({ SignatureService: jest.fn() }));
jest.mock('modules/schedule/services/wschedule.service', () => ({ WScheduleService: jest.fn() }));
jest.mock('modules/schedule/services/wschedule-pattern.service', () => ({ WSchedulePatternService: jest.fn() }));
jest.mock('modules/payment-command.service', () => ({ PaymentCommandService: jest.fn() }));
jest.mock('services/repair-event.service', () => ({
    RepairEventService: jest.fn(),
    RepairEventType: {
        STATUS_CHANGED: 'repair.status_changed',
        ASSIGNED: 'repair.assigned',
        TRANSFERRED: 'repair.transferred',
        COMPLETED: 'repair.completed',
    },
}));

import { RepairRequestStatus, PaymentTargetType, AvrStatus } from '@asko/shared';
import { RepairRequestService } from './repair-request.service';

const S = RepairRequestStatus;

function createMockEm() {
    return {
        findOne: jest.fn(),
        find: jest.fn(),
        findAndCount: jest.fn(),
        create: jest.fn((_, data: any) => ({ id: 'new-id', ...data })),
        persist: jest.fn(),
        persistAndFlush: jest.fn(),
        flush: jest.fn(),
        removeAndFlush: jest.fn(),
        count: jest.fn(),
        getReference: jest.fn((_entity: any, id: string) => ({ id })),
    };
}

function createMockDeps() {
    return {
        paymentCommandService: {
            emitCreateInvoice: jest.fn(),
            emitRefundTarget: jest.fn(),
        },
        repairEventService: {
            emit: jest.fn(),
        },
        brokenPartService: {
            addBrokenPartsOnCreate: jest.fn(),
            cleanupSuggestions: jest.fn(),
        },
        certificateService: {
            validateCertificateForRequest: jest.fn(),
        },
        signatureService: {
            sign: jest.fn().mockReturnValue('mock-signature'),
        },
        scheduleService: {
            recordExtraDay: jest.fn(),
            recordOvertime: jest.fn(),
            findBlockingToday: jest.fn().mockResolvedValue(null),
            getTodayOvertimeMinutes: jest.fn().mockResolvedValue(0),
            assertScheduleAllows: jest.fn(),
            assertEnoughScheduleTime: jest.fn(),
            ensureExtraDayIfOff: jest.fn(),
            assertPresenceAllowed: jest.fn(),
        },
    };
}

function makeRequest(overrides: Record<string, any> = {}) {
    return {
        id: 'req-1',
        userId: 'user-1',
        status: S.PENDING,
        repairer: undefined,
        managerId: undefined,
        certificate: undefined,
        certificateValid: true,
        certificateSnapshot: undefined,
        address: undefined,
        conversationId: undefined,
        chatCloseAt: undefined as Date | undefined,
        totalCost: undefined,
        completionNote: undefined,
        statusBeforePause: undefined,
        refundRequested: false,
        refundReason: undefined,
        refuseReason: undefined,
        completionSignature: undefined,
        completionSignedPayload: undefined,
        acceptanceSignature: undefined,
        acceptanceSignedPayload: undefined,
        description: 'Broken screen',
        statusTimestamps: [],
        avrStatus: AvrStatus.NONE,
        ...overrides,
    };
}

function makeRepairer(overrides: Record<string, any> = {}) {
    return {
        id: 'rep-1',
        userId: 'repairer-user-1',
        isActive: true,
        completedRepairs: 5,
        ...overrides,
    };
}

describe('RepairRequestService', () => {
    let service: RepairRequestService;
    let mockEm: ReturnType<typeof createMockEm>;
    let deps: ReturnType<typeof createMockDeps>;

    beforeEach(() => {
        mockEm = createMockEm();
        deps = createMockDeps();
        service = new RepairRequestService(
            mockEm as any,
            deps.paymentCommandService as any,
            deps.repairEventService as any,
            deps.brokenPartService as any,
            deps.certificateService as any,
            deps.signatureService as any,
            deps.scheduleService as any,
            { generate: jest.fn().mockResolvedValue(Buffer.from('mock-pdf')) } as any,
        );
        jest.clearAllMocks();

        // Default mocks: schedule checks pass (no blocks, no overtime cap hit, no concurrent cap hit)
        mockEm.find.mockResolvedValue([]);
        mockEm.count.mockResolvedValue(0);
    });

    // ── create ──

    describe('create', () => {
        const dto = { userDeviceId: 'ud-1', description: 'Broken screen' };

        it('creates a repair request in PENDING status', async () => {
            mockEm.findOne
                .mockResolvedValueOnce({ id: 'ud-1', userId: 'user-1', address: undefined }) // userDevice
                .mockResolvedValueOnce(null); // no active request
            mockEm.persistAndFlush.mockResolvedValue(undefined);

            await service.create('user-1', dto);

            expect(mockEm.create).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ userId: 'user-1', status: S.PENDING }),
            );
            expect(mockEm.persistAndFlush).toHaveBeenCalled();
            expect(deps.repairEventService.emit).toHaveBeenCalledWith(
                expect.objectContaining({ newStatus: S.PENDING }),
            );
        });

        it('throws if user device not found', async () => {
            mockEm.findOne.mockResolvedValueOnce(null);

            await expect(service.create('user-1', dto)).rejects.toThrow('User device not found');
        });

        it('throws if user device belongs to another user', async () => {
            mockEm.findOne.mockResolvedValueOnce({ id: 'ud-1', userId: 'other-user', address: undefined });

            await expect(service.create('user-1', dto)).rejects.toThrow('User device not found');
        });

        it('throws if device already has active repair', async () => {
            mockEm.findOne
                .mockResolvedValueOnce({ id: 'ud-1', userId: 'user-1', address: undefined })
                .mockResolvedValueOnce({ id: 'existing-req' });

            await expect(service.create('user-1', dto)).rejects.toThrow(
                'Для этого устройства уже существует активная заявка на ремонт',
            );
        });

        it('adds broken parts when provided', async () => {
            const dtoWithParts = {
                ...dto,
                brokenParts: [{ name: 'Screen' }],
            };
            mockEm.findOne
                .mockResolvedValueOnce({ id: 'ud-1', userId: 'user-1', address: undefined })
                .mockResolvedValueOnce(null);
            mockEm.persistAndFlush.mockResolvedValue(undefined);

            await service.create('user-1', dtoWithParts);

            expect(deps.brokenPartService.addBrokenPartsOnCreate).toHaveBeenCalledWith(
                'new-id',
                [{ name: 'Screen' }],
            );
        });

        it('attaches certificate with certificateValid=false on soft validation error', async () => {
            const dtoWithCert = { ...dto, certificateId: 'cert-1' };
            const fakeCert = { id: 'cert-1' };

            mockEm.findOne
                .mockResolvedValueOnce({ id: 'ud-1', userId: 'user-1', address: undefined })
                .mockResolvedValueOnce(null);
            deps.certificateService.validateCertificateForRequest.mockResolvedValue({
                ok: false,
                reason: 'not_paid',
                certificate: fakeCert,
            });
            mockEm.persistAndFlush.mockResolvedValue(undefined);

            await service.create('user-1', dtoWithCert);

            expect(mockEm.create).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ certificate: fakeCert, certificateValid: false }),
            );
        });

        it('throws on hard cert validation error (not_found)', async () => {
            const dtoWithCert = { ...dto, certificateId: 'cert-1' };
            mockEm.findOne
                .mockResolvedValueOnce({ id: 'ud-1', userId: 'user-1', address: undefined })
                .mockResolvedValueOnce(null);
            deps.certificateService.validateCertificateForRequest.mockResolvedValue({
                ok: false,
                reason: 'not_found',
            });

            await expect(service.create('user-1', dtoWithCert)).rejects.toThrow('Certificate not found');
        });

        it('throws on hard cert validation error (wrong_device)', async () => {
            const dtoWithCert = { ...dto, certificateId: 'cert-1' };
            mockEm.findOne
                .mockResolvedValueOnce({ id: 'ud-1', userId: 'user-1', address: undefined })
                .mockResolvedValueOnce(null);
            deps.certificateService.validateCertificateForRequest.mockResolvedValue({
                ok: false,
                reason: 'wrong_device',
            });

            await expect(service.create('user-1', dtoWithCert)).rejects.toThrow(
                'Certificate does not belong to this device',
            );
        });

        it('throws on invalid address', async () => {
            const addressObj = { id: 'addr-1', validationStatus: 'invalid', validationError: 'bad addr' };
            mockEm.findOne
                .mockResolvedValueOnce({ id: 'ud-1', userId: 'user-1', address: addressObj })
                .mockResolvedValueOnce(null);

            await expect(service.create('user-1', dto)).rejects.toThrow('Адрес не прошёл проверку');
        });

        it('throws on pending address', async () => {
            const addressObj = { id: 'addr-1', validationStatus: 'pending' };
            mockEm.findOne
                .mockResolvedValueOnce({ id: 'ud-1', userId: 'user-1', address: addressObj })
                .mockResolvedValueOnce(null);

            await expect(service.create('user-1', dto)).rejects.toThrow('Адрес ещё проходит проверку');
        });
    });

    // ── markPaid ──

    describe('markPaid', () => {
        it('transitions PENDING -> PAID', async () => {
            const request = makeRequest({ status: S.PENDING });
            mockEm.findOne.mockResolvedValue(request);

            const result = await service.markPaid('req-1');

            expect(result.status).toBe(S.PAID);
            expect(mockEm.flush).toHaveBeenCalled();
            expect(deps.repairEventService.emit).toHaveBeenCalledWith(
                expect.objectContaining({ oldStatus: S.PENDING, newStatus: S.PAID }),
            );
        });

        it('throws if request not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await expect(service.markPaid('req-999')).rejects.toThrow('Repair request not found');
        });

        it('throws for invalid transition (e.g. COMPLETED -> PAID)', async () => {
            const request = makeRequest({ status: S.COMPLETED });
            mockEm.findOne.mockResolvedValue(request);

            await expect(service.markPaid('req-1')).rejects.toThrow();
        });
    });

    // ── requestRefund ──

    describe('requestRefund', () => {
        it('transitions to REFUND_REQUESTED and stores reason', async () => {
            const request = makeRequest({ status: S.PAID });
            mockEm.findOne.mockResolvedValue(request);

            const result = await service.requestRefund('user-1', 'req-1', 'Not satisfied');

            expect(result.status).toBe(S.REFUND_REQUESTED);
            expect(result.refundRequested).toBe(true);
            expect(result.refundReason).toBe('Not satisfied');
        });

        it('throws if request not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await expect(service.requestRefund('user-1', 'req-1', 'reason')).rejects.toThrow(
                'Repair request not found',
            );
        });

        it('throws from COMPLETED status', async () => {
            const request = makeRequest({ status: S.COMPLETED });
            mockEm.findOne.mockResolvedValue(request);

            await expect(service.requestRefund('user-1', 'req-1', 'reason')).rejects.toThrow();
        });
    });

    // ── approveRefund ──

    describe('approveRefund', () => {
        it('transitions REFUND_REQUESTED -> REFUNDED and emits refund command', async () => {
            const request = makeRequest({ status: S.REFUND_REQUESTED });
            mockEm.findOne.mockResolvedValue(request);

            const result = await service.approveRefund('req-1');

            expect(result.status).toBe(S.REFUNDED);
            expect(deps.paymentCommandService.emitRefundTarget).toHaveBeenCalledWith(
                'repairRequest', 'req-1',
            );
        });

        it('throws from non-REFUND_REQUESTED status', async () => {
            const request = makeRequest({ status: S.PAID });
            mockEm.findOne.mockResolvedValue(request);

            await expect(service.approveRefund('req-1')).rejects.toThrow();
        });
    });

    // ── denyRefund ──

    describe('denyRefund', () => {
        it('transitions REFUND_REQUESTED -> PAID and clears refundRequested', async () => {
            const request = makeRequest({ status: S.REFUND_REQUESTED, refundRequested: true });
            mockEm.findOne.mockResolvedValue(request);

            const result = await service.denyRefund('req-1');

            expect(result.status).toBe(S.PAID);
            expect(result.refundRequested).toBe(false);
        });

        it('throws from non-REFUND_REQUESTED status', async () => {
            const request = makeRequest({ status: S.PAID });
            mockEm.findOne.mockResolvedValue(request);

            await expect(service.denyRefund('req-1')).rejects.toThrow();
        });
    });

    // ── assignRepairer ──

    describe('assignRepairer', () => {
        it('transitions to ASSIGNED and sets repairer + manager', async () => {
            const request = makeRequest({ status: S.PAID });
            const repairer = makeRepairer();
            mockEm.findOne
                .mockResolvedValueOnce(request)    // request
                .mockResolvedValueOnce(repairer)    // repairer

            const result = await service.assignRepairer('manager-1', 'req-1', 'rep-1');

            expect(result.status).toBe(S.ASSIGNED);
            expect(result.managerId).toBe('manager-1');
            expect(mockEm.getReference).toHaveBeenCalled();
            expect(deps.repairEventService.emit).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: expect.stringContaining('assigned'),
                    repairerId: 'rep-1',
                    managerId: 'manager-1',
                }),
            );
        });

        it('throws if repairer not found', async () => {
            const request = makeRequest({ status: S.PAID });
            mockEm.findOne
                .mockResolvedValueOnce(request)
                .mockResolvedValueOnce(null);

            await expect(service.assignRepairer('manager-1', 'req-1', 'rep-999'))
                .rejects.toThrow('Repairer not found');
        });

        it('throws if repairer is not active', async () => {
            const request = makeRequest({ status: S.PAID });
            const repairer = makeRepairer({ isActive: false });
            mockEm.findOne
                .mockResolvedValueOnce(request)
                .mockResolvedValueOnce(repairer);

            await expect(service.assignRepairer('manager-1', 'req-1', 'rep-1'))
                .rejects.toThrow('Repairer is not active');
        });

        it('throws if repairer is on vacation', async () => {
            const request = makeRequest({ status: S.PAID });
            const repairer = makeRepairer();
            mockEm.findOne
                .mockResolvedValueOnce(request)
                .mockResolvedValueOnce(repairer);
            deps.scheduleService.assertScheduleAllows.mockRejectedValueOnce(new Error('Мастер на отпуске'));

            await expect(service.assignRepairer('manager-1', 'req-1', 'rep-1'))
                .rejects.toThrow('отпуске');
        });

        it('throws for invalid transition (e.g. from COMPLETED)', async () => {
            const request = makeRequest({ status: S.COMPLETED });
            mockEm.findOne.mockResolvedValueOnce(request);

            await expect(service.assignRepairer('manager-1', 'req-1', 'rep-1'))
                .rejects.toThrow();
        });

        it('throws if repairer has too many active requests', async () => {
            const request = makeRequest({ status: S.PAID });
            const repairer = makeRepairer();
            mockEm.findOne
                .mockResolvedValueOnce(request)
                .mockResolvedValueOnce(repairer)
            mockEm.count.mockResolvedValueOnce(3); // at concurrent limit

            await expect(service.assignRepairer('manager-1', 'req-1', 'rep-1'))
                .rejects.toThrow('активных заявок');
        });

        it('throws if repairer is on a rest day', async () => {
            const request = makeRequest({ status: S.PAID });
            const repairer = makeRepairer();
            mockEm.findOne
                .mockResolvedValueOnce(request)
                .mockResolvedValueOnce(repairer);
            deps.scheduleService.assertScheduleAllows.mockRejectedValueOnce(new Error('Сегодня выходной день мастера'));

            await expect(service.assignRepairer('manager-1', 'req-1', 'rep-1'))
                .rejects.toThrow('выходной');
        });
    });

    // ── acceptRequest ──

    describe('acceptRequest', () => {
        it('transitions ASSIGNED -> ACCEPTED and seeds mandatory work steps', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.ASSIGNED, repairer: 'rep-1' });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)   // repairer lookup
                .mockResolvedValueOnce(request);    // request lookup
            mockEm.count
                .mockResolvedValueOnce(0)  // concurrent check
                .mockResolvedValueOnce(0)  // no existing mandatory steps
                .mockResolvedValueOnce(0); // no existing steps at all

            const result = await service.acceptRequest('repairer-user-1', 'req-1');

            expect(result.status).toBe(S.ACCEPTED);
            expect(mockEm.create).toHaveBeenCalledTimes(1);
            expect(mockEm.create).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ title: 'Диагностика', isMandatory: true }),
            );
        });

        it('does not duplicate mandatory steps on re-accept', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.ASSIGNED, repairer: 'rep-1' });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);
            mockEm.count
                .mockResolvedValueOnce(0)  // concurrent check
                .mockResolvedValueOnce(2); // already has mandatory steps

            await service.acceptRequest('repairer-user-1', 'req-1');

            expect(mockEm.create).not.toHaveBeenCalled();
        });

        it('throws if repairer profile not found', async () => {
            mockEm.findOne.mockResolvedValueOnce(null);

            await expect(service.acceptRequest('unknown-user', 'req-1'))
                .rejects.toThrow('Repairer profile not found');
        });

        it('throws if request not assigned to this repairer', async () => {
            const repairer = makeRepairer();
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(null);

            await expect(service.acceptRequest('repairer-user-1', 'req-1'))
                .rejects.toThrow('Repair request not found');
        });
    });

    // ── refuseRequest ──

    describe('refuseRequest', () => {
        it('transitions ASSIGNED -> REFUSED and stores reason', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.ASSIGNED, repairer: 'rep-1' });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);

            const result = await service.refuseRequest('repairer-user-1', 'req-1', 'Too far');

            expect(result.status).toBe(S.REFUSED);
            expect(result.refuseReason).toBe('Too far');
        });

        it('throws from non-ASSIGNED status', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.IN_PROGRESS, repairer: 'rep-1' });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);

            await expect(service.refuseRequest('repairer-user-1', 'req-1', 'reason'))
                .rejects.toThrow();
        });
    });

    // ── startWork ──

    describe('depart', () => {
        it('transitions ACCEPTED -> EN_ROUTE', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.ACCEPTED, repairer: 'rep-1' });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);

            const result = await service.depart('repairer-user-1', 'req-1');

            expect(result.status).toBe(S.EN_ROUTE);
        });

        it('throws from non-ACCEPTED status', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.ASSIGNED, repairer: 'rep-1' });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);

            await expect(service.depart('repairer-user-1', 'req-1')).rejects.toThrow();
        });
    });

    describe('startWork', () => {
        it('transitions EN_ROUTE -> IN_PROGRESS', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.EN_ROUTE, repairer: 'rep-1' });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);

            const result = await service.startWork('repairer-user-1', 'req-1');

            expect(result.status).toBe(S.IN_PROGRESS);
        });

        it('throws from non-EN_ROUTE status', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.ACCEPTED, repairer: 'rep-1' });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);

            await expect(service.startWork('repairer-user-1', 'req-1')).rejects.toThrow();
        });
    });

    // ── setPrice ──

    describe('setPrice', () => {
        it('sets totalCost and emits invoice for IN_PROGRESS request', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.IN_PROGRESS, repairer: 'rep-1', userId: 'user-1' });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);

            const result = await service.setPrice('repairer-user-1', 'req-1', 5000);

            expect(result.totalCost).toBe(5000);
            expect(deps.paymentCommandService.emitCreateInvoice).toHaveBeenCalledWith(
                'user-1', PaymentTargetType.REPAIR_REQUEST, 'req-1', 5000,
            );
        });

        it('throws if request status is not IN_PROGRESS/AWAITING_COMPLETION/COMPLETED', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.ACCEPTED, repairer: 'rep-1' });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);

            await expect(service.setPrice('repairer-user-1', 'req-1', 5000))
                .rejects.toThrow('Price can only be set when request is in progress or completed');
        });
    });

    // ── markAwaitingCompletion ──

    describe('markAwaitingCompletion', () => {
        it('transitions IN_PROGRESS -> AWAITING_COMPLETION', async () => {
            const request = makeRequest({ status: S.IN_PROGRESS });
            mockEm.findOne.mockResolvedValue(request);

            await service.markAwaitingCompletion('req-1');

            expect(request.status).toBe(S.AWAITING_COMPLETION);
            expect(deps.repairEventService.emit).toHaveBeenCalled();
        });

        it('silently skips if request not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await expect(service.markAwaitingCompletion('req-999')).resolves.toBeUndefined();
        });

        it('silently skips if transition not allowed', async () => {
            const request = makeRequest({ status: S.PENDING });
            mockEm.findOne.mockResolvedValue(request);

            await service.markAwaitingCompletion('req-1');

            expect(request.status).toBe(S.PENDING); // unchanged
            expect(mockEm.flush).not.toHaveBeenCalled();
        });
    });

    // ── complete ──

    describe('complete', () => {
        it('transitions IN_PROGRESS -> COMPLETED with signature', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({
                status: S.IN_PROGRESS,
                totalCost: 5000,
                repairer,
            });
            mockEm.findOne
                .mockResolvedValueOnce(request)     // main request lookup
                .mockResolvedValueOnce(repairer)     // repairer stats update
            mockEm.find.mockResolvedValue([
                { title: 'Диагностика', status: 'completed', order: 1 },
                { title: 'Результат', status: 'completed', order: 2 },
            ]);

            const result = await service.complete('req-1', 'All done');

            expect(result.status).toBe(S.COMPLETED);
            expect(result.completionNote).toBe('All done');
            expect(result.completionSignature).toBe('mock-signature');
            expect(result.completionSignedPayload).toBeDefined();
            expect(repairer.completedRepairs).toBe(6);
        });

        it('throws if totalCost not set', async () => {
            const request = makeRequest({ status: S.IN_PROGRESS, totalCost: undefined });
            mockEm.findOne.mockResolvedValue(request);

            await expect(service.complete('req-1')).rejects.toThrow(
                'Необходимо указать стоимость ремонта перед завершением',
            );
        });

        it('throws from invalid status', async () => {
            const request = makeRequest({ status: S.PENDING, totalCost: 1000 });
            mockEm.findOne.mockResolvedValue(request);

            await expect(service.complete('req-1')).rejects.toThrow();
        });

        it('sets chatCloseAt 30 min from now if conversationId exists', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({
                status: S.IN_PROGRESS,
                totalCost: 5000,
                repairer,
                conversationId: 'conv-1',
            });
            mockEm.findOne
                .mockResolvedValueOnce(request)
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(repairer);
            mockEm.find.mockResolvedValue([]);

            const before = Date.now();
            await service.complete('req-1');
            const after = Date.now();

            expect(request.chatCloseAt).toBeInstanceOf(Date);
            const closeTime = request.chatCloseAt!.getTime();
            expect(closeTime).toBeGreaterThanOrEqual(before + 30 * 60 * 1000);
            expect(closeTime).toBeLessThanOrEqual(after + 30 * 60 * 1000);
        });

        it('freezes certificate snapshot on completion', async () => {
            const cert = {
                id: 'cert-1',
                certificateNumber: 'CN-001',
                status: 'active',
                issuedAt: new Date('2025-01-01'),
                expiresAt: new Date('2026-01-01'),
                signedPayload: 'payload',
                signature: 'sig',
            };
            const repairer = makeRepairer();
            const request = makeRequest({
                status: S.IN_PROGRESS,
                totalCost: 5000,
                repairer,
                certificate: cert,
                certificateValid: true,
            });
            mockEm.findOne
                .mockResolvedValueOnce(request)
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(repairer);
            mockEm.find.mockResolvedValue([]);

            await service.complete('req-1');

            expect(request.certificateSnapshot).toMatchObject({
                id: 'cert-1',
                certificateNumber: 'CN-001',
                status: 'active',
            });
        });
    });

    // ── acceptCompletion ──

    describe('acceptCompletion', () => {
        it('creates acceptance signature for completed request', async () => {
            const request = makeRequest({ status: S.COMPLETED });
            mockEm.findOne.mockResolvedValue(request);

            const result = await service.acceptCompletion('user-1', 'req-1');

            expect(result.acceptanceSignature).toBe('mock-signature');
            expect(result.acceptanceSignedPayload).toBeDefined();
        });

        it('throws if request not completed', async () => {
            const request = makeRequest({ status: S.IN_PROGRESS });
            mockEm.findOne.mockResolvedValue(request);

            await expect(service.acceptCompletion('user-1', 'req-1'))
                .rejects.toThrow('Can only accept completed repairs');
        });

        it('throws if already accepted', async () => {
            const request = makeRequest({
                status: S.COMPLETED,
                acceptanceSignature: 'existing-sig',
            });
            mockEm.findOne.mockResolvedValue(request);

            await expect(service.acceptCompletion('user-1', 'req-1'))
                .rejects.toThrow('Repair already accepted');
        });
    });

    // ── pause ──

    describe('pause', () => {
        it('transitions ACCEPTED -> PAUSED and stores statusBeforePause', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.ACCEPTED, repairer: 'rep-1' });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);

            const result = await service.pause('repairer-user-1', 'req-1');

            expect(result.status).toBe(S.PAUSED);
            expect(result.statusBeforePause).toBe(S.ACCEPTED);
        });

        it('transitions IN_PROGRESS -> PAUSED', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.IN_PROGRESS, repairer: 'rep-1' });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);

            const result = await service.pause('repairer-user-1', 'req-1');

            expect(result.status).toBe(S.PAUSED);
            expect(result.statusBeforePause).toBe(S.IN_PROGRESS);
        });

        it('throws from invalid status', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.ASSIGNED, repairer: 'rep-1' });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);

            await expect(service.pause('repairer-user-1', 'req-1')).rejects.toThrow();
        });
    });

    // ── resume ──

    describe('resume', () => {
        it('resumes to statusBeforePause', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({
                status: S.PAUSED,
                repairer: 'rep-1',
                statusBeforePause: S.IN_PROGRESS,
            });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);

            const result = await service.resume('repairer-user-1', 'req-1');

            expect(result.status).toBe(S.IN_PROGRESS);
            expect(result.statusBeforePause).toBeUndefined();
        });

        it('defaults to IN_PROGRESS if statusBeforePause is missing', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({
                status: S.PAUSED,
                repairer: 'rep-1',
                statusBeforePause: undefined,
            });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);

            const result = await service.resume('repairer-user-1', 'req-1');

            expect(result.status).toBe(S.IN_PROGRESS);
        });

        it('throws from non-PAUSED status', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.IN_PROGRESS, repairer: 'rep-1' });
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);

            await expect(service.resume('repairer-user-1', 'req-1')).rejects.toThrow();
        });

        it('throws if schedule has ended (rest day)', async () => {
            const repairer = makeRepairer();
            mockEm.findOne.mockResolvedValueOnce(repairer);
            deps.scheduleService.assertScheduleAllows.mockRejectedValueOnce(new Error('Сегодня выходной день мастера'));

            await expect(service.resume('repairer-user-1', 'req-1'))
                .rejects.toThrow('выходной');
        });

        it('throws if repairer is on vacation', async () => {
            const repairer = makeRepairer();
            mockEm.findOne.mockResolvedValueOnce(repairer);
            deps.scheduleService.assertScheduleAllows.mockRejectedValueOnce(new Error('Мастер на отпуске'));

            await expect(service.resume('repairer-user-1', 'req-1'))
                .rejects.toThrow('отпуске');
        });
    });

    // ── reassign ──

    describe('reassign', () => {
        it('transfers request to new repairer and resets status to ASSIGNED', async () => {
            const oldRepairer = makeRepairer({ id: 'rep-old', userId: 'old-user' });
            const newRepairer = makeRepairer({ id: 'rep-new', userId: 'new-user' });
            const request = makeRequest({
                status: S.IN_PROGRESS,
                repairer: oldRepairer,
            });
            mockEm.findOne
                .mockResolvedValueOnce(request)       // request lookup
                .mockResolvedValueOnce(newRepairer)    // new repairer lookup

            const result = await service.reassign('manager-1', 'req-1', 'rep-new');

            expect(result.status).toBe(S.ASSIGNED);
            expect(result.managerId).toBe('manager-1');
            expect(result.statusBeforePause).toBeUndefined();
            expect(result.refuseReason).toBeUndefined();
        });

        it('throws if trying to reassign to same repairer', async () => {
            const oldRepairer = makeRepairer({ id: 'rep-1' });
            const request = makeRequest({
                status: S.IN_PROGRESS,
                repairer: oldRepairer,
            });
            mockEm.findOne.mockResolvedValueOnce(request);

            await expect(service.reassign('manager-1', 'req-1', 'rep-1'))
                .rejects.toThrow('Нельзя передать заявку текущему мастеру');
        });

        it('throws if request has no current repairer', async () => {
            const request = makeRequest({
                status: S.IN_PROGRESS,
                repairer: undefined,
            });
            mockEm.findOne.mockResolvedValueOnce(request);

            await expect(service.reassign('manager-1', 'req-1', 'rep-new'))
                .rejects.toThrow('Нельзя передать заявку без текущего мастера');
        });

        it('throws if new repairer not active', async () => {
            const oldRepairer = makeRepairer({ id: 'rep-old' });
            const newRepairer = makeRepairer({ id: 'rep-new', isActive: false });
            const request = makeRequest({
                status: S.IN_PROGRESS,
                repairer: oldRepairer,
            });
            mockEm.findOne
                .mockResolvedValueOnce(request)
                .mockResolvedValueOnce(newRepairer);

            await expect(service.reassign('manager-1', 'req-1', 'rep-new'))
                .rejects.toThrow('Repairer is not active');
        });

        it('throws from terminal status (COMPLETED)', async () => {
            const oldRepairer = makeRepairer({ id: 'rep-old' });
            const request = makeRequest({
                status: S.COMPLETED,
                repairer: oldRepairer,
            });
            mockEm.findOne.mockResolvedValueOnce(request);

            await expect(service.reassign('manager-1', 'req-1', 'rep-new'))
                .rejects.toThrow();
        });
    });

    // ── cancel ──

    describe('cancel', () => {
        it('transitions to CANCELLED', async () => {
            const request = makeRequest({ status: S.PENDING });
            mockEm.findOne.mockResolvedValue(request);

            const result = await service.cancel('user-1', 'req-1');

            expect(result.status).toBe(S.CANCELLED);
            expect(deps.repairEventService.emit).toHaveBeenCalledWith(
                expect.objectContaining({ newStatus: S.CANCELLED }),
            );
        });

        it('throws from COMPLETED status', async () => {
            const request = makeRequest({ status: S.COMPLETED });
            mockEm.findOne.mockResolvedValue(request);

            await expect(service.cancel('user-1', 'req-1')).rejects.toThrow();
        });

        it('throws from IN_PROGRESS status', async () => {
            const request = makeRequest({ status: S.IN_PROGRESS });
            mockEm.findOne.mockResolvedValue(request);

            await expect(service.cancel('user-1', 'req-1')).rejects.toThrow();
        });

        it('throws if request not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await expect(service.cancel('user-1', 'req-999'))
                .rejects.toThrow('Repair request not found');
        });
    });

    // ── Query methods ──

    describe('findById', () => {
        it('returns request with populated relations', async () => {
            const request = makeRequest();
            mockEm.findOne.mockResolvedValue(request);

            const result = await service.findById('req-1');

            expect(result).toBe(request);
            expect(mockEm.findOne).toHaveBeenCalledWith(
                expect.anything(),
                { id: 'req-1' },
                expect.objectContaining({ populate: expect.any(Array) }),
            );
        });

        it('throws if not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await expect(service.findById('req-999')).rejects.toThrow('Repair request not found');
        });
    });

    describe('findByUser', () => {
        it('returns paginated results for user', async () => {
            const requests = [makeRequest()];
            mockEm.findAndCount.mockResolvedValue([requests, 1]);

            const result = await service.findByUser('user-1', { page: 1, limit: 10 });

            expect(result).toEqual({ data: requests, total: 1 });
            expect(mockEm.findAndCount).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ userId: 'user-1' }),
                expect.objectContaining({ limit: 10, offset: 0 }),
            );
        });

        it('applies status filter', async () => {
            mockEm.findAndCount.mockResolvedValue([[], 0]);

            await service.findByUser('user-1', { status: 'pending' });

            expect(mockEm.findAndCount).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ userId: 'user-1', status: 'pending' }),
                expect.anything(),
            );
        });

        it('applies multi-status filter with comma separator', async () => {
            mockEm.findAndCount.mockResolvedValue([[], 0]);

            await service.findByUser('user-1', { status: 'pending,paid' });

            expect(mockEm.findAndCount).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ status: { $in: ['pending', 'paid'] } }),
                expect.anything(),
            );
        });

        it('applies search filter', async () => {
            mockEm.findAndCount.mockResolvedValue([[], 0]);

            await service.findByUser('user-1', { search: 'screen' });

            expect(mockEm.findAndCount).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    $or: [{ description: { $ilike: '%screen%' } }],
                }),
                expect.anything(),
            );
        });
    });

    describe('findAll', () => {
        it('returns paginated results', async () => {
            mockEm.findAndCount.mockResolvedValue([[], 0]);

            const result = await service.findAll({ page: 2, limit: 5 });

            expect(result).toEqual({ data: [], total: 0 });
            expect(mockEm.findAndCount).toHaveBeenCalledWith(
                expect.anything(),
                {},
                expect.objectContaining({ limit: 5, offset: 5 }),
            );
        });
    });

    describe('checkActiveForDevice', () => {
        it('returns hasActive: true when active request exists', async () => {
            const request = makeRequest({ status: S.IN_PROGRESS });
            mockEm.findOne.mockResolvedValue(request);

            const result = await service.checkActiveForDevice('ud-1');

            expect(result).toEqual({ hasActive: true, request });
        });

        it('returns hasActive: false when no active request', async () => {
            mockEm.findOne.mockResolvedValue(null);

            const result = await service.checkActiveForDevice('ud-1');

            expect(result).toEqual({ hasActive: false, request: undefined });
        });
    });

    describe('setConversationId', () => {
        it('sets conversationId on request', async () => {
            const request = makeRequest();
            mockEm.findOne.mockResolvedValue(request);

            await service.setConversationId('req-1', 'conv-123');

            expect(request.conversationId).toBe('conv-123');
            expect(mockEm.flush).toHaveBeenCalled();
        });

        it('throws if request not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            await expect(service.setConversationId('req-999', 'conv-123'))
                .rejects.toThrow('Repair request not found');
        });
    });

    describe('clearChatCloseAt', () => {
        it('clears chatCloseAt and returns conversationId', async () => {
            const request = makeRequest({
                conversationId: 'conv-1',
                chatCloseAt: new Date(),
            });
            mockEm.findOne.mockResolvedValue(request);

            const result = await service.clearChatCloseAt('req-1');

            expect(result).toBe('conv-1');
            expect(request.chatCloseAt).toBeUndefined();
        });

        it('returns undefined if request not found', async () => {
            mockEm.findOne.mockResolvedValue(null);

            const result = await service.clearChatCloseAt('req-999');

            expect(result).toBeUndefined();
        });
    });

    describe('getRepairersActiveRequestCounts', () => {
        it('returns counts per repairer', async () => {
            mockEm.find.mockResolvedValue([
                { repairer: { id: 'rep-1' }, status: S.IN_PROGRESS },
                { repairer: { id: 'rep-1' }, status: S.ASSIGNED },
                { repairer: { id: 'rep-2' }, status: S.ACCEPTED },
            ]);

            const result = await service.getRepairersActiveRequestCounts(['rep-1', 'rep-2', 'rep-3']);

            expect(result).toEqual([
                { repairerId: 'rep-1', activeRequestCount: 2, currentRequestStatus: S.IN_PROGRESS },
                { repairerId: 'rep-2', activeRequestCount: 1, currentRequestStatus: S.ACCEPTED },
                { repairerId: 'rep-3', activeRequestCount: 0, currentRequestStatus: '' },
            ]);
        });

        it('returns empty array for empty input', async () => {
            const result = await service.getRepairersActiveRequestCounts([]);

            expect(result).toEqual([]);
            expect(mockEm.find).not.toHaveBeenCalled();
        });
    });

    // ── Full lifecycle integration test ──

    describe('lifecycle: happy path', () => {
        it('PENDING -> PAID -> ASSIGNED -> ACCEPTED -> EN_ROUTE -> IN_PROGRESS -> COMPLETED', async () => {
            const repairer = makeRepairer();
            const request = makeRequest();

            // markPaid
            mockEm.findOne.mockResolvedValue(request);
            await service.markPaid('req-1');
            expect(request.status).toBe(S.PAID);

            // assignRepairer
            jest.clearAllMocks();
            mockEm.find.mockResolvedValue([]);
            mockEm.count.mockResolvedValue(0);
            mockEm.findOne
                .mockResolvedValueOnce(request)
                .mockResolvedValueOnce(repairer)
            await service.assignRepairer('mgr-1', 'req-1', 'rep-1');
            expect(request.status).toBe(S.ASSIGNED);

            // acceptRequest
            jest.clearAllMocks();
            mockEm.find.mockResolvedValue([]);
            mockEm.count.mockResolvedValue(0);
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);
            mockEm.count
                .mockResolvedValueOnce(0)  // concurrent check
                .mockResolvedValueOnce(0)  // mandatory steps
                .mockResolvedValueOnce(0); // existing steps
            await service.acceptRequest('repairer-user-1', 'req-1');
            expect(request.status).toBe(S.ACCEPTED);

            // depart
            jest.clearAllMocks();
            mockEm.find.mockResolvedValue([]);
            mockEm.count.mockResolvedValue(0);
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);
            await service.depart('repairer-user-1', 'req-1');
            expect(request.status).toBe(S.EN_ROUTE);

            // startWork
            jest.clearAllMocks();
            mockEm.find.mockResolvedValue([]);
            mockEm.count.mockResolvedValue(0);
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);
            await service.startWork('repairer-user-1', 'req-1');
            expect(request.status).toBe(S.IN_PROGRESS);

            // setPrice
            jest.clearAllMocks();
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);
            await service.setPrice('repairer-user-1', 'req-1', 3000);
            expect(request.totalCost).toBe(3000);

            // complete
            jest.clearAllMocks();
            mockEm.findOne
                .mockResolvedValueOnce(request)
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(repairer);
            mockEm.find.mockResolvedValue([]);
            await service.complete('req-1');
            expect(request.status).toBe(S.COMPLETED);
        });
    });

    describe('lifecycle: pause/resume', () => {
        it('IN_PROGRESS -> PAUSED -> IN_PROGRESS', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.IN_PROGRESS, repairer: 'rep-1' });

            // pause
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);
            await service.pause('repairer-user-1', 'req-1');
            expect(request.status).toBe(S.PAUSED);
            expect(request.statusBeforePause).toBe(S.IN_PROGRESS);

            // resume
            jest.clearAllMocks();
            mockEm.find.mockResolvedValue([]);
            mockEm.count.mockResolvedValue(0);
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);
            await service.resume('repairer-user-1', 'req-1');
            expect(request.status).toBe(S.IN_PROGRESS);
            expect(request.statusBeforePause).toBeUndefined();
        });

        it('EN_ROUTE -> PAUSED -> EN_ROUTE', async () => {
            const repairer = makeRepairer();
            const request = makeRequest({ status: S.EN_ROUTE, repairer: 'rep-1' });

            // pause
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);
            await service.pause('repairer-user-1', 'req-1');
            expect(request.status).toBe(S.PAUSED);
            expect(request.statusBeforePause).toBe(S.EN_ROUTE);

            // resume
            jest.clearAllMocks();
            mockEm.find.mockResolvedValue([]);
            mockEm.count.mockResolvedValue(0);
            mockEm.findOne
                .mockResolvedValueOnce(repairer)
                .mockResolvedValueOnce(request);
            await service.resume('repairer-user-1', 'req-1');
            expect(request.status).toBe(S.EN_ROUTE);
            expect(request.statusBeforePause).toBeUndefined();
        });
    });

    describe('lifecycle: refund flow', () => {
        it('PAID -> REFUND_REQUESTED -> REFUNDED', async () => {
            const request = makeRequest({ status: S.PAID });

            // requestRefund
            mockEm.findOne.mockResolvedValue(request);
            await service.requestRefund('user-1', 'req-1', 'Too expensive');
            expect(request.status).toBe(S.REFUND_REQUESTED);

            // approveRefund
            jest.clearAllMocks();
            mockEm.findOne.mockResolvedValue(request);
            await service.approveRefund('req-1');
            expect(request.status).toBe(S.REFUNDED);
        });

        it('PAID -> REFUND_REQUESTED -> PAID (denied)', async () => {
            const request = makeRequest({ status: S.PAID });

            // requestRefund
            mockEm.findOne.mockResolvedValue(request);
            await service.requestRefund('user-1', 'req-1', 'Changed mind');
            expect(request.status).toBe(S.REFUND_REQUESTED);

            // denyRefund
            jest.clearAllMocks();
            mockEm.findOne.mockResolvedValue(request);
            await service.denyRefund('req-1');
            expect(request.status).toBe(S.PAID);
            expect(request.refundRequested).toBe(false);
        });
    });

    describe('lifecycle: refuse and reassign', () => {
        it('ASSIGNED -> REFUSED, then reassign -> ASSIGNED', async () => {
            const oldRepairer = makeRepairer({ id: 'rep-old', userId: 'old-user' });
            const newRepairer = makeRepairer({ id: 'rep-new', userId: 'new-user' });
            const request = makeRequest({ status: S.ASSIGNED, repairer: 'rep-old' });

            // refuse
            mockEm.findOne
                .mockResolvedValueOnce(oldRepairer)
                .mockResolvedValueOnce(request);
            await service.refuseRequest('old-user', 'req-1', 'No capacity');
            expect(request.status).toBe(S.REFUSED);

            // reassign to new repairer
            jest.clearAllMocks();
            mockEm.find.mockResolvedValue([]);
            mockEm.count.mockResolvedValue(0);
            request.repairer = oldRepairer as any;
            mockEm.findOne
                .mockResolvedValueOnce(request)
                .mockResolvedValueOnce(newRepairer)
            await service.reassign('mgr-1', 'req-1', 'rep-new');
            expect(request.status).toBe(S.ASSIGNED);
        });
    });
});
