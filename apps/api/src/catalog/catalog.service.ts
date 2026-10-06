import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Catálogos públicos para filtros y navegación (api.md). Solo activos.
@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private list(model: 'service' | 'specialty' | 'exam'): Promise<Array<{ slug: string; name: string }>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = (this.prisma as any)[model];
    return delegate.findMany({
      where: { isActive: true },
      select: { slug: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async services() {
    return { data: await this.list('service') };
  }
  async specialties() {
    return { data: await this.list('specialty') };
  }
  async exams() {
    return { data: await this.list('exam') };
  }
}
