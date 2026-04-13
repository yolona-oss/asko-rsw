import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { WorkStep } from 'entities/work-step.entity';
import { RepairRequest } from 'entities/repair-request.entity';
import { Repairer } from 'entities/repairer.entity';
import { WorkStepStatus, RepairRequestStatus } from '@asko/shared';
import { AppErrors } from 'common/error';
import { RepairRequestService } from './repair-request.service';
import { RepairEventService, RepairEventType } from 'modules/repair-event.service';

const MIN_STEPS_TO_LOCK = 1;

const TERMINAL_REPAIR_STATUSES: readonly RepairRequestStatus[] = [
    RepairRequestStatus.COMPLETED,
    RepairRequestStatus.CANCELLED,
    RepairRequestStatus.REFUNDED,
];

@Injectable()
export class WorkStepService {
    constructor(
        private readonly em: EntityManager,
        private readonly repairRequestService: RepairRequestService,
        private readonly repairEventService: RepairEventService,
    ) {}

    /** Repairer adds a work step to request */
    @CreateRequestContext()
    async addStep(repairerUserId: string, requestId: string, dto: { title: string; description?: string; comment?: string; order?: number; isMandatory?: boolean }): Promise<WorkStep> {
        const { request } = await this.resolveRepairerRequest(repairerUserId, requestId);

        if (request.stepsLocked) {
            throw AppErrors.badRequest('Шаги заблокированы для редактирования');
        }

        if (![RepairRequestStatus.ACCEPTED, RepairRequestStatus.IN_PROGRESS].includes(request.status)) {
            throw AppErrors.badRequest('Cannot add steps in current request status');
        }

        // Auto-calculate order if not provided
        const existingSteps = await this.em.count(WorkStep, { repairRequest: requestId });
        const order = dto.order ?? existingSteps + 1;

        const step = this.em.create(WorkStep, {
            repairRequest: request,
            title: dto.title,
            description: dto.description,
            comment: dto.comment,
            order,
            isFinal: false,
            isMandatory: dto.isMandatory ?? false,
        });
        await this.em.persistAndFlush(step);
        return step;
    }

    /** Repairer deletes a work step (only when not locked and not mandatory) */
    @CreateRequestContext()
    async deleteStep(repairerUserId: string, requestId: string, stepId: string): Promise<void> {
        const { request } = await this.resolveRepairerRequest(repairerUserId, requestId);

        if (request.stepsLocked) {
            throw AppErrors.badRequest('Шаги заблокированы для редактирования');
        }

        const step = await this.em.findOne(WorkStep, { id: stepId, repairRequest: requestId });
        if (!step) throw AppErrors.dbEntityNotFound('Work step not found');

        if (step.isMandatory) {
            throw AppErrors.badRequest('Обязательный шаг нельзя удалить');
        }

        await this.em.removeAndFlush(step);
    }

    /** Repairer updates a work step */
    @CreateRequestContext()
    async updateStep(repairerUserId: string, requestId: string, stepId: string, dto: { title?: string; description?: string; comment?: string; status?: string }): Promise<WorkStep> {
        const { request } = await this.resolveRepairerRequest(repairerUserId, requestId);

        const step = await this.em.findOne(WorkStep, { id: stepId, repairRequest: requestId });
        if (!step) throw AppErrors.dbEntityNotFound('Work step not found');

        if (step.isMandatory && dto.title && dto.title !== step.title) {
            throw AppErrors.badRequest('Нельзя менять название обязательного шага');
        }

        if (request.stepsLocked) {
            // When locked, only status + comment changes are allowed. Mandatory steps always accept comment updates.
            if (dto.title || dto.description !== undefined) {
                throw AppErrors.badRequest('Шаги заблокированы - можно менять только статус');
            }
        }

        if (dto.title) step.title = dto.title;
        if (dto.description !== undefined) step.description = dto.description;
        if (dto.comment !== undefined) step.comment = dto.comment;
        if (dto.status) step.status = dto.status as WorkStepStatus;

        await this.em.flush();
        return step;
    }

