export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  DEALER = 'dealer',
  MANAGER = 'manager',
  USER = 'user',
}

export const ALL_ROLES = Object.values(Role);

export const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN] as const;

export const STAFF_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.DEALER,
  Role.MANAGER,
] as const;
