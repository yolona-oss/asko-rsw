// Permissions
export { Permission } from './permissions/permission.enum.js';
export { ROLE_PERMISSIONS } from './permissions/role-permission-map.js';
export { resolvePermissions, hasPermission } from './permissions/resolve-permissions.js';
export { PERMISSIONS_KEY, Permissions } from './permissions/permission.decorator.js';
export { PermissionGuard } from './permissions/permission.guard.js';

// Policies
export type { Policy, PolicyContext } from './policies/policy.interface.js';
export { CHECK_POLICY_KEY, CheckPolicy } from './policies/check-policy.decorator.js';
export type { CheckPolicyOptions, CheckPolicyMetadata } from './policies/check-policy.decorator.js';
export { PolicyGuard } from './policies/policy.guard.js';

// Role-check utilities
export { isStaff, isAdmin, isSuperAdmin, isSelf, assertSelfOrStaff } from './utils/role-checks.js';

// Module
export { AuthorizationModule, AUTHORIZATION_METRICS } from './module/authorization.module.js';
