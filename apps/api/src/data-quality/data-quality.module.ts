import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ScoringService } from './scoring.service';
import { IncidentService } from './incident.service';
import { DataQualityService } from './data-quality.service';
import { DataQualitySchedulerService } from './data-quality-scheduler.service';
import {
  AdminDataQualityController,
  ClinicReliabilityController,
} from './data-quality.controller';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [AdminDataQualityController, ClinicReliabilityController],
  providers: [
    ScoringService,
    IncidentService,
    DataQualityService,
    DataQualitySchedulerService,
  ],
  exports: [DataQualityService, ScoringService, IncidentService],
})
export class DataQualityModule {}
