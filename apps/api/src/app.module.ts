import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ClinicsModule } from './clinics/clinics.module';
import { SearchModule } from './search/search.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { VerificationModule } from './verification/verification.module';
import { PricesModule } from './prices/prices.module';
import { ReportsModule } from './reports/reports.module';
import { EventsModule } from './events/events.module';
import { CommunesModule } from './communes/communes.module';
import { PremiumModule } from './premium/premium.module';
import { MediaModule } from './media/media.module';
import { CatalogModule } from './catalog/catalog.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { DataQualityModule } from './data-quality/data-quality.module';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    HealthModule, ClinicsModule, SearchModule, UsersModule, AuthModule, AuditModule, VerificationModule, PricesModule, ReportsModule, EventsModule, CommunesModule, PremiumModule, MediaModule, CatalogModule, SubmissionsModule, DataQualityModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
