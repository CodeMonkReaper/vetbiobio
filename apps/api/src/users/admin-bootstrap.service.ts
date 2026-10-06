import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

// Crea el ADMIN inicial desde ADMIN_EMAIL/ADMIN_PASSWORD si no hay usuarios.
// Las credenciales viven solo en entorno, nunca en git.
@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly log = new Logger(AdminBootstrapService.name);
  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    const count = await this.prisma.user.count();
    if (count > 0) return;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password || password.length < 12) {
      this.log.warn('Sin usuarios y sin ADMIN_EMAIL/ADMIN_PASSWORD (>=12) en entorno: login admin deshabilitado.');
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.user.create({ data: { email: email.toLowerCase(), passwordHash, role: 'ADMIN' } });
    this.log.log(`Usuario ADMIN inicial creado: ${email.toLowerCase()}`);
  }
}
