import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuditModule, AuthModule], controllers: [PricesController], providers: [PricesService], exports: [PricesService] })
export class PricesModule {}
