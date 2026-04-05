import { SetMetadata } from '@nestjs/common';
import { Role } from '@asko/shared';

export const ROLES_KEY = 'roles';
export const RequiredRoles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
