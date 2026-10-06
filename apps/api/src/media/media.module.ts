import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuditModule, AuthModule], controllers: [MediaController], providers: [MediaService], exports: [MediaService] })
export class MediaModule {}
