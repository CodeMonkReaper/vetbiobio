import { Module } from '@nestjs/common';
import { ClinicsController } from './clinics.controller';
import { AdminClinicsController } from './admin-clinics.controller';
import { ClinicsService } from './clinics.service';
import { ClinicsGeoRepository } from './clinics.geo.repository';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuditModule, AuthModule], controllers: [ClinicsController, AdminClinicsController], providers: [ClinicsService, ClinicsGeoRepository], exports: [ClinicsService] })
export class ClinicsModule {}
