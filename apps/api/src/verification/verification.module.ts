import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuditModule, AuthModule], controllers: [VerificationController], providers: [VerificationService], exports: [VerificationService] })
export class VerificationModule {}