    /** New repairer approves the previous diagnostics — take ownership of completed mandatory steps */
    @CreateRequestContext()
    async approveDiagnostics(repairerUserId: string, requestId: string): Promise<void> {
        const { repairer, request } = await this.resolveRepairerRequest(repairerUserId, requestId);

        if (TERMINAL_REPAIR_STATUSES.includes(request.status)) {
            throw AppErrors.badRequest('Нельзя подтвердить диагностику в завершённом статусе');
        }

        const mandatorySteps = await this.em.find(WorkStep, { repairRequest: requestId, isMandatory: true });
        if (mandatorySteps.length === 0) {
            throw AppErrors.badRequest('Нет обязательных шагов для подтверждения');
        }

        for (const step of mandatorySteps) {
            if (step.status === WorkStepStatus.COMPLETED) {
                step.completedByRepairerId = repairer.id;
            }
        }

        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.DIAGNOSTICS_APPROVED,
            repairId: request.id,
            userId: request.userId,
            repairerId: repairer.id,
            timestamp: new Date(),
        });
    }

    /** New repairer declines the previous diagnostics — mark old mandatory steps as declined history, wipe non-mandatory, reseed fresh pair */
    @CreateRequestContext()
    async declineDiagnostics(repairerUserId: string, requestId: string, reason?: string): Promise<WorkStep[]> {
        const { repairer, request } = await this.resolveRepairerRequest(repairerUserId, requestId);

        if (TERMINAL_REPAIR_STATUSES.includes(request.status)) {
            throw AppErrors.badRequest('Нельзя отклонить диагностику в завершённом статусе');
        }

        const allSteps = await this.em.find(WorkStep, { repairRequest: requestId }, { orderBy: { order: 'ASC' } });
        const mandatorySteps = allSteps.filter((s) => s.isMandatory && s.status !== WorkStepStatus.DECLINED);
        if (mandatorySteps.length === 0) {
            throw AppErrors.badRequest('Нет обязательных шагов для отклонения');
        }

        const now = new Date();

        // Mark current mandatory steps as declined (history)
        for (const step of mandatorySteps) {
            step.status = WorkStepStatus.DECLINED;
            step.declinedAt = now;
            step.declinedByRepairerId = repairer.id;
        }

        // Delete all non-mandatory steps
        const nonMandatory = allSteps.filter((s) => !s.isMandatory);
        for (const step of nonMandatory) {
            this.em.remove(step);
        }

        // Reseed fresh mandatory pair with orders after the declined history block
        const maxOrder = allSteps.reduce((m, s) => Math.max(m, s.order), 0);
        const newFirst = this.em.create(WorkStep, {
            repairRequest: request,
            title: 'Диагностика',
            order: maxOrder + 1,
            isMandatory: true,
        });
        const newSecond = this.em.create(WorkStep, {
            repairRequest: request,
            title: 'Результат диагностики',
            order: maxOrder + 2,
            isMandatory: true,
        });

        request.stepsLocked = false;

        await this.em.flush();

        await this.repairEventService.emit({
            type: RepairEventType.DIAGNOSTICS_DECLINED,
            repairId: request.id,
            userId: request.userId,
            repairerId: repairer.id,
            reason,
            timestamp: now,
        });

        return [newFirst, newSecond];
    }

    /** Repairer locks work steps - no more adding/editing/deleting. The last step (by order) is auto-marked as final. */
    @CreateRequestContext()
    async lockSteps(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const { request } = await this.resolveRepairerRequest(repairerUserId, requestId);

        if (request.stepsLocked) {
            throw AppErrors.badRequest('Шаги уже заблокированы');
        }

        const steps = await this.em.find(WorkStep, { repairRequest: requestId }, { orderBy: { order: 'DESC' } });
        if (steps.length < MIN_STEPS_TO_LOCK) {
            throw AppErrors.badRequest(`Необходимо добавить минимум ${MIN_STEPS_TO_LOCK} шаг(ов) перед блокировкой`);
        }

        // Auto-mark the last step as final
        for (const step of steps) {
            step.isFinal = false;
        }
        steps[0].isFinal = true;

        request.stepsLocked = true;
        await this.em.flush();
        return request;
    }

    /** Repairer completes a work step. If all steps done -> request moves to AWAITING_COMPLETION */
    @CreateRequestContext()
    async completeStep(repairerUserId: string, requestId: string, stepId: string): Promise<{ step: WorkStep; requestCompleted: boolean }> {
        const { repairer, request } = await this.resolveRepairerRequest(repairerUserId, requestId);

        const step = await this.em.findOne(WorkStep, { id: stepId, repairRequest: requestId });
        if (!step) throw AppErrors.dbEntityNotFound('Work step not found');

        step.status = WorkStepStatus.COMPLETED;
        step.completedByRepairerId = repairer.id;

        let requestCompleted = false;

        // Check if all steps are now completed (or skipped)
        const allSteps = await this.em.find(WorkStep, { repairRequest: requestId });
        const allDone = allSteps.every(
            (s) => s.id === stepId || s.status === WorkStepStatus.COMPLETED || s.status === WorkStepStatus.SKIPPED,
        );

        if (allDone && request.stepsLocked) {
            await this.repairRequestService.markAwaitingCompletion(requestId);
            requestCompleted = true;
        } else if (step.isFinal) {
            await this.repairRequestService.markAwaitingCompletion(requestId);
            requestCompleted = true;
        }

        await this.em.flush();
        return { step, requestCompleted };
    }

    /** Get all steps for a request */
    @CreateRequestContext()
    async getSteps(requestId: string): Promise<WorkStep[]> {
        return this.em.find(WorkStep, { repairRequest: requestId }, { orderBy: { order: 'ASC' } });
    }

    /** Resolve repairer + request directly via EntityManager */
    private async resolveRepairerRequest(repairerUserId: string, requestId: string) {
        const repairer = await this.em.findOne(Repairer, { userId: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        return { repairer, request };
    }
}
