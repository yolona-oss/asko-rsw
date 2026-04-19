// ─── Visibility Levels ─────────────────────────────────────────────────────

export enum FieldVisibility {
    PRIVATE = 'private',
    CONTACTS_ONLY = 'contacts',
    AUTHENTICATED = 'authenticated',
    SPECIFIC_ROLES = 'roles',
    PUBLIC = 'public',
}

// ─── Field Groups ──────────────────────────────────────────────────────────

export enum PrivacyFieldGroup {
    PROFILE = 'profile',
    EMAIL = 'email',
    PHONE = 'phone',
    ACTIVITY = 'activity',
    ROLES = 'roles',
    PROVIDERS = 'providers',
    SETTINGS = 'settings',
}

/** Maps each field group to the UserResponse field names it controls. */
export const FIELD_GROUP_MEMBERS: Readonly<Record<PrivacyFieldGroup, readonly string[]>> = {
    [PrivacyFieldGroup.PROFILE]:   ['firstName', 'lastName', 'middleName'],
    [PrivacyFieldGroup.EMAIL]:     ['email', 'emailVerified'],
    [PrivacyFieldGroup.PHONE]:     ['phone', 'phoneVerified'],
    [PrivacyFieldGroup.ACTIVITY]:  ['isActive', 'createdAt', 'updatedAt'],
    [PrivacyFieldGroup.ROLES]:     ['roles'],
    [PrivacyFieldGroup.PROVIDERS]: ['providers', 'googleId'],
    [PrivacyFieldGroup.SETTINGS]:  ['settings'],
};

/** All field names controlled by privacy groups (flat set for lookups). */
export const ALL_PRIVACY_FIELDS: ReadonlySet<string> = new Set(
    Object.values(FIELD_GROUP_MEMBERS).flat(),
);

// ─── Rule Interfaces ───────────────────────────────────────────────────────

export interface UserListRule {
    excludeUserIds?: string[];
    includeUserIds?: string[];
}

export interface FieldVisibilityRule extends UserListRule {
    visibility: FieldVisibility;
    allowedRoles?: string[];
}

export interface PrivacyRules {
    global?: UserListRule;
    groups: Partial<Record<PrivacyFieldGroup, FieldVisibilityRule>>;
    fields?: Partial<Record<string, FieldVisibilityRule>>;
}

// ─── Defaults ──────────────────────────────────────────────────────────────

export const DEFAULT_FIELD_VISIBILITY_RULE: Readonly<FieldVisibilityRule> = {
    visibility: FieldVisibility.AUTHENTICATED,
};
