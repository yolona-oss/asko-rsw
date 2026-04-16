import { Injectable } from '@nestjs/common';
import { AppErrors, JwtPayload, Role } from '@asko/shared';
import { isAdmin } from '@asko/gateway-common';
import { RepairClientService } from './repair-client.service';
import { RepairerClientService } from './repairer-client.service';

/**
 * Ownership/participation assertions for repair-domain resources.
 *
 * All methods short-circuit for admins. Otherwise they verify the JWT user
 * is a legitimate participant of the target resource before allowing a
 * mutation (e.g. a file upload targeting that resource).
 */
@Injectable()
export class RepairAccessService {
    constructor(
        private readonly repairClient: RepairClientService,
        private readonly repairerClient: RepairerClientService,
    ) {}

    /** Assert the user is creator / assigned manager / assigned repairer of the request, or an admin. */
    async assertRepairRequestParticipant(user: JwtPayload, requestId: string): Promise<void> {
        if (isAdmin(user)) return;

        const { request } = await this.repairClient.findById(requestId);
        if (!request) throw AppErrors.notFound('Заявка не найдена');

        if (user.roles.includes(Role.USER) && request.userId === user.sub) return;
        if (user.roles.includes(Role.MANAGER) && request.managerId === user.sub) return;
        if (user.roles.includes(Role.REPAIRER) && request.repairerId) {
            const { repairer } = await this.repairerClient.findByUserId(user.sub);
            if (repairer?.id === request.repairerId) return;
        }

        throw AppErrors.forbidden('Нет доступа к этой заявке');
    }

    /** Assert the user is the review's author, or an admin. findUserReview throws if not found/owned. */
    async assertReviewOwner(user: JwtPayload, reviewId: string): Promise<void> {
        if (isAdmin(user)) return;
        await this.repairerClient.findUserReview(user.sub, reviewId);
    }

    /** Assert the user is a participant of the broken part's repair request, or an admin. */
    async assertBrokenPartAccess(user: JwtPayload, partId: string): Promise<void> {
        if (isAdmin(user)) return;
        const { part } = await this.repairClient.findBrokenPartById(partId);
        if (!part) throw AppErrors.notFound('Запчасть не найдена');
        await this.assertRepairRequestParticipant(user, part.repairRequestId);
    }

    /**
     * Assert the user is the manager assigned to this request, or an admin.
     * Strict — does NOT accept the request creator or repairer. Used by
     * manager-only mutations (assign, reassign, set-price, etc.).
     */
    async assertManagerOwnership(user: JwtPayload, requestId: string): Promise<void> {
        if (isAdmin(user)) return;
        const { request } = await this.repairClient.findById(requestId);
        if (request?.managerId && request.managerId !== user.sub) {
            throw AppErrors.forbidden('Этой заявкой управляет другой менеджер');
        }
    }
}
