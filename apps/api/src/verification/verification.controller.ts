import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { ChangeStatusDto } from './dto/change-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUserId } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('admin/verifications')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}
  // changed_by (verification_log) + audit_log registran al verificador real.
  @Post() change(@Body() dto: ChangeStatusDto, @CurrentUserId() userId: number | null) {
    return this.verification.changeStatus({ ...dto, entityId: dto.entityId, userId });
  }
}
