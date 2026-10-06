import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import type { AdminRole } from '../users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = ctx.switchToHttp().getRequest<{ user?: any }>().user as { role?: AdminRole } | undefined;
    if (!user || !user.role || !required.includes(user.role)) {
      throw new ForbiddenException('Sin permiso');
    }
    return true;
  }
}
