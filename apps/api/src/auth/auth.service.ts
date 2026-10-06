import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

const COOKIE = 'vetbiobio_admin';

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService, private readonly jwt: JwtService) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    const token = await this.jwt.signAsync({ sub: String(user.id), email: user.email, role: user.role });
    return { token, user: { id: String(user.id), email: user.email, role: user.role } };
  }

  cookieFor(token: string, secure: boolean): string {
    // httpOnly + SameSite=Lax (localhost:3000↔3001 es same-site) + Secure en prod.
    return `${COOKIE}=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax${secure ? '; Secure' : ''}`;
  }

  static clearCookie(secure: boolean): string {
    return `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure ? '; Secure' : ''}`;
  }
}
