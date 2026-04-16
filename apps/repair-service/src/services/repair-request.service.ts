import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { RepairRequest } from 'entities/repair-request.entity';
import { UserDevice } from 'entities/user-device.entity';
import { Certificate } from 'entities/certificate.entity';
import { Repairer } from 'entities/repairer.entity';
import { Address } from 'entities/address.entity';
import { RepairRequestStatus, PaymentTargetType, AvrStatus, AvrSigningMethod } from '@asko/shared';
import { AppErrors } from 'common/error';
import { assertTransition, assertActionTransition, canTransition } from 'services/repair-request-state-machine';
import { PaymentCommandService } from 'modules/payment-command.service';
import { RepairEventService, RepairEventType } from 'services/repair-event.service';
import { WorkStep } from 'entities/work-step.entity';
import { BrokenPartService } from './broken-part.service';
import { CertificateService } from './certificate.service';
import { SignatureService } from './signature.service';
import { WScheduleService } from './wschedule.service';
import { AvrPdfService, type AvrData } from './avr-pdf.service';

const REPAIR_REQUEST_SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'status', 'totalCost'] as const;

function buildRepairOrderBy(sortBy?: string, sortOrder?: string): Record<string, 'ASC' | 'DESC'> {
    return sortBy && (REPAIR_REQUEST_SORTABLE_FIELDS as readonly string[]).includes(sortBy)
        ? { [sortBy]: sortOrder === 'asc' ? 'ASC' : 'DESC' }
        : { createdAt: 'DESC' };
}

@Injectable()
export class RepairRequestService {
    constructor(
        private readonly em: EntityManager,
        private readonly paymentCommandService: PaymentCommandService,
        private readonly repairEventService: RepairEventService,
        private readonly brokenPartService: BrokenPartService,
        private readonly certificateService: CertificateService,
        private readonly signatureService: SignatureService,
        private readonly scheduleService: WScheduleService,
        private readonly avrPdfService: AvrPdfService,
    ) {}

    private recordStatusTimestamp(request: RepairRequest, status: RepairRequestStatus): void {
        request.statusTimestamps = [...request.statusTimestamps, { status, timestamp: new Date().toISOString() }];
    }

    private lastTimestampFor(entries: { status: string; timestamp: string }[], status: RepairRequestStatus): string | undefined {
        for (let i = entries.length - 1; i >= 0; i--) {
            if (entries[i].status === status) return entries[i].timestamp;
        }
        return undefined;
    }

    private static readonly ACTIVE_WORK_STATUSES = new Set<string>([
        RepairRequestStatus.EN_ROUTE,
        RepairRequestStatus.IN_PROGRESS,
    ]);

    private assertAvrMutable(request: RepairRequest): void {
        if (RepairRequestService.TERMINAL_STATUSES.includes(request.status)) {
            throw AppErrors.badRequest('Акт заблокирован: заявка в финальном статусе');
        }
    }

    /**
     * Walk the statusTimestamps array (scoped to the current repairer's session) and sum
     * active work time (EN_ROUTE + IN_PROGRESS periods). The session starts at the LAST
     * ASSIGNED entry — everything before that belongs to a previous repairer after reassignment.
     *
     * @param openPeriodEndTime If provided and an active period is still open at the end
     *   (e.g., called during reassignment while the old repairer was IN_PROGRESS), the open
     *   period is closed at this time. Otherwise, open periods are discarded.
     */
    private computeActiveWorkMinutes(request: RepairRequest, openPeriodEndTime?: Date): number | null {
        const entries = request.statusTimestamps;
        if (!entries.length) return null;

        // Scope to the current repairer's session — find last ASSIGNED entry
        let startIdx = 0;
        for (let i = entries.length - 1; i >= 0; i--) {
            if (entries[i].status === RepairRequestStatus.ASSIGNED) {
                startIdx = i;
                break;
            }
        }

        let totalMs = 0;
        let activeStart: Date | null = null;

        for (let i = startIdx; i < entries.length; i++) {
            const entry = entries[i];
            const isActive = RepairRequestService.ACTIVE_WORK_STATUSES.has(entry.status);
            const ts = new Date(entry.timestamp);

            if (isActive && !activeStart) {
                activeStart = ts;
            } else if (!isActive && activeStart) {
                totalMs += ts.getTime() - activeStart.getTime();
                activeStart = null;
            }
        }

        // Close any still-open active period (e.g., reassignment while IN_PROGRESS)
        if (activeStart && openPeriodEndTime) {
            totalMs += openPeriodEndTime.getTime() - activeStart.getTime();
        }

        const totalMinutes = Math.round(totalMs / 60_000);
        return totalMinutes > 0 ? totalMinutes : null;
    }

    /**
     * Record overtime as total active work time on this request, scoped to the
     * current repairer's session. Called at:
     *  - terminal status (completed, refused, cancelled, refunded) — natural period closure
     *  - reassignment (with openPeriodEndTime = now) — closes out the old repairer's book
     */
    private async recordScheduleEntries(repairerUserId: string, request: RepairRequest, openPeriodEndTime?: Date): Promise<void> {
        const totalMinutes = this.computeActiveWorkMinutes(request, openPeriodEndTime);
        if (!totalMinutes) return;
        const startTime = '00:00';
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const endTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        const terminalIso = this.lastTimestampFor(request.statusTimestamps, request.status);
        const workDate = terminalIso ? new Date(terminalIso) : (openPeriodEndTime ?? new Date());
        const dateOnly = new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate());

