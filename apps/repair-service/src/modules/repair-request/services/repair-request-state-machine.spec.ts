jest.mock('common/error', () => {
    class MockAppError extends Error {
        public errorCode: number;
        constructor(type: number, options?: { message?: string }) {
            super(options?.message ?? 'AppError');
            this.errorCode = type;
        }
    }
    return {
        AppErrors: {
            repairInvalidStatus: (msg?: string) => new MockAppError(1001, { message: msg }),
        },
    };
});

import { RepairRequestStatus } from '@asko/shared';
import {
    canTransition,
    assertTransition,
    assertActionTransition,
    REPAIR_TRANSITIONS,
    REPAIR_ACTION_TRANSITIONS,
} from './repair-request-state-machine';

const S = RepairRequestStatus;

const ALL_STATUSES = Object.values(RepairRequestStatus);

describe('repair-request-state-machine', () => {
    // ── canTransition ──

    describe('canTransition', () => {
        // --- ASSIGNED (notFrom rule) ---
        it.each([
            S.PENDING, S.ASSIGNED, S.ACCEPTED,
            S.IN_PROGRESS, S.PAUSED, S.REFUSED,
        ] as RepairRequestStatus[])('allows %s -> ASSIGNED', (from) => {
            expect(canTransition(from, S.ASSIGNED)).toBe(true);
        });

        it.each([
            S.CANCELLED, S.COMPLETED, S.AWAITING_COMPLETION,
            S.REFUND_REQUESTED, S.REFUNDED,
        ] as RepairRequestStatus[])('rejects %s -> ASSIGNED', (from) => {
            expect(canTransition(from, S.ASSIGNED)).toBe(false);
        });

        // --- ACCEPTED ---
        it('allows ASSIGNED -> ACCEPTED', () => {
            expect(canTransition(S.ASSIGNED, S.ACCEPTED)).toBe(true);
        });

        it.each(
            ALL_STATUSES.filter(s => s !== S.ASSIGNED),
        )('rejects %s -> ACCEPTED', (from) => {
            expect(canTransition(from, S.ACCEPTED)).toBe(false);
        });

        // --- EN_ROUTE ---
        it('allows ACCEPTED -> EN_ROUTE', () => {
            expect(canTransition(S.ACCEPTED, S.EN_ROUTE)).toBe(true);
        });

        it.each(
            ALL_STATUSES.filter(s => s !== S.ACCEPTED),
        )('rejects %s -> EN_ROUTE', (from) => {
            expect(canTransition(from, S.EN_ROUTE)).toBe(false);
        });

        // --- IN_PROGRESS ---
        it('allows EN_ROUTE -> IN_PROGRESS', () => {
            expect(canTransition(S.EN_ROUTE, S.IN_PROGRESS)).toBe(true);
        });

        it.each(
            ALL_STATUSES.filter(s => s !== S.EN_ROUTE),
        )('rejects %s -> IN_PROGRESS', (from) => {
            expect(canTransition(from, S.IN_PROGRESS)).toBe(false);
        });

        // --- PAUSED ---
        it.each([S.ACCEPTED, S.EN_ROUTE, S.IN_PROGRESS] as RepairRequestStatus[])('allows %s -> PAUSED', (from) => {
            expect(canTransition(from, S.PAUSED)).toBe(true);
        });

        it.each(
            ALL_STATUSES.filter(s => s !== S.ACCEPTED && s !== S.EN_ROUTE && s !== S.IN_PROGRESS),
        )('rejects %s -> PAUSED', (from) => {
            expect(canTransition(from, S.PAUSED)).toBe(false);
        });

        // --- AWAITING_COMPLETION ---
        it('allows IN_PROGRESS -> AWAITING_COMPLETION', () => {
            expect(canTransition(S.IN_PROGRESS, S.AWAITING_COMPLETION)).toBe(true);
        });

        it.each(
            ALL_STATUSES.filter(s => s !== S.IN_PROGRESS),
        )('rejects %s -> AWAITING_COMPLETION', (from) => {
            expect(canTransition(from, S.AWAITING_COMPLETION)).toBe(false);
        });

        // --- COMPLETED ---
        it.each([S.IN_PROGRESS, S.AWAITING_COMPLETION] as RepairRequestStatus[])('allows %s -> COMPLETED', (from) => {
            expect(canTransition(from, S.COMPLETED)).toBe(true);
        });

        it.each(
            ALL_STATUSES.filter(s => s !== S.IN_PROGRESS && s !== S.AWAITING_COMPLETION),
        )('rejects %s -> COMPLETED', (from) => {
            expect(canTransition(from, S.COMPLETED)).toBe(false);
        });

        // --- REFUND_REQUESTED (notFrom: REFUNDED, REFUND_REQUESTED, PENDING, CANCELLED, REFUSED) ---
        it.each([
            S.ASSIGNED, S.ACCEPTED, S.EN_ROUTE, S.IN_PROGRESS,
            S.PAUSED, S.AWAITING_COMPLETION, S.COMPLETED,
        ] as RepairRequestStatus[])('allows %s -> REFUND_REQUESTED', (from) => {
            expect(canTransition(from, S.REFUND_REQUESTED)).toBe(true);
        });

        it.each([
            S.REFUNDED, S.REFUND_REQUESTED, S.PENDING, S.CANCELLED, S.REFUSED,
        ] as RepairRequestStatus[])('rejects %s -> REFUND_REQUESTED', (from) => {
            expect(canTransition(from, S.REFUND_REQUESTED)).toBe(false);
        });

        // --- REFUNDED ---
        it('allows REFUND_REQUESTED -> REFUNDED', () => {
            expect(canTransition(S.REFUND_REQUESTED, S.REFUNDED)).toBe(true);
        });

        it.each(
            ALL_STATUSES.filter(s => s !== S.REFUND_REQUESTED),
        )('rejects %s -> REFUNDED', (from) => {
            expect(canTransition(from, S.REFUNDED)).toBe(false);
        });

        // --- CANCELLED (notFrom rule) ---
        it.each(
            ALL_STATUSES.filter(s => s !== S.COMPLETED && s !== S.EN_ROUTE && s !== S.IN_PROGRESS && s !== S.AWAITING_COMPLETION),
        )('allows %s -> CANCELLED', (from) => {
            expect(canTransition(from, S.CANCELLED)).toBe(true);
        });

        it.each([S.COMPLETED, S.EN_ROUTE, S.IN_PROGRESS, S.AWAITING_COMPLETION] as RepairRequestStatus[])('rejects %s -> CANCELLED', (from) => {
            expect(canTransition(from, S.CANCELLED)).toBe(false);
        });

        // --- Unknown target ---
        it('returns false for unknown target status', () => {
            expect(canTransition(S.PENDING, 'unknown' as any)).toBe(false);
        });
    });

    // ── assertTransition ──

    describe('assertTransition', () => {
        it('does not throw for valid transition', () => {
            expect(() => assertTransition(S.PENDING, S.ASSIGNED)).not.toThrow();
        });

        it('throws for invalid transition', () => {
            expect(() => assertTransition(S.COMPLETED, S.ASSIGNED)).toThrow(
                'Cannot transition from "completed" to "assigned"',
            );
        });

        it('throws for transition to unknown status', () => {
            expect(() => assertTransition(S.PENDING, 'unknown' as any)).toThrow();
        });
    });

    // ── assertActionTransition ──

    describe('assertActionTransition', () => {
        // --- refuse ---
        it('allows refuse from ASSIGNED', () => {
            expect(() => assertActionTransition('refuse', S.ASSIGNED)).not.toThrow();
        });

        it.each(
            ALL_STATUSES.filter(s => s !== S.ASSIGNED),
        )('rejects refuse from %s', (from) => {
            expect(() => assertActionTransition('refuse', from)).toThrow();
        });

        // --- denyRefund ---
        it('allows denyRefund from REFUND_REQUESTED', () => {
            expect(() => assertActionTransition('denyRefund', S.REFUND_REQUESTED)).not.toThrow();
        });

        it.each(
            ALL_STATUSES.filter(s => s !== S.REFUND_REQUESTED),
        )('rejects denyRefund from %s', (from) => {
            expect(() => assertActionTransition('denyRefund', from)).toThrow();
        });

        // --- cancelRefund ---
        it('allows cancelRefund from REFUND_REQUESTED', () => {
            expect(() => assertActionTransition('cancelRefund', S.REFUND_REQUESTED)).not.toThrow();
        });

        it.each(
            ALL_STATUSES.filter(s => s !== S.REFUND_REQUESTED),
        )('rejects cancelRefund from %s', (from) => {
            expect(() => assertActionTransition('cancelRefund', from)).toThrow();
        });

        // --- resume ---
        it('allows resume from PAUSED', () => {
            expect(() => assertActionTransition('resume', S.PAUSED)).not.toThrow();
        });

        it.each(
            ALL_STATUSES.filter(s => s !== S.PAUSED),
        )('rejects resume from %s', (from) => {
            expect(() => assertActionTransition('resume', from)).toThrow();
        });

        // --- reassign (notFrom rule) ---
        it.each([
            S.ASSIGNED, S.ACCEPTED, S.EN_ROUTE, S.IN_PROGRESS,
            S.AWAITING_COMPLETION, S.PAUSED, S.REFUSED,
        ] as RepairRequestStatus[])('allows reassign from %s', (from) => {
            expect(() => assertActionTransition('reassign', from)).not.toThrow();
        });

        it.each([
            S.PENDING, S.COMPLETED,
            S.CANCELLED, S.REFUNDED, S.REFUND_REQUESTED,
        ] as RepairRequestStatus[])('rejects reassign from %s', (from) => {
            expect(() => assertActionTransition('reassign', from)).toThrow();
        });

        // --- unknown action ---
        it('throws for unknown action', () => {
            expect(() => assertActionTransition('nonexistent' as any, S.PENDING)).toThrow(
                'Unknown action "nonexistent"',
            );
        });
    });

    // ── Exhaustive: every defined transition rule is reachable ──

    describe('transition rules completeness', () => {
        it('every target in REPAIR_TRANSITIONS maps to a valid RepairRequestStatus', () => {
            for (const target of Object.keys(REPAIR_TRANSITIONS)) {
                expect(ALL_STATUSES).toContain(target);
            }
        });

        it('every action in REPAIR_ACTION_TRANSITIONS has at least one allowed source', () => {
            for (const [, rule] of Object.entries(REPAIR_ACTION_TRANSITIONS)) {
                const hasAllowed = ALL_STATUSES.some(s => {
                    if (rule.from) return rule.from.includes(s);
                    if (rule.notFrom) return !rule.notFrom.includes(s);
                    return false;
                });
                expect(hasAllowed).toBe(true);
            }
        });

        it('REFUSED is not a target in REPAIR_TRANSITIONS (only reachable via refuse action)', () => {
            expect(REPAIR_TRANSITIONS[S.REFUSED]).toBeUndefined();
        });
    });
});
