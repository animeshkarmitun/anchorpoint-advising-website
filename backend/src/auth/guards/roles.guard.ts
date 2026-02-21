import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Role-Based Access Control guard.
 * Works with @Roles() decorator. If no roles are specified, the route is accessible to any authenticated user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true; // No role restriction
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            throw new ForbiddenException('No user found in request');
        }

        const hasRole = requiredRoles.includes(user.role);
        if (!hasRole) {
            throw new ForbiddenException(
                `Access denied. Required role: ${requiredRoles.join(' or ')}`,
            );
        }

        return true;
    }
}
