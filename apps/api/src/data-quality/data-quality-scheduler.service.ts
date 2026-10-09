import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { DataQualityTrigger } from '@prisma/client';
import { DataQualityService } from './data-quality.service';

@Injectable()
export class DataQualitySchedulerService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(DataQualitySchedulerService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly dataQualityService: DataQualityService) {}

  onApplicationBootstrap() {
    this.scheduleNextDailyRun();
  }

  onApplicationShutdown() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNextDailyRun() {
    // Programar para ejecutarse a las 03:00 AM (hora local)
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(3, 0, 0, 0);

    if (nextRun.getTime() <= now.getTime()) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const delayMs = nextRun.getTime() - now.getTime();
    this.logger.log(
      `Próxima corrida diaria del Motor de Calidad de Datos programada para: ${nextRun.toISOString()} (en ${(delayMs / 1000 / 60).toFixed(1)} min)`,
    );

    this.timer = setTimeout(async () => {
      try {
        this.logger.log('Iniciando corrida programada diaria del Motor de Calidad de Datos...');
        const result = await this.dataQualityService.runQualityEvaluation(
          DataQualityTrigger.SCHEDULED_CRON,
        );
        this.logger.log(
          `Corrida programada completada exitosamente: ${result.evaluatedClinics} clínicas evaluadas, ${result.openIssues} incidencias abiertas en ${result.durationMs}ms`,
        );
      } catch (err) {
        this.logger.error('Error durante la corrida programada del motor de calidad:', err);
      } finally {
        this.scheduleNextDailyRun();
      }
    }, delayMs);
  }
}
