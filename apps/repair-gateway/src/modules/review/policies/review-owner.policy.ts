import { Injectable } from '@nestjs/common';
import { isAdmin, type Policy, type PolicyContext } from '@asko/authorization';
import { RepairerClientService } from 'modules/repair-client/repairer-client.service';

/**
 * Assert the user is the review's author, or an admin.
 *
 * Replaces `RepairAccessService.assertReviewOwner()`.
 * `findUserReview` throws NOT_FOUND for missing or unowned reviews.
 */
@Injectable()
export class ReviewOwnerPolicy implements Policy {
    constructor(
        private readonly repairerClient: RepairerClientService,
    ) {}

    async authorize(ctx: PolicyContext): Promise<boolean> {
        if (isAdmin(ctx.user)) return true;
        await this.repairerClient.findUserReview(ctx.user.sub, ctx.params.id);
        return true;
    }
}
