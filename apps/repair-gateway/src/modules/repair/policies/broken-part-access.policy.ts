import { Injectable } from '@nestjs/common';
import { AppErrors } from '@asko/shared';
import { isAdmin, type Policy, type PolicyContext } from '@asko/authorization';
import { RepairClientService } from 'modules/repair-client/repair-client.service';
import { RepairParticipantPolicy } from './repair-participant.policy';

/**
 * Assert the user is a participant of the broken part's parent repair request,
 * or an admin.
 *
 * Replaces `RepairAccessService.assertBrokenPartAccess()`.
 * Delegates participant check to {@link RepairParticipantPolicy}.
 */
@Injectable()
export class BrokenPartAccessPolicy implements Policy {
    constructor(
        private readonly repairClient: RepairClientService,
        private readonly participantPolicy: RepairParticipantPolicy,
    ) {}

    async authorize(ctx: PolicyContext): Promise<boolean> {
        const partId = ctx.params.partId;
        if (isAdmin(ctx.user)) return true;

        const { part } = await this.repairClient.findBrokenPartById(partId);
        if (!part) throw AppErrors.notFound('Запчасть не найдена');

        return this.participantPolicy.authorize({
            ...ctx,
            params: { ...ctx.params, id: part.repairRequestId },
        });
    }
}
