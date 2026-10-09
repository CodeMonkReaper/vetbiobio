import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const startTime = Date.now();
    try {
      // 1. Verificar conectividad y latencia a PostgreSQL
      await this.prisma.$queryRawUnsafe('SELECT 1');
      const latencyMs = Date.now() - startTime;

      // 2. Verificar extensión PostGIS y versión activa
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const postgisRows: any[] = await this.prisma.$queryRawUnsafe(
        'SELECT PostGIS_Version() AS version',
      );
      const postgisVersion = postgisRows[0]?.version ?? 'available';

      const mem = process.memoryUsage();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: 'connected',
          latencyMs,
          engine: 'PostgreSQL 16',
        },
        postgis: {
          status: 'ready',
          version: postgisVersion,
        },
        memory: {
          rssMb: Math.round(mem.rss / 1024 / 1024),
          heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        },
      };
    } catch (err: any) {
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: err.message,
        },
      });
    }
  }
}
