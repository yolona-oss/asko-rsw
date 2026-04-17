import { Injectable } from '@nestjs/common';
import { AppErrors, Role } from '@asko/shared';
import { isAdmin, type Policy, type PolicyContext } from '@asko/authorization';
import { RepairClientService } from 'modules/repair-client/repair-client.service';
import { RepairerClientService } from 'modules/repair-client/repairer-client.service';

/**
 * Assert the user is creator / assigned manager / assigned repairer
 * of the repair request, or an admin.
 *
 * Replaces `RepairAccessService.assertRepairRequestParticipant()`.
 */
@Injectable()
export class RepairParticipantPolicy implements Policy {
    constructor(
        private readonly repairClient: RepairClientService,
        private readonly repairerClient: RepairerClientService,
    ) {}

    async authorize(ctx: PolicyContext): Promise<boolean> {
        const requestId = ctx.params.id;
        if (isAdmin(ctx.user)) return true;

        const { request } = await this.repairClient.findById(requestId);
        if (!request) throw AppErrors.notFound('Заявка не найдена');

        if (ctx.user.roles.includes(Role.USER) && request.userId === ctx.user.sub) return true;
        if (ctx.user.roles.includes(Role.MANAGER) && request.managerId === ctx.user.sub) return true;
        if (ctx.user.roles.includes(Role.REPAIRER) && request.repairerId) {
            const { repairer } = await this.repairerClient.findByUserId(ctx.user.sub);
            if (repairer?.id === request.repairerId) return true;
        }

        throw AppErrors.forbidden('Нет доступа к этой заявке');
    }
}
