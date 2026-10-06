import { Module } from '@nestjs/common';
import { PremiumService } from './premium.service';
import { PremiumController } from './premium.controller';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuditModule, AuthModule], controllers: [PremiumController], providers: [PremiumService], exports: [PremiumService] })
export class PremiumModule {}
