import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles can access an endpoint.
 * Usage: @Roles(Role.SUPER_ADMIN, Role.TAX_ADVISOR)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
