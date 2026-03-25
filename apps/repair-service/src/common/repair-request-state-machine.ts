import { RepairRequestStatus } from '@asko/shared';
import { AppErrors } from 'common/error';

type Status = RepairRequestStatus;
const S = RepairRequestStatus;

type TransitionRule =
    | { from: readonly Status[]; notFrom?: never }
    | { from?: never; notFrom: readonly Status[] };

export const REPAIR_TRANSITIONS: Record<string, TransitionRule> = {
    [S.PAID]:                { from: [S.PENDING] },
    [S.ASSIGNED]:            { from: [S.PENDING, S.PAID] },
    [S.ACCEPTED]:            { from: [S.ASSIGNED] },
    [S.IN_PROGRESS]:         { from: [S.ACCEPTED] },
    [S.PAUSED]:              { from: [S.ACCEPTED, S.IN_PROGRESS] },
    [S.AWAITING_COMPLETION]: { from: [S.IN_PROGRESS, S.ACCEPTED] },
    [S.COMPLETED]:           { from: [S.IN_PROGRESS, S.AWAITING_COMPLETION] },
    [S.REFUND_REQUESTED]:    { notFrom: [S.COMPLETED, S.REFUNDED] },
    [S.REFUNDED]:            { from: [S.REFUND_REQUESTED] },
    [S.CANCELLED]:           { notFrom: [S.COMPLETED, S.IN_PROGRESS, S.AWAITING_COMPLETION] },
};

export const REPAIR_ACTION_TRANSITIONS = {
    refuse:     { from: [S.ASSIGNED] as readonly Status[], to: S.PAID },
    denyRefund: { from: [S.REFUND_REQUESTED] as readonly Status[], to: S.PAID },
    resume:     { from: [S.PAUSED] as readonly Status[] },
    reassign:   { from: [S.ACCEPTED, S.PAUSED] as readonly Status[], to: S.ASSIGNED },
} as const;

export function canTransition(currentStatus: Status, targetStatus: Status): boolean {
    const rule = REPAIR_TRANSITIONS[targetStatus];
    if (!rule) return false;
    if (rule.from) return rule.from.includes(currentStatus);
    if (rule.notFrom) return !rule.notFrom.includes(currentStatus);
    return false;
}

export function assertTransition(currentStatus: Status, targetStatus: Status): void {
    if (!canTransition(currentStatus, targetStatus)) {
        throw AppErrors.repairInvalidStatus(
            `Cannot transition from "${currentStatus}" to "${targetStatus}"`,
        );
    }
}

export function assertActionTransition(
    action: keyof typeof REPAIR_ACTION_TRANSITIONS,
    currentStatus: Status,
): void {
    const rule = REPAIR_ACTION_TRANSITIONS[action];
    if (!rule.from.includes(currentStatus)) {
        throw AppErrors.repairInvalidStatus(
            `Cannot perform "${action}" from status "${currentStatus}"`,
        );
    }
}
