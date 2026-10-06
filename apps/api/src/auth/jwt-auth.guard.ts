import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Sesión vía cookie httpOnly `vetbiobio_admin` (la firma el login).
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cookies?: Record<string, any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user?: any;
    }>();
    const token = req.cookies?.['vetbiobio_admin'];
    if (!token) throw new UnauthorizedException('Sin sesión');
    try {
      req.user = this.jwt.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('Sesión inválida');
    }
  }
}
