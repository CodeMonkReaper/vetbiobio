import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { ChangeStatusDto } from './dto/change-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('admin/verifications')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}
  @Post() change(@Body() dto: ChangeStatusDto) {
    return this.verification.changeStatus({ ...dto, entityId: dto.entityId });
  }
}
