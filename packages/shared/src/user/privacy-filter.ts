import {
    FieldVisibility,
    PrivacyFieldGroup,
    FIELD_GROUP_MEMBERS,
    ALL_PRIVACY_FIELDS,
    DEFAULT_FIELD_VISIBILITY_RULE,
    type FieldVisibilityRule,
    type PrivacyRules,
} from './privacy.js';

import { ADMIN_ROLES } from './roles.type.js';

// ─── Evaluation Context ────────────────────────────────────────────────────

export interface PrivacyEvalContext {
    targetUserId: string;
    requesterId?: string;
    requesterRoles?: string[];
    isInternal?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function isInList(list: string[] | undefined, id: string | undefined): boolean {
    return !!id && !!list && list.length > 0 && list.includes(id);
}

function isAdmin(roles?: string[]): boolean {
    return !!roles && roles.some(r => ADMIN_ROLES.includes(r as any));
}

/**
 * Evaluate a single visibility rule against the requester.
 * Returns true if the requester satisfies the visibility level.
 */
function satisfiesVisibility(
    rule: FieldVisibilityRule,
    requesterId?: string,
    requesterRoles?: string[],
): boolean {
    switch (rule.visibility) {
        case FieldVisibility.PUBLIC:
            return true;
        case FieldVisibility.AUTHENTICATED:
            return !!requesterId;
        case FieldVisibility.SPECIFIC_ROLES:
            return !!requesterRoles && !!rule.allowedRoles &&
                requesterRoles.some(r => rule.allowedRoles!.includes(r));
        case FieldVisibility.CONTACTS_ONLY:
            // Future: implement contacts check. For now, deny.
            return false;
        case FieldVisibility.PRIVATE:
            return false;
        default:
            return false;
    }
}

/**
 * Evaluate a single field/group considering exception & inclusion lists.
 *
 * Returns true if the field should be visible to the requester.
 * Assumes global-level checks have already been handled by the caller.
 */
function evaluateRule(
    rule: FieldVisibilityRule | undefined,
    requesterId?: string,
    requesterRoles?: string[],
): boolean {
    const effective = rule ?? DEFAULT_FIELD_VISIBILITY_RULE;

    // Per-group/field exclude takes priority
    if (isInList(effective.excludeUserIds, requesterId)) return false;
    // Per-group/field include overrides visibility
    if (isInList(effective.includeUserIds, requesterId)) return true;

    return satisfiesVisibility(effective, requesterId, requesterRoles);
}

// ─── Main Resolver ─────────────────────────────────────────────────────────

/**
 * Resolves the set of user-response field names visible to the requester
 * given the target user's privacy rules.
 *
 * `id` is always included — it is the primary key.
 *
 * Bypass: owner, admin, internal → all fields.
 */
export function resolveVisibleFields(
    rules: PrivacyRules | null | undefined,
    ctx: PrivacyEvalContext,
): Set<string> {
    const visible = new Set<string>(['id']);

    const isOwner = !!ctx.requesterId && ctx.requesterId === ctx.targetUserId;

    // Full bypass: owner, admin, internal
    if (ctx.isInternal || isOwner || isAdmin(ctx.requesterRoles)) {
        for (const f of ALL_PRIVACY_FIELDS) visible.add(f);
        return visible;
    }

    const effectiveRules = rules ?? { groups: {} };

    // Global exception/inclusion check
    const globalRule = effectiveRules.global;
    if (globalRule) {
        if (isInList(globalRule.excludeUserIds, ctx.requesterId)) {
            return visible;
        }
        if (isInList(globalRule.includeUserIds, ctx.requesterId)) {
            for (const f of ALL_PRIVACY_FIELDS) visible.add(f);
            return visible;
        }
    }

    // Evaluate each group
    for (const group of Object.values(PrivacyFieldGroup)) {
        const groupRule = effectiveRules.groups[group];
        const groupAllowed = evaluateRule(groupRule, ctx.requesterId, ctx.requesterRoles);

        for (const field of FIELD_GROUP_MEMBERS[group]) {
            // Check per-field override
            const fieldOverride = effectiveRules.fields?.[field];
            if (fieldOverride) {
                if (evaluateRule(fieldOverride, ctx.requesterId, ctx.requesterRoles)) {
                    visible.add(field);
                }
            } else if (groupAllowed) {
                visible.add(field);
            }
        }
    }

    return visible;
}