        await this.scheduleService.recordOvertime(repairerUserId, dateOnly, startTime, endTime, request.id);
    }

    /** User creates a repair request */
    @CreateRequestContext()
    async create(userId: string, dto: { userDeviceId: string; description: string; certificateId?: string; preferredDate?: string; brokenParts?: { devicePartId?: string; name?: string; note?: string }[] }): Promise<RepairRequest> {
        // Validate user device directly
        const userDevice = await this.em.findOne(UserDevice, { id: dto.userDeviceId }, { populate: ['address'] });
        if (!userDevice) throw AppErrors.dbEntityNotFound('User device not found');
        if (userDevice.userId !== userId) throw AppErrors.dbEntityNotFound('User device not found');

        // Check if there's already an active repair request for this device
        const activeRequest = await this.em.findOne(RepairRequest, {
            userDevice: dto.userDeviceId,
            status: {
                $nin: [
                    RepairRequestStatus.COMPLETED,
                    RepairRequestStatus.CANCELLED,
                    RepairRequestStatus.REFUNDED,
                    RepairRequestStatus.REFUSED,
                ],
            },
        });
        if (activeRequest) {
            throw AppErrors.conflict('Для этого устройства уже существует активная заявка на ремонт');
        }

        // Cert validation: data-integrity problems (not_found / wrong_user / wrong_device)
        // hard-throw; soft problems (not_paid / expired / revoked / signature_invalid /
        // payment_not_found) attach the cert anyway and mark the request with
        // certificateValid=false, so it can be revalidated later by the cert payment
        // webhook (see certificate.service.ts::markPaid).
        let certificate: Certificate | undefined;
        let certificateValid = true;
        if (dto.certificateId) {
            const result = await this.certificateService.validateCertificateForRequest(
                dto.certificateId,
                userId,
                dto.userDeviceId,
            );
            if (!result.ok) {
                if (result.reason === 'not_found' || result.reason === 'wrong_user') {
                    throw AppErrors.dbEntityNotFound('Certificate not found');
                }
                if (result.reason === 'wrong_device') {
                    throw AppErrors.badRequest('Certificate does not belong to this device');
                }
                certificate = result.certificate;
                certificateValid = false;
            } else {
                certificate = result.certificate;
            }
        }

        // Validate user device
        if (userDevice.validationStatus === 'invalid') {
            throw AppErrors.badRequest('Устройство не прошло проверку: ' + (userDevice.validationError || 'проверка не пройдена'));
        }
        if (userDevice.validationStatus === 'pending') {
            throw AppErrors.badRequest('Устройство ещё проходит проверку. Попробуйте через несколько секунд.');
        }
        if (userDevice.validationStatus === 'error') {
            throw AppErrors.badRequest('Не удалось проверить устройство. Попробуйте обновить данные устройства.');
        }

        // Validate address
        const addressEntity = userDevice.address
            ? (typeof userDevice.address === 'object' ? userDevice.address : await this.em.findOne(Address, { id: String(userDevice.address) }))
            : undefined;

        if (addressEntity) {
            if (addressEntity.validationStatus === 'invalid') {
                throw AppErrors.badRequest('Адрес не прошёл проверку: ' + (addressEntity.validationError || 'адрес не найден'));
            }
            if (addressEntity.validationStatus === 'pending') {
                throw AppErrors.badRequest('Адрес ещё проходит проверку. Попробуйте через несколько секунд.');
            }
            if (addressEntity.validationStatus === 'error') {
                throw AppErrors.badRequest('Не удалось проверить адрес. Попробуйте обновить адрес устройства.');
            }
        }

        const addressRef = addressEntity
            ? this.em.getReference(Address, addressEntity.id)
            : undefined;

        const request = this.em.create(RepairRequest, {
            userId,
            userDevice,
            certificate,
            certificateValid,
            description: dto.description,
            preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : undefined,
            address: addressRef,
            status: RepairRequestStatus.PENDING,
            statusTimestamps: [{ status: RepairRequestStatus.PENDING, timestamp: new Date().toISOString() }],
        });
        await this.em.persistAndFlush(request);

        if (dto.brokenParts && dto.brokenParts.length > 0) {
            await this.brokenPartService.addBrokenPartsOnCreate(request.id, dto.brokenParts);
        }

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId,
            newStatus: RepairRequestStatus.PENDING,
            timestamp: new Date(),
        });

        return request;
    }

    /** Mark repair request as paid after payment confirmation */
    @CreateRequestContext()
    async markPaid(requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.PAID);

        const oldStatus = request.status;
        request.status = RepairRequestStatus.PAID;
        this.recordStatusTimestamp(request, RepairRequestStatus.PAID);
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.PAID,
            timestamp: new Date(),
        });

        return request;
    }

    /** User requests refund */
    @CreateRequestContext()
    async requestRefund(userId: string, requestId: string, reason: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId, userId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        assertTransition(request.status, RepairRequestStatus.REFUND_REQUESTED);

        const oldStatus = request.status;
        request.refundRequested = true;
        request.refundReason = reason;
        request.status = RepairRequestStatus.REFUND_REQUESTED;
        this.recordStatusTimestamp(request, RepairRequestStatus.REFUND_REQUESTED);
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId,
            oldStatus,
            newStatus: RepairRequestStatus.REFUND_REQUESTED,
            timestamp: new Date(),
        });

        return request;
    }

    /** Manager approves refund */
    @CreateRequestContext()
    async approveRefund(requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId }, { populate: ['repairer'] });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.REFUNDED);

        request.status = RepairRequestStatus.REFUNDED;
        this.recordStatusTimestamp(request, RepairRequestStatus.REFUNDED);
        await this.em.flush();

        await this.brokenPartService.cleanupSuggestions(requestId);

        // Refund via payment-service RabbitMQ (fire-and-forget)
        await this.paymentCommandService.emitRefundTarget('repairRequest', requestId);

        const repairerEntity = typeof request.repairer === 'object' ? request.repairer : null;
        if (repairerEntity) {
            try {
                await this.recordScheduleEntries(repairerEntity.userId, request);
            } catch { /* non-critical */ }
        }

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus: RepairRequestStatus.REFUND_REQUESTED,
            newStatus: RepairRequestStatus.REFUNDED,
            timestamp: new Date(),
        });

        return request;
    }

    /** Manager denies refund */
    @CreateRequestContext()
    async denyRefund(requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertActionTransition('denyRefund', request.status);

        request.refundRequested = false;
        request.status = RepairRequestStatus.PAID; // revert to paid
        this.recordStatusTimestamp(request, RepairRequestStatus.PAID);
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus: RepairRequestStatus.REFUND_REQUESTED,
            newStatus: RepairRequestStatus.PAID,
            timestamp: new Date(),
        });

        return request;
    }

    /** Manager assigns repairer to request */
    @CreateRequestContext()
    async assignRepairer(managerId: string, requestId: string, repairerId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.ASSIGNED);

        // Validate repairer directly
        const repairer = await this.em.findOne(Repairer, { id: repairerId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer not found');
        if (!repairer.isActive) throw AppErrors.badRequest('Repairer is not active');

        await this.scheduleService.assertScheduleAllows(repairer, 'Назначить мастера');
        await this.scheduleService.assertEnoughScheduleTime(repairer);
        await this.assertNoConcurrentCap(repairer.id, 'Назначить мастера');

        const oldStatus = request.status;
        request.repairer = this.em.getReference(Repairer, repairerId);
        request.managerId = managerId;
        request.status = RepairRequestStatus.ASSIGNED;
        this.recordStatusTimestamp(request, RepairRequestStatus.ASSIGNED);
        await this.em.flush();

        const assignedIso = this.lastTimestampFor(request.statusTimestamps, RepairRequestStatus.ASSIGNED);
        const assignedAt = assignedIso ? new Date(assignedIso) : undefined;
        await this.scheduleService.ensureExtraDayIfOff(repairer, request.id, assignedAt);

        await this.repairEventService.emit({
            type: RepairEventType.ASSIGNED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.ASSIGNED,
            repairerId,
            repairerUserId: repairer.userId,
            managerId,
            timestamp: new Date(),
        });

        return request;
    }

    /**
     * Max concurrent active repair requests a single repairer can hold. Lives here
     * (not in the schedule service) because it counts RepairRequest rows, not
     * schedule entries.
     */
    private static readonly MAX_CONCURRENT_ACTIVE_REQUESTS = 3;

    private async assertNoConcurrentCap(repairerId: string, action: string): Promise<void> {
        const activeCount = await this.em.count(RepairRequest, {
            repairer: repairerId,
            status: { $in: [
                RepairRequestStatus.ASSIGNED,
                RepairRequestStatus.ACCEPTED,
                RepairRequestStatus.EN_ROUTE,
                RepairRequestStatus.IN_PROGRESS,
                RepairRequestStatus.AWAITING_COMPLETION,
            ]},
        });
        if (activeCount >= RepairRequestService.MAX_CONCURRENT_ACTIVE_REQUESTS) {
            throw AppErrors.badRequest(`У мастера ${activeCount} активных заявок (лимит: ${RepairRequestService.MAX_CONCURRENT_ACTIVE_REQUESTS}). ${action} невозможно`);
        }
    }

    /** Repairer accepts assigned request */
    @CreateRequestContext()
    async acceptRequest(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        await this.scheduleService.assertScheduleAllows(repairer, 'Принять заявку');
        await this.assertNoConcurrentCap(repairer.id, 'Принять заявку');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.ACCEPTED);

        request.status = RepairRequestStatus.ACCEPTED;
        this.recordStatusTimestamp(request, RepairRequestStatus.ACCEPTED);

        // Seed mandatory diagnostic step if none exist yet (idempotent — re-accept after transfer won't duplicate)
        const existingMandatory = await this.em.count(WorkStep, { repairRequest: requestId, isMandatory: true });
        if (existingMandatory === 0) {
            const existingCount = await this.em.count(WorkStep, { repairRequest: requestId });
            this.em.create(WorkStep, {
                repairRequest: request,
                title: 'Диагностика',
                order: existingCount + 1,
                isMandatory: true,
            });
        }

        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus: RepairRequestStatus.ASSIGNED,
            newStatus: RepairRequestStatus.ACCEPTED,
            timestamp: new Date(),
        });

        return request;
    }

    /** Repairer refuses assigned request — pinned to REFUSED with the original repairer still attached. Only a manager transfer can move the request out. */
    @CreateRequestContext()
    async refuseRequest(repairerUserId: string, requestId: string, reason: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertActionTransition('refuse', request.status);

        request.status = RepairRequestStatus.REFUSED;
        request.refuseReason = reason;
        this.recordStatusTimestamp(request, RepairRequestStatus.REFUSED);
        await this.em.flush();

        await this.brokenPartService.cleanupSuggestions(requestId);

        try {
            await this.recordScheduleEntries(repairer.userId, request);
        } catch { /* non-critical */ }

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus: RepairRequestStatus.ASSIGNED,
            newStatus: RepairRequestStatus.REFUSED,
            timestamp: new Date(),
        });

        return request;
    }

    /** Repairer departs to the client address */
    @CreateRequestContext()
    async depart(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        await this.scheduleService.assertScheduleAllows(repairer, 'Выезд к клиенту');
        await this.assertNoConcurrentCap(repairer.id, 'Выезд к клиенту');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.EN_ROUTE);

        const oldStatus = request.status;
        request.status = RepairRequestStatus.EN_ROUTE;
        this.recordStatusTimestamp(request, RepairRequestStatus.EN_ROUTE);
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.EN_ROUTE,
            repairerUserId: repairer.userId,
            managerId: request.managerId,
            timestamp: new Date(),
        });

        return request;
    }

    /** Repairer starts working on request */
    @CreateRequestContext()
    async startWork(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        await this.scheduleService.assertScheduleAllows(repairer, 'Начать работу');
        await this.assertNoConcurrentCap(repairer.id, 'Начать работу');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.IN_PROGRESS);

        const oldStatus = request.status;
        request.status = RepairRequestStatus.IN_PROGRESS;
        this.recordStatusTimestamp(request, RepairRequestStatus.IN_PROGRESS);
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.IN_PROGRESS,
            repairerUserId: repairer.userId,
            managerId: request.managerId,
            timestamp: new Date(),
        });

        return request;
    }

    /** Repairer sets or updates repair price */
    @CreateRequestContext()
    async setPrice(repairerUserId: string, requestId: string, amount: number): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (![RepairRequestStatus.IN_PROGRESS, RepairRequestStatus.AWAITING_COMPLETION, RepairRequestStatus.COMPLETED].includes(request.status)) {
            throw AppErrors.badRequest('Price can only be set when request is in progress or completed');
        }

        request.totalCost = amount;
        await this.em.flush();

        // Create payment invoice via payment-service RabbitMQ (fire-and-forget)
        await this.paymentCommandService.emitCreateInvoice(
            request.userId,
            PaymentTargetType.REPAIR_REQUEST,
            request.id,
            amount,
        );

        return request;
    }

    /** Mark request as awaiting completion (last step done) */
    @CreateRequestContext()
    async markAwaitingCompletion(requestId: string): Promise<void> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) return;
        if (!canTransition(request.status, RepairRequestStatus.AWAITING_COMPLETION)) return;
        const oldStatus = request.status;
        request.status = RepairRequestStatus.AWAITING_COMPLETION;
        this.recordStatusTimestamp(request, RepairRequestStatus.AWAITING_COMPLETION);
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.AWAITING_COMPLETION,
            timestamp: new Date(),
        });
    }

    /** Complete the request with optional description */
    @CreateRequestContext()
    async complete(requestId: string, description?: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId }, { populate: ['certificate'] });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        const oldStatus = request.status;
        assertTransition(request.status, RepairRequestStatus.COMPLETED);
        if (!request.totalCost) {
            throw AppErrors.badRequest('Необходимо указать стоимость ремонта перед завершением');
        }

        request.status = RepairRequestStatus.COMPLETED;
        this.recordStatusTimestamp(request, RepairRequestStatus.COMPLETED);
        if (description) {
            request.completionNote = description;
        }

        // Freeze a snapshot of the cert's current state so later revocation/expiry
        // doesn't retroactively change the historical display of this request.
        const cert = typeof request.certificate === 'object' ? request.certificate : null;
        if (cert && request.certificateValid && !request.certificateSnapshot) {
            request.certificateSnapshot = {
                id: cert.id,
                certificateNumber: cert.certificateNumber,
                status: cert.status,
                issuedAt: cert.issuedAt.toISOString(),
                expiresAt: cert.expiresAt.toISOString(),
                frozenAt: new Date().toISOString(),
                signedPayload: cert.signedPayload ?? undefined,
                signature: cert.signature ?? undefined,
            };
        }

        // Update repairer stats directly (same DB)
        const repairerId = request.repairer
            ? (typeof request.repairer === 'object' ? request.repairer.id : String(request.repairer))
            : undefined;
        if (repairerId) {
            const repairer = await this.em.findOne(Repairer, { id: repairerId });
            if (repairer) {
                repairer.completedRepairs += 1;

                // Update repairer last location from address if available
                const addressId = request.address
                    ? (typeof request.address === 'object' ? request.address.id : String(request.address))
                    : undefined;
                if (addressId) {
                    try {
                        const address = await this.em.findOne(Address, { id: addressId });
                        if (address) {
                            // Placeholder coords -- gateway handles real geolocation
                            repairer.lastLocationUpdate = new Date();
                        }
                    } catch {
                        // Non-critical: don't fail completion if location update fails
                    }
                }
            }
        }

        // Schedule chat close 30 minutes after completion
        if (request.conversationId) {
            request.chatCloseAt = new Date(Date.now() + 30 * 60 * 1000);
        }

        // Sign completion data
        const workSteps = await this.em.find(WorkStep, { repairRequest: requestId });
        const workStepsSummary = workSteps
            .sort((a, b) => a.order - b.order)
            .map(s => `${s.title}:${s.status}`)
            .join(',');
        const completionPayload = {
            requestId: request.id,
            repairerId: repairerId ?? '',
            totalCost: request.totalCost ?? 0,
            completionNote: request.completionNote ?? '',
            workStepsSummary,
            signedAt: new Date().toISOString(),
        };
        request.completionSignedPayload = JSON.stringify(completionPayload, Object.keys(completionPayload).sort());
        request.completionSignature = this.signatureService.sign(completionPayload);

        await this.em.flush();

        await this.brokenPartService.cleanupSuggestions(request.id);

        await this.repairEventService.emit({
            type: RepairEventType.COMPLETED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.COMPLETED,
            timestamp: new Date(),
        });

        // Auto-record overtime/extra day based on actual work timestamps
        if (repairerId) {
            try {
                const repairer = await this.em.findOne(Repairer, { id: repairerId });
                if (repairer) {
                    await this.recordScheduleEntries(repairer.userId, request);
                }
            } catch { /* non-critical */ }
        }

        return request;
    }

    /** Customer accepts completed repair — cryptographic attestation */
    @CreateRequestContext()
    async acceptCompletion(userId: string, requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId, userId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (request.status !== RepairRequestStatus.COMPLETED) {
            throw AppErrors.badRequest('Can only accept completed repairs');
        }
        if (request.acceptanceSignature) {
            throw AppErrors.badRequest('Repair already accepted');
        }

        const payload = {
            requestId: request.id,
            userId,
            signedAt: new Date().toISOString(),
        };
        request.acceptanceSignedPayload = JSON.stringify(payload, Object.keys(payload).sort());
        request.acceptanceSignature = this.signatureService.sign(payload);
        await this.em.flush();

        return request;
    }

    /** Repairer pauses accepted or in-progress request */
    @CreateRequestContext()
    async pause(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.PAUSED);

        const oldStatus = request.status;
        request.statusBeforePause = request.status;
        request.status = RepairRequestStatus.PAUSED;
        this.recordStatusTimestamp(request, RepairRequestStatus.PAUSED);
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.PAUSED,
            timestamp: new Date(),
        });

        return request;
    }

    /** Repairer resumes a paused request */
    @CreateRequestContext()
    async resume(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        await this.scheduleService.assertScheduleAllows(repairer, 'Возобновить заявку');
        await this.assertNoConcurrentCap(repairer.id, 'Возобновить заявку');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertActionTransition('resume', request.status);

        const oldStatus = request.status;
        const resumeTo = (request.statusBeforePause as RepairRequestStatus) ?? RepairRequestStatus.IN_PROGRESS;
        request.status = resumeTo;
        request.statusBeforePause = undefined;
        this.recordStatusTimestamp(request, resumeTo);
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: resumeTo,
            timestamp: new Date(),
        });

        return request;
    }

    /** Repairer confirms they're still working past schedule end — allows overtime */
    @CreateRequestContext()
    async confirmSchedulePresence(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        await this.scheduleService.assertPresenceAllowed(repairer, 'Подтверждение');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (![RepairRequestStatus.ACCEPTED, RepairRequestStatus.EN_ROUTE, RepairRequestStatus.IN_PROGRESS].includes(request.status)) {
            throw AppErrors.badRequest('Заявка должна быть в статусе «Принята», «В пути» или «В работе»');
        }

        request.scheduleEndConfirmedAt = new Date();
        await this.em.flush();
        return request;
    }

    /** Auto-pause a repair because the repairer didn't confirm presence after schedule end */
    @CreateRequestContext()
    async autoPauseForScheduleEnd(requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId }, { populate: ['repairer'] });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (!canTransition(request.status, RepairRequestStatus.PAUSED)) return request;

        const oldStatus = request.status;
        request.statusBeforePause = request.status;
        request.status = RepairRequestStatus.PAUSED;
        this.recordStatusTimestamp(request, RepairRequestStatus.PAUSED);
        await this.em.flush();

        const repairerEntity = typeof request.repairer === 'object' ? request.repairer : null;

        await this.repairEventService.emit({
            type: RepairEventType.SCHEDULE_AUTO_PAUSED,
            repairId: request.id,
            userId: request.userId,
            repairerUserId: repairerEntity?.userId,
            oldStatus,
            newStatus: RepairRequestStatus.PAUSED,
            timestamp: new Date(),
        });

        return request;
    }

    /** Manager transfers request from current repairer to a new one (any non-terminal state with a repairer) */
    @CreateRequestContext()
    async reassign(managerId: string, requestId: string, newRepairerId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId }, { populate: ['repairer'] });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertActionTransition('reassign', request.status);

        if (request.avrStatus !== AvrStatus.NONE) {
            throw AppErrors.badRequest('Нельзя переназначить мастера: акт выполненных работ сформирован. Сначала удалите акт.');
        }

        const oldRepairer = request.repairer
            ? (typeof request.repairer === 'object' ? request.repairer : await this.em.findOne(Repairer, { id: String(request.repairer) }))
            : undefined;
        if (!oldRepairer) {
            throw AppErrors.badRequest('Нельзя передать заявку без текущего мастера');
        }

        if (oldRepairer.id === newRepairerId) {
            throw AppErrors.badRequest('Нельзя передать заявку текущему мастеру');
        }

        const newRepairer = await this.em.findOne(Repairer, { id: newRepairerId });
        if (!newRepairer) throw AppErrors.dbEntityNotFound('Repairer not found');
        if (!newRepairer.isActive) throw AppErrors.badRequest('Repairer is not active');

        await this.scheduleService.assertScheduleAllows(newRepairer, 'Переназначить мастера');
        await this.scheduleService.assertEnoughScheduleTime(newRepairer);
        await this.assertNoConcurrentCap(newRepairer.id, 'Переназначить мастера');

        // Close out old repairer's active work time before transferring.
        // Passes `new Date()` so any still-open EN_ROUTE/IN_PROGRESS period is counted up to now.
        try {
            await this.recordScheduleEntries(oldRepairer.userId, request, new Date());
        } catch { /* non-critical */ }

        const oldStatus = request.status;
        request.repairer = this.em.getReference(Repairer, newRepairerId);
        request.managerId = managerId;
        request.status = RepairRequestStatus.ASSIGNED;
        request.statusBeforePause = undefined;
        request.refuseReason = undefined;
        request.stepsLocked = false;
        this.recordStatusTimestamp(request, RepairRequestStatus.ASSIGNED);
        await this.em.flush();

        const newAssignedIso = this.lastTimestampFor(request.statusTimestamps, RepairRequestStatus.ASSIGNED);
        const newAssignedAt = newAssignedIso ? new Date(newAssignedIso) : undefined;
        await this.scheduleService.ensureExtraDayIfOff(newRepairer, request.id, newAssignedAt);

        await this.repairEventService.emit({
            type: RepairEventType.TRANSFERRED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.ASSIGNED,
            oldRepairerId: oldRepairer.id,
            newRepairerId,
            oldRepairerUserId: oldRepairer.userId,
            newRepairerUserId: newRepairer.userId,
            timestamp: new Date(),
        });

        // Keep status_changed fan-out so existing consumers stay happy
        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.ASSIGNED,
            timestamp: new Date(),
        });

        return request;
    }

    /** User cancels request */
    @CreateRequestContext()
    async cancel(userId: string, requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId, userId }, { populate: ['repairer'] });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        assertTransition(request.status, RepairRequestStatus.CANCELLED);
        const oldStatus = request.status;
        request.status = RepairRequestStatus.CANCELLED;
        this.recordStatusTimestamp(request, RepairRequestStatus.CANCELLED);
        await this.em.flush();

        await this.brokenPartService.cleanupSuggestions(requestId);

        const repairerEntity = typeof request.repairer === 'object' ? request.repairer : null;
        if (repairerEntity) {
            try {
                await this.recordScheduleEntries(repairerEntity.userId, request);
            } catch { /* non-critical */ }
        }

        await this.repairEventService.emit({
            type: RepairEventType.STATUS_CHANGED,
            repairId: request.id,
            userId,
            oldStatus,
            newStatus: RepairRequestStatus.CANCELLED,
            timestamp: new Date(),
        });

        return request;
    }

    // ── Queries ──

    @CreateRequestContext()
    async findByUser(userId: string, pagination: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string; dateFrom?: string; dateTo?: string }): Promise<{ data: RepairRequest[]; total: number }> {
        const where: Record<string, any> = { userId };
        if (pagination.status) where.status = pagination.status.includes(",") ? { $in: pagination.status.split(",") } : pagination.status;
        if (pagination.search) {
            where.$or = [
                { description: { $ilike: `%${pagination.search}%` } },
            ];
        }
        if (pagination.dateFrom || pagination.dateTo) {
            where.createdAt = {};
            if (pagination.dateFrom) where.createdAt.$gte = new Date(pagination.dateFrom);
            if (pagination.dateTo) where.createdAt.$lte = new Date(pagination.dateTo);
        }

        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            where,
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: buildRepairOrderBy(pagination.sortBy, pagination.sortOrder),
                populate: ['workSteps', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'certificate', 'address'],
            }
        );
        return { data, total };
    }

    @CreateRequestContext()
    async findActiveByRepairer(repairerUserId: string): Promise<RepairRequest | null> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        return this.em.findOne(
            RepairRequest,
            {
                repairer: repairer.id,
                status: {
                    $in: [
                        RepairRequestStatus.ASSIGNED,
                        RepairRequestStatus.ACCEPTED,
                        RepairRequestStatus.EN_ROUTE,
                        RepairRequestStatus.IN_PROGRESS,
                        RepairRequestStatus.AWAITING_COMPLETION,
                    ],
                },
            },
            { populate: ['workSteps', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'certificate', 'address'] },
        );
    }

    @CreateRequestContext()
    async findPausedByRepairer(repairerUserId: string, pagination: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }): Promise<{ data: RepairRequest[]; total: number }> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            { repairer: repairer.id, status: RepairRequestStatus.PAUSED },
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: buildRepairOrderBy(pagination.sortBy, pagination.sortOrder),
                populate: ['workSteps', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'certificate', 'address'],
            }
        );
        return { data, total };
    }

    @CreateRequestContext()
    async findByRepairerFiltered(repairerUserId: string, pagination: { page?: number; limit?: number; sortBy?: string; sortOrder?: string; dateFrom?: string; dateTo?: string }, status?: string, search?: string): Promise<{ data: RepairRequest[]; total: number }> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) return { data: [], total: 0 };

        const where: Record<string, any> = { repairer: repairer.id };
        if (status) where.status = status.includes(",") ? { $in: status.split(",") } : status;
        if (search) {
            where.$or = [
                { description: { $ilike: `%${search}%` } },
            ];
        }
        if (pagination.dateFrom || pagination.dateTo) {
            where.createdAt = {};
            if (pagination.dateFrom) where.createdAt.$gte = new Date(pagination.dateFrom);
            if (pagination.dateTo) where.createdAt.$lte = new Date(pagination.dateTo);
        }

        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            where,
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: buildRepairOrderBy(pagination.sortBy, pagination.sortOrder),
                populate: ['workSteps', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'certificate', 'address'],
            }
        );
        return { data, total };
    }

    @CreateRequestContext()
    async findByRepairer(repairerUserId: string, pagination: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }): Promise<{ data: RepairRequest[]; total: number }> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) return { data: [], total: 0 };

        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            { repairer: repairer.id },
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: buildRepairOrderBy(pagination.sortBy, pagination.sortOrder),
                populate: ['workSteps', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'certificate', 'address'],
            }
        );
        return { data, total };
    }

    @CreateRequestContext()
    async findAll(pagination: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string; dateFrom?: string; dateTo?: string }): Promise<{ data: RepairRequest[]; total: number }> {
        const where: Record<string, any> = {};
        if (pagination.status) where.status = pagination.status.includes(",") ? { $in: pagination.status.split(",") } : pagination.status;
        if (pagination.search) {
            where.$or = [
                { description: { $ilike: `%${pagination.search}%` } },
            ];
        }
        if (pagination.dateFrom || pagination.dateTo) {
            where.createdAt = {};
            if (pagination.dateFrom) where.createdAt.$gte = new Date(pagination.dateFrom);
            if (pagination.dateTo) where.createdAt.$lte = new Date(pagination.dateTo);
        }

        const [data, total] = await this.em.findAndCount(
            RepairRequest,
            where,
            {
                limit: pagination.limit ?? 20,
                offset: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 20),
                orderBy: buildRepairOrderBy(pagination.sortBy, pagination.sortOrder),
                populate: ['workSteps', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'certificate', 'address'],
            }
        );
        return { data, total };
    }

    @CreateRequestContext()
    async findById(id: string): Promise<RepairRequest> {
        const request = await this.em.findOne(
            RepairRequest,
            { id },
            { populate: ['workSteps', 'userDevice', 'userDevice.device', 'userDevice.address', 'repairer', 'certificate', 'address'] }
        );
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        return request;
    }

    @CreateRequestContext()
    async checkActiveForDevice(userDeviceId: string): Promise<{ hasActive: boolean; request?: RepairRequest }> {
        const request = await this.em.findOne(RepairRequest, {
            userDevice: userDeviceId,
            status: {
                $nin: [
                    RepairRequestStatus.COMPLETED,
                    RepairRequestStatus.CANCELLED,
                    RepairRequestStatus.REFUNDED,
                    RepairRequestStatus.REFUSED,
                ],
            },
        });
        return { hasActive: !!request, request: request ?? undefined };
    }

    @CreateRequestContext()
    async setConversationId(requestId: string, conversationId: string): Promise<void> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        request.conversationId = conversationId;
        await this.em.flush();
    }

    @CreateRequestContext()
    async findOpenChatsForClose(): Promise<{ requestId: string; conversationId: string }[]> {
        const requests = await this.em.find(RepairRequest, {
            status: RepairRequestStatus.COMPLETED,
            conversationId: { $ne: null },
            chatCloseAt: { $lte: new Date() },
        });
        return requests
            .filter(r => r.conversationId)
            .map(r => ({ requestId: r.id, conversationId: r.conversationId! }));
    }

    @CreateRequestContext()
    async clearChatCloseAt(requestId: string): Promise<string | undefined> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) return undefined;
        const conversationId = request.conversationId;
        request.chatCloseAt = undefined;
        await this.em.flush();
        return conversationId;
    }

    @CreateRequestContext()
    async getRepairersActiveRequestCounts(repairerIds: string[]): Promise<{ repairerId: string; activeRequestCount: number; currentRequestStatus: string }[]> {
        if (!repairerIds.length) return [];

        const activeStatuses = [
            RepairRequestStatus.ASSIGNED,
            RepairRequestStatus.ACCEPTED,
            RepairRequestStatus.EN_ROUTE,
            RepairRequestStatus.IN_PROGRESS,
            RepairRequestStatus.AWAITING_COMPLETION,
        ];

        const requests = await this.em.find(RepairRequest, {
            repairer: { $in: repairerIds },
            status: { $in: activeStatuses },
        });

        const statsMap = new Map<string, { count: number; status: string }>();
        for (const req of requests) {
            const rid = typeof req.repairer === 'object' ? (req.repairer as Repairer).id : String(req.repairer);
            const existing = statsMap.get(rid);
            if (existing) {
                existing.count++;
            } else {
                statsMap.set(rid, { count: 1, status: req.status });
            }
        }

        return repairerIds.map(id => ({
            repairerId: id,
            activeRequestCount: statsMap.get(id)?.count ?? 0,
            currentRequestStatus: statsMap.get(id)?.status ?? '',
        }));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AVR (Work Completion Act)
    // ═══════════════════════════════════════════════════════════════════════

    /** Generate AVR PDF — returns PDF buffer for the gateway to upload to file-service */
    @CreateRequestContext()
    async generateAvr(
        requestId: string,
        repairerUserId: string,
        userData: { name: string; phone: string; email: string },
        repairerName: string,
        completionNote?: string,
    ): Promise<{ pdfBuffer: Buffer; request: RepairRequest }> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id }, {
            populate: ['userDevice', 'certificate', 'address'],
        });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        this.assertAvrMutable(request);
        if (![RepairRequestStatus.AWAITING_COMPLETION, RepairRequestStatus.IN_PROGRESS].includes(request.status)) {
            throw AppErrors.badRequest('АВР можно сформировать только после выполнения шагов ремонта');
        }
        if (!request.totalCost) {
            throw AppErrors.badRequest('Необходимо указать стоимость ремонта перед формированием акта');
        }

        const workSteps = await this.em.find(WorkStep, { repairRequest: requestId }, { orderBy: { order: 'ASC' } });
        const ud = typeof request.userDevice === 'object' ? request.userDevice : null;
        let device: any = null;
        if (ud) {
            await this.em.populate(ud, ['device'] as any);
            device = (ud as any).device;
        }

        const cert = typeof request.certificate === 'object' ? request.certificate : null;
        const addr = typeof request.address === 'object' ? request.address : null;

        const addressStr = addr
            ? [addr.city, addr.street, addr.house ? `д. ${addr.house}` : '', addr.building ? `корп. ${addr.building}` : '', addr.floor ? `эт. ${addr.floor}` : '', addr.apartment ? `кв. ${addr.apartment}` : ''].filter(Boolean).join(', ')
            : undefined;

        const avrData: AvrData = {
            requestId: request.id,
            documentDate: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            userName: userData.name,
            userPhone: userData.phone,
            userEmail: userData.email,
            repairerName: repairerName || 'Мастер',
            deviceName: device?.name ?? '',
            deviceBrand: device?.brand ?? '',
            deviceModel: device?.model ?? '',
            serialNumber: ud?.serialNumber ?? '',
            description: request.description,
            workSteps: workSteps.map(s => ({ title: s.title, description: s.description, status: s.status })),
            totalCost: request.totalCost,
            completionNote,
            certificateNumber: cert?.certificateNumber,
            address: addressStr,
        };

        const pdfBuffer = await this.avrPdfService.generate(avrData);

        request.avrStatus = AvrStatus.GENERATED;
        if (completionNote !== undefined) {
            request.completionNote = completionNote;
        }
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.AVR_GENERATED,
            repairId: request.id,
            userId: request.userId,
            timestamp: new Date(),
        });

        return { pdfBuffer, request };
    }

    /** Reset AVR to allow re-editing (only before signing) */
    @CreateRequestContext()
    async resetAvr(requestId: string, repairerUserId: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id }, { populate: ['userDevice', 'certificate', 'address'] as const });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        this.assertAvrMutable(request);

        if (![AvrStatus.GENERATED, AvrStatus.PENDING_SIGNATURE].includes(request.avrStatus)) {
            throw AppErrors.badRequest('Акт уже подписан или ещё не сформирован');
        }

        this.clearAvrFields(request);
        await this.em.flush();
        return request;
    }

    /** Manager removes AVR regardless of signing state (blocked only in terminal statuses) */
    @CreateRequestContext()
    async removeAvrByManager(requestId: string, managerId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        this.assertAvrMutable(request);

        if (request.avrStatus === AvrStatus.NONE) {
            throw AppErrors.badRequest('Акт не сформирован');
        }

        this.clearAvrFields(request);
        request.managerId = managerId;
        await this.em.flush();
        return request;
    }

    private clearAvrFields(request: RepairRequest): void {
        request.avrStatus = AvrStatus.NONE;
        request.avrDocumentId = undefined;
        request.avrSignedDocumentId = undefined;
        request.avrSigningMethod = undefined;
        request.avrSignedAt = undefined;
        request.avrSignedPayload = undefined;
        request.avrSignature = undefined;
    }

    /** Store the document ID returned by file-service after upload */
    @CreateRequestContext()
    async setAvrDocumentId(requestId: string, documentId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId }, { populate: ['userDevice', 'repairer', 'certificate', 'address'] as const });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        this.assertAvrMutable(request);
        request.avrDocumentId = documentId;
        await this.em.flush();
        return request;
    }

    /** Mark AVR as pending signature (OTP sent) */
    @CreateRequestContext()
    async setAvrPendingSignature(requestId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId }, { populate: ['userDevice', 'repairer', 'certificate', 'address'] as const });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        this.assertAvrMutable(request);
        if (request.avrStatus !== AvrStatus.GENERATED) {
            throw AppErrors.badRequest('Акт должен быть сформирован перед отправкой на подпись');
        }
        request.avrStatus = AvrStatus.PENDING_SIGNATURE;
        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.AVR_SIGNING_REQUESTED,
            repairId: request.id,
            userId: request.userId,
            timestamp: new Date(),
        });

        return request;
    }

    /** Apply digital signature to AVR and complete the request */
    @CreateRequestContext()
    async signAvrDigital(requestId: string, userId: string): Promise<RepairRequest> {
        const request = await this.em.findOne(RepairRequest, { id: requestId }, { populate: ['certificate'] });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        if (request.userId !== userId) throw AppErrors.forbidden('Только заказчик может подписать акт');
        this.assertAvrMutable(request);
        if (![AvrStatus.GENERATED, AvrStatus.PENDING_SIGNATURE].includes(request.avrStatus)) {
            throw AppErrors.badRequest('Акт не готов к подписанию');
        }

        // Sign the AVR
        const workSteps = await this.em.find(WorkStep, { repairRequest: requestId });
        const workStepsSummary = workSteps.sort((a, b) => a.order - b.order).map(s => `${s.title}:${s.status}`).join(',');
        const avrPayload = {
            requestId: request.id,
            userId,
            totalCost: request.totalCost ?? 0,
            completionNote: request.completionNote ?? '',
            workStepsSummary,
            signedAt: new Date().toISOString(),
        };
        request.avrSignedPayload = JSON.stringify(avrPayload, Object.keys(avrPayload).sort());
        request.avrSignature = this.signatureService.sign(avrPayload);
        request.avrStatus = AvrStatus.SIGNED_DIGITAL;
        request.avrSigningMethod = AvrSigningMethod.DIGITAL;
        request.avrSignedAt = new Date();

        // Apply completion logic
        await this.applyCompletion(request);

        return request;
    }

    /** Upload offline-signed scan and complete the request */
    @CreateRequestContext()
    async uploadAvrScan(requestId: string, repairerUserId: string, signedDocumentId?: string): Promise<RepairRequest> {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id }, { populate: ['certificate'] });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');
        this.assertAvrMutable(request);
        if (request.avrStatus !== AvrStatus.GENERATED) {
            throw AppErrors.badRequest('Акт должен быть сформирован перед загрузкой подписанного скана');
        }

        if (signedDocumentId) request.avrSignedDocumentId = signedDocumentId;
        request.avrStatus = AvrStatus.SIGNED_OFFLINE;
        request.avrSigningMethod = AvrSigningMethod.OFFLINE;
        request.avrSignedAt = new Date();

        await this.applyCompletion(request);

        return request;
    }

    /** Shared completion logic — called by both signAvrDigital and uploadAvrScan */
    private async applyCompletion(request: RepairRequest): Promise<void> {
        const oldStatus = request.status;
        assertTransition(request.status, RepairRequestStatus.COMPLETED);
        if (!request.totalCost) {
            throw AppErrors.badRequest('Необходимо указать стоимость ремонта перед завершением');
        }

        request.status = RepairRequestStatus.COMPLETED;
        this.recordStatusTimestamp(request, RepairRequestStatus.COMPLETED);

        // Freeze certificate snapshot
        const cert = typeof request.certificate === 'object' ? request.certificate : null;
        if (cert && request.certificateValid && !request.certificateSnapshot) {
            request.certificateSnapshot = {
                id: cert.id,
                certificateNumber: cert.certificateNumber,
                status: cert.status,
                issuedAt: cert.issuedAt.toISOString(),
                expiresAt: cert.expiresAt.toISOString(),
                frozenAt: new Date().toISOString(),
                signedPayload: cert.signedPayload ?? undefined,
                signature: cert.signature ?? undefined,
            };
        }

        // Update repairer stats
        const repairerId = request.repairer
            ? (typeof request.repairer === 'object' ? request.repairer.id : String(request.repairer))
            : undefined;
        if (repairerId) {
            const repairer = await this.em.findOne(Repairer, { id: repairerId });
            if (repairer) {
                repairer.completedRepairs += 1;
                const addressId = request.address
                    ? (typeof request.address === 'object' ? request.address.id : String(request.address))
                    : undefined;
                if (addressId) {
                    try {
                        const address = await this.em.findOne(Address, { id: addressId });
                        if (address) {
                            repairer.lastLocationUpdate = new Date();
                        }
                    } catch { /* non-critical */ }
                }
            }
        }

        // Schedule chat close
        if (request.conversationId) {
            request.chatCloseAt = new Date(Date.now() + 30 * 60 * 1000);
        }

        // Completion signature (system-level, in addition to AVR user signature)
        const workSteps = await this.em.find(WorkStep, { repairRequest: request.id });
        const workStepsSummary = workSteps.sort((a, b) => a.order - b.order).map(s => `${s.title}:${s.status}`).join(',');
        const completionPayload = {
            requestId: request.id,
            repairerId: repairerId ?? '',
            totalCost: request.totalCost ?? 0,
            completionNote: request.completionNote ?? '',
            workStepsSummary,
            signedAt: new Date().toISOString(),
        };
        request.completionSignedPayload = JSON.stringify(completionPayload, Object.keys(completionPayload).sort());
        request.completionSignature = this.signatureService.sign(completionPayload);

        await this.em.flush();

        await this.brokenPartService.cleanupSuggestions(request.id);

        await this.repairEventService.emit({
            type: RepairEventType.COMPLETED,
            repairId: request.id,
            userId: request.userId,
            oldStatus,
            newStatus: RepairRequestStatus.COMPLETED,
            timestamp: new Date(),
        });

        // Auto-record overtime/extra day based on actual work timestamps
        if (repairerId) {
            try {
                const repairer = await this.em.findOne(Repairer, { id: repairerId });
                if (repairer) {
                    await this.recordScheduleEntries(repairer.userId, request);
                }
            } catch { /* non-critical */ }
        }
    }

    // ── Completion metrics ──

    private static readonly TERMINAL_STATUSES = [
        RepairRequestStatus.COMPLETED,
        RepairRequestStatus.CANCELLED,
        RepairRequestStatus.REFUSED,
        RepairRequestStatus.REFUNDED,
    ];

    private computeStatusMinutes(entries: { status: string; timestamp: string }[], targetStatus: string): number {
        let totalMs = 0;
        let start: number | null = null;
        for (const e of entries) {
            const ts = new Date(e.timestamp).getTime();
            if (e.status === targetStatus && start === null) {
                start = ts;
            } else if (e.status !== targetStatus && start !== null) {
                totalMs += ts - start;
                start = null;
            }
        }
        return Math.round(totalMs / 60_000);
    }

    private computeFirstTransitionMinutes(
        entries: { status: string; timestamp: string }[],
        fromStatus: string,
        toStatus: string,
    ): number | null {
        let fromTs: number | null = null;
        for (const e of entries) {
            if (e.status === fromStatus && fromTs === null) {
                fromTs = new Date(e.timestamp).getTime();
            }
            if (e.status === toStatus && fromTs !== null) {
                return Math.round((new Date(e.timestamp).getTime() - fromTs) / 60_000);
            }
        }
        return null;
    }

    @CreateRequestContext()
    async getCompletionMetrics(dateFrom: Date, dateTo: Date) {
        const requests = await this.em.find(RepairRequest, {
            status: { $in: RepairRequestService.TERMINAL_STATUSES },
            updatedAt: { $gte: dateFrom, $lte: dateTo },
        });

        let completedCount = 0;
        let cancelledCount = 0;
        let refusedCount = 0;
        let refundedCount = 0;

        let totalMinutesSum = 0;
        let totalMinutesCount = 0;
        let activeWorkSum = 0;
        let activeWorkCount = 0;
        let assignmentSum = 0;
        let assignmentCount = 0;
        let responseSum = 0;
        let responseCount = 0;
        let travelSum = 0;
        let travelCount = 0;
        let repairSum = 0;
        let repairCount = 0;

        for (const req of requests) {
            switch (req.status) {
                case RepairRequestStatus.COMPLETED: completedCount++; break;
                case RepairRequestStatus.CANCELLED: cancelledCount++; break;
                case RepairRequestStatus.REFUSED: refusedCount++; break;
                case RepairRequestStatus.REFUNDED: refundedCount++; break;
            }

            const entries = req.statusTimestamps;
            if (!entries.length) continue;

            // Total wall-clock time (first entry to last entry)
            const firstTs = new Date(entries[0].timestamp).getTime();
            const lastTs = new Date(entries[entries.length - 1].timestamp).getTime();
            if (lastTs > firstTs) {
                totalMinutesSum += Math.round((lastTs - firstTs) / 60_000);
                totalMinutesCount++;
            }

            // Active work minutes (EN_ROUTE + IN_PROGRESS)
            const active = this.computeActiveWorkMinutes(req);
            if (active !== null) {
                activeWorkSum += active;
                activeWorkCount++;
            }

            // Time to assignment (PENDING/PAID → ASSIGNED)
            const toAssign = this.computeFirstTransitionMinutes(entries, RepairRequestStatus.PENDING, RepairRequestStatus.ASSIGNED)
                ?? this.computeFirstTransitionMinutes(entries, RepairRequestStatus.PAID, RepairRequestStatus.ASSIGNED);
            if (toAssign !== null) {
                assignmentSum += toAssign;
                assignmentCount++;
            }

            // Response time (ASSIGNED → ACCEPTED)
            const toAccept = this.computeFirstTransitionMinutes(entries, RepairRequestStatus.ASSIGNED, RepairRequestStatus.ACCEPTED);
            if (toAccept !== null) {
                responseSum += toAccept;
                responseCount++;
            }

            // Travel time (total in EN_ROUTE)
            const travel = this.computeStatusMinutes(entries, RepairRequestStatus.EN_ROUTE);
            if (travel > 0) { travelSum += travel; travelCount++; }

            // Repair time (total in IN_PROGRESS)
            const repair = this.computeStatusMinutes(entries, RepairRequestStatus.IN_PROGRESS);
            if (repair > 0) { repairSum += repair; repairCount++; }
        }

        return {
            dateFrom: dateFrom.toISOString().slice(0, 10),
            dateTo: dateTo.toISOString().slice(0, 10),
            totalTerminal: requests.length,
            completedCount,
            cancelledCount,
            refusedCount,
            refundedCount,
            avgTotalMinutes: totalMinutesCount > 0 ? Math.round(totalMinutesSum / totalMinutesCount) : 0,
            avgActiveWorkMinutes: activeWorkCount > 0 ? Math.round(activeWorkSum / activeWorkCount) : 0,
            avgAssignmentMinutes: assignmentCount > 0 ? Math.round(assignmentSum / assignmentCount) : 0,
            avgResponseMinutes: responseCount > 0 ? Math.round(responseSum / responseCount) : 0,
            avgTravelMinutes: travelCount > 0 ? Math.round(travelSum / travelCount) : 0,
            avgRepairMinutes: repairCount > 0 ? Math.round(repairSum / repairCount) : 0,
        };
    }
}
