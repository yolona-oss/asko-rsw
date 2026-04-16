import { Injectable, Optional } from '@nestjs/common';
import { AppErrors, JwtPayload, Role } from '@asko/shared';
import { isAdmin } from '@asko/gateway-common';
import { MetricsService } from '@asko/observability';
import { RepairClientService } from './repair-client.service';
import { RepairerClientService } from './repairer-client.service';

/**
 * Ownership/participation assertions for repair-domain resources.
 *
 * All methods short-circuit for admins. Otherwise they verify the JWT user
 * is a legitimate participant of the target resource before allowing a
 * mutation (e.g. a file upload targeting that resource).
 *
 * Emits `access_assert_total{assertion, outcome}` when MetricsService is
 * registered in the host gateway. Outcome labels:
 *   `allow`     — check passed (includes admin short-circuit)
 *   `deny`      — user is authenticated but not a participant
 *   `not_found` — referenced resource doesn't exist
 *   `error`     — unexpected failure talking to downstream service
 */
@Injectable()
export class RepairAccessService {
    constructor(
        private readonly repairClient: RepairClientService,
        private readonly repairerClient: RepairerClientService,
        @Optional() private readonly metrics?: MetricsService,
    ) {}

    private record(assertion: string, outcome: 'allow' | 'deny' | 'not_found' | 'error'): void {
        this.metrics?.accessAssertTotal.inc({ assertion, outcome });
    }

    /** Assert the user is creator / assigned manager / assigned repairer of the request, or an admin. */
    async assertRepairRequestParticipant(user: JwtPayload, requestId: string): Promise<void> {
        const assertion = 'assertRepairRequestParticipant';
        if (isAdmin(user)) {
            this.record(assertion, 'allow');
            return;
        }

        try {
            const { request } = await this.repairClient.findById(requestId);
            if (!request) {
                this.record(assertion, 'not_found');
                throw AppErrors.notFound('Заявка не найдена');
            }

            if (user.roles.includes(Role.USER) && request.userId === user.sub) {
                this.record(assertion, 'allow');
                return;
            }
            if (user.roles.includes(Role.MANAGER) && request.managerId === user.sub) {
                this.record(assertion, 'allow');
                return;
            }
            if (user.roles.includes(Role.REPAIRER) && request.repairerId) {
                const { repairer } = await this.repairerClient.findByUserId(user.sub);
                if (repairer?.id === request.repairerId) {
                    this.record(assertion, 'allow');
                    return;
                }
            }

            this.record(assertion, 'deny');
            throw AppErrors.forbidden('Нет доступа к этой заявке');
        } catch (e) {
            // `throw` above already recorded; unexpected errors below.
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes('не найдена') || msg.includes('Нет доступа')) throw e;
            this.record(assertion, 'error');
            throw e;
        }
    }

    /** Assert the user is the review's author, or an admin. findUserReview throws if not found/owned. */
    async assertReviewOwner(user: JwtPayload, reviewId: string): Promise<void> {
        const assertion = 'assertReviewOwner';
        if (isAdmin(user)) {
            this.record(assertion, 'allow');
            return;
        }
        try {
            await this.repairerClient.findUserReview(user.sub, reviewId);
            this.record(assertion, 'allow');
        } catch (e) {
            // findUserReview returns NOT_FOUND for missing or unowned reviews —
            // conflate as 'deny' since they're indistinguishable and both mean
            // "the caller isn't this review's author".
            this.record(assertion, 'deny');
            throw e;
        }
    }

    /** Assert the user is a participant of the broken part's repair request, or an admin. */
    async assertBrokenPartAccess(user: JwtPayload, partId: string): Promise<void> {
        const assertion = 'assertBrokenPartAccess';
        if (isAdmin(user)) {
            this.record(assertion, 'allow');
            return;
        }
        const { part } = await this.repairClient.findBrokenPartById(partId);
        if (!part) {
            this.record(assertion, 'not_found');
            throw AppErrors.notFound('Запчасть не найдена');
        }
        // Delegate — its own metrics emission records the final outcome.
        await this.assertRepairRequestParticipant(user, part.repairRequestId);
    }

    /**
     * Assert the user is the manager assigned to this request, or an admin.
     * Strict — does NOT accept the request creator or repairer. Used by
     * manager-only mutations (assign, reassign, set-price, etc.).
     */
    async assertManagerOwnership(user: JwtPayload, requestId: string): Promise<void> {
        const assertion = 'assertManagerOwnership';
        if (isAdmin(user)) {
            this.record(assertion, 'allow');
            return;
        }
        const { request } = await this.repairClient.findById(requestId);
        if (request?.managerId && request.managerId !== user.sub) {
            this.record(assertion, 'deny');
            throw AppErrors.forbidden('Этой заявкой управляет другой менеджер');
        }
        this.record(assertion, 'allow');
    }
}
