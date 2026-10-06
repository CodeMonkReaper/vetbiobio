import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'VERIFY' | 'UNVERIFY' | 'DEACTIVATE' | 'PUBLISH';

// Toda escritura admin relevante pasa por aquí. Nunca loggear passwords/tokens.
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    userId?: bigint | number | null;
    action: AuditAction;
    entityType: string;
    entityId: bigint | number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oldValues?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newValues?: any;
    ip?: string | null;
  }) {
    if (!this.prisma) return null;
    return this.prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValues: input.oldValues ?? null,
        newValues: input.newValues ?? null,
        ipAddress: input.ip ?? null,
      },
    });
  }
}
