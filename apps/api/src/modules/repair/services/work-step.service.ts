import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { WorkStep, RepairRequest, Repairer } from 'entities';
import { AddWorkStepDto, UpdateWorkStepDto, WorkStepStatus, RepairRequestStatus } from '@asko/shared';
import { AppErrors } from 'common/error';

const MIN_STEPS_TO_LOCK = 1;

@Injectable()
export class WorkStepService {
    constructor(private readonly em: EntityManager) {}

    /** Repairer adds a work step to request */
    async addStep(repairerUserId: string, requestId: string, dto: AddWorkStepDto): Promise<WorkStep> {
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
            order,
            isFinal: dto.isFinal ?? false,
        });
        await this.em.persistAndFlush(step);
        return step;
    }

    /** Repairer deletes a work step (only when not locked) */
    async deleteStep(repairerUserId: string, requestId: string, stepId: string): Promise<void> {
        const { request } = await this.resolveRepairerRequest(repairerUserId, requestId);

        if (request.stepsLocked) {
            throw AppErrors.badRequest('Шаги заблокированы для редактирования');
        }

        const step = await this.em.findOne(WorkStep, { id: stepId, repairRequest: requestId });
        if (!step) throw AppErrors.dbEntityNotFound('Work step not found');

        await this.em.removeAndFlush(step);
    }

    /** Repairer updates a work step */
    async updateStep(repairerUserId: string, requestId: string, stepId: string, dto: UpdateWorkStepDto): Promise<WorkStep> {
        const { request } = await this.resolveRepairerRequest(repairerUserId, requestId);

        const step = await this.em.findOne(WorkStep, { id: stepId, repairRequest: requestId });
        if (!step) throw AppErrors.dbEntityNotFound('Work step not found');

        if (request.stepsLocked) {
            // When locked, only status changes are allowed
            if (dto.title || dto.description !== undefined) {
                throw AppErrors.badRequest('Шаги заблокированы — можно менять только статус');
            }
        }

        if (dto.title) step.title = dto.title;
        if (dto.description !== undefined) step.description = dto.description;
        if (dto.status) step.status = dto.status;

        await this.em.flush();
        return step;
    }

    /** Repairer locks work steps — no more adding/editing/deleting */
    async lockSteps(repairerUserId: string, requestId: string): Promise<RepairRequest> {
        const { request } = await this.resolveRepairerRequest(repairerUserId, requestId);

        if (request.stepsLocked) {
            throw AppErrors.badRequest('Шаги уже заблокированы');
        }

        const stepCount = await this.em.count(WorkStep, { repairRequest: requestId });
        if (stepCount < MIN_STEPS_TO_LOCK) {
            throw AppErrors.badRequest(`Необходимо добавить минимум ${MIN_STEPS_TO_LOCK} шаг(ов) перед блокировкой`);
        }

        request.stepsLocked = true;
        await this.em.flush();
        return request;
    }

    /** Repairer completes a work step. If all steps done → request moves to AWAITING_COMPLETION */
    async completeStep(repairerUserId: string, requestId: string, stepId: string): Promise<{ step: WorkStep; requestCompleted: boolean }> {
        await this.resolveRepairerRequest(repairerUserId, requestId);

        const request = await this.em.findOne(RepairRequest, { id: requestId });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        const step = await this.em.findOne(WorkStep, { id: stepId, repairRequest: requestId });
        if (!step) throw AppErrors.dbEntityNotFound('Work step not found');

        step.status = WorkStepStatus.COMPLETED;

        let requestCompleted = false;

        // Check if all steps are now completed (or skipped)
        const allSteps = await this.em.find(WorkStep, { repairRequest: requestId });
        const allDone = allSteps.every(
            (s) => s.id === stepId || s.status === WorkStepStatus.COMPLETED || s.status === WorkStepStatus.SKIPPED,
        );

        if (allDone && request.stepsLocked) {
            request.status = RepairRequestStatus.AWAITING_COMPLETION;
            requestCompleted = true;
        } else if (step.isFinal) {
            request.status = RepairRequestStatus.AWAITING_COMPLETION;
            requestCompleted = true;
        }

        await this.em.flush();
        return { step, requestCompleted };
    }

    /** Get all steps for a request */
    async getSteps(requestId: string): Promise<WorkStep[]> {
        return this.em.find(WorkStep, { repairRequest: requestId }, { orderBy: { order: 'ASC' } });
    }

    /** Resolve repairer + request, reusable across methods */
    private async resolveRepairerRequest(repairerUserId: string, requestId: string) {
        const repairer = await this.em.findOne(Repairer, { user: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        return { repairer, request };
    }
}
