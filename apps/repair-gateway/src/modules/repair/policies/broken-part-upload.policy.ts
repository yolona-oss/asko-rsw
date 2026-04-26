import { Injectable } from '@nestjs/common';
import { AppErrors, RepairRequestStatus, Role, msg } from '@asko/shared';
import { isAdmin, type Policy, type PolicyContext } from '@asko/authorization';
import { RepairClientService } from 'modules/repair-client/repair-client.service';
import { RepairerClientService } from 'modules/repair-client/repairer-client.service';

const TERMINAL_STATUSES: string[] = [
    RepairRequestStatus.COMPLETED,
    RepairRequestStatus.CANCELLED,
    RepairRequestStatus.REFUNDED,
    RepairRequestStatus.REFUSED,
];

/**
 * Broken-part file upload policy:
 * - Admin: always allowed
 * - Assigned repairer: allowed while request not terminal
 * - Request creator (USER): allowed only for own suggestions while request is PENDING
 * - Manager: not allowed (view-only)
 */
@Injectable()
export class BrokenPartUploadPolicy implements Policy {
    constructor(
        private readonly repairClient: RepairClientService,
        private readonly repairerClient: RepairerClientService,
    ) {}

    async authorize(ctx: PolicyContext): Promise<boolean> {
        const partId = ctx.params.partId;
        if (isAdmin(ctx.user)) return true;

        const { part } = await this.repairClient.findBrokenPartById(partId);
        if (!part) throw AppErrors.notFound({ key: msg.access.partNotFound });

        const { request } = await this.repairClient.findById(part.repairRequestId);
        if (!request) throw AppErrors.notFound({ key: msg.access.requestNotFound });

        if (TERMINAL_STATUSES.includes(request.status)) {
            throw AppErrors.forbidden({ key: msg.brokenPart.cannotModifyCompleted });
        }

        // Assigned repairer can upload to any broken part
        if (ctx.user.roles.includes(Role.REPAIRER) && request.repairerId) {
            const { repairer } = await this.repairerClient.findByUserId(ctx.user.sub);
            if (repairer?.id === request.repairerId) return true;
        }

        // Request creator can upload to own suggestions only while request is PENDING
        if (
            ctx.user.roles.includes(Role.USER) &&
            request.userId === ctx.user.sub &&
            part.isSuggestion &&
            request.status === RepairRequestStatus.PENDING
        ) {
            return true;
        }

        throw AppErrors.forbidden({ key: msg.brokenPart.noAccess });
    }
}
