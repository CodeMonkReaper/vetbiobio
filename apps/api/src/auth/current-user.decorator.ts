import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface SessionUser {
  sub: string;
  email: string;
  role: 'ADMIN' | 'EDITOR' | string;
}

// Usuario de la sesión admin (lo pone JwtAuthGuard en req.user).
// Uso: `@CurrentUser() user: SessionUser` o `@CurrentUserId() userId: number | null`.
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): SessionUser | null => {
  const req = ctx.switchToHttp().getRequest<{ user?: SessionUser }>();
  return req.user ?? null;
});

// Id numérico del actor para auditoría (null si no hay sesión).
export const CurrentUserId = createParamDecorator((_: unknown, ctx: ExecutionContext): number | null => {
  const req = ctx.switchToHttp().getRequest<{ user?: SessionUser }>();
  const n = Number(req.user?.sub);
  return Number.isFinite(n) && n > 0 ? n : null;
});
