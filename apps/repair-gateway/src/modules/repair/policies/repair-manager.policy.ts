import { Injectable } from '@nestjs/common';
import { AppErrors, msg } from '@asko/shared';
import { isAdmin, type Policy, type PolicyContext } from '@asko/authorization';
import { RepairClientService } from 'modules/repair-client/repair-client.service';

/**
 * Assert the user is the manager assigned to this repair request, or an admin.
 * Strict — does NOT accept the request creator or repairer.
 *
 * Replaces `RepairAccessService.assertManagerOwnership()`.
 */
@Injectable()
export class RepairManagerPolicy implements Policy {
    constructor(
        private readonly repairClient: RepairClientService,
    ) {}

    async authorize(ctx: PolicyContext): Promise<boolean> {
        if (isAdmin(ctx.user)) return true;

        const { request } = await this.repairClient.findById(ctx.params.id);
        if (request?.managerId && request.managerId !== ctx.user.sub) {
            throw AppErrors.forbidden({ key: msg.access.otherManagerOwns });
        }
        return true;
    }
}
