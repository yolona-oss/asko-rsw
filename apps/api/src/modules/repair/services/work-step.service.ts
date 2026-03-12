import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { WorkStep, RepairRequest, Repairer } from 'entities';
import { AddWorkStepDto, UpdateWorkStepDto, WorkStepStatus, RepairRequestStatus } from '@asko/shared';
import { AppErrors } from 'common/error';

@Injectable()
export class WorkStepService {
    constructor(private readonly em: EntityManager) {}

    /** Repairer adds a work step to request */
    async addStep(repairerUserId: string, requestId: string, dto: AddWorkStepDto): Promise<WorkStep> {
        const repairer = await this.em.findOne(Repairer, { user: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

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

    /** Repairer updates a work step */
    async updateStep(repairerUserId: string, requestId: string, stepId: string, dto: UpdateWorkStepDto): Promise<WorkStep> {
        const repairer = await this.em.findOne(Repairer, { user: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        const step = await this.em.findOne(WorkStep, { id: stepId, repairRequest: requestId });
        if (!step) throw AppErrors.dbEntityNotFound('Work step not found');

        if (dto.title) step.title = dto.title;
        if (dto.description !== undefined) step.description = dto.description;
        if (dto.status) step.status = dto.status;

        await this.em.flush();
        return step;
    }

    /** Repairer completes a work step. If final step → request moves to AWAITING_COMPLETION */
    async completeStep(repairerUserId: string, requestId: string, stepId: string): Promise<{ step: WorkStep; requestCompleted: boolean }> {
        const repairer = await this.em.findOne(Repairer, { user: repairerUserId });
        if (!repairer) throw AppErrors.dbEntityNotFound('Repairer profile not found');

        const request = await this.em.findOne(RepairRequest, { id: requestId, repairer: repairer.id });
        if (!request) throw AppErrors.dbEntityNotFound('Repair request not found');

        const step = await this.em.findOne(WorkStep, { id: stepId, repairRequest: requestId });
        if (!step) throw AppErrors.dbEntityNotFound('Work step not found');

        step.status = WorkStepStatus.COMPLETED;

        let requestCompleted = false;

        if (step.isFinal) {
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
}
