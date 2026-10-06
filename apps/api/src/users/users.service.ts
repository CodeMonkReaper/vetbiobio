import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// MVP: administración central (ADMIN/EDITOR). Sin registro público.
// password_hash con argon2/bcrypt (ver docs/security-privacy.md). Nunca loggear hash.
export type AdminRole = 'ADMIN' | 'EDITOR';

export interface AdminUser {
  id: bigint;
  email: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AdminUser | null> {
    const u = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!u) return null;
    if (u.role !== 'ADMIN' && u.role !== 'EDITOR') return null;
    return { id: u.id, email: u.email, passwordHash: u.passwordHash, role: u.role, isActive: u.isActive };
  }
}
