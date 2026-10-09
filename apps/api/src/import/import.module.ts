import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DataQualityModule } from '../data-quality/data-quality.module';
import { ImportParserService } from './import-parser.service';
import { DeduplicationService } from './deduplication.service';
import { ImportWorkerService } from './import-worker.service';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, DataQualityModule],
  controllers: [ImportController],
  providers: [
    ImportParserService,
    DeduplicationService,
    ImportWorkerService,
    ImportService,
  ],
  exports: [ImportService, DeduplicationService],
})
export class ImportModule {}
