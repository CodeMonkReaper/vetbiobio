import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import {
  AdminListSubmissionsDto,
  ApproveSubmissionDto,
  RejectSubmissionDto,
  UpdateSubmissionDto,
} from './dto/admin-submissions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUserId } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('admin')
export class AdminSubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Get('overview')
  overview() {
    return this.submissions.adminOverview();
  }

  @Get('submissions')
  list(@Query() q: AdminListSubmissionsDto) {
    return this.submissions.adminList(q);
  }

  @Get('submissions/:id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.submissions.adminGetById(id);
  }

  @Patch('submissions/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubmissionDto,
    @CurrentUserId() userId: number | null,
  ) {
    return this.submissions.adminUpdate(id, dto, userId);
  }

  @Post('submissions/:id/approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveSubmissionDto,
    @CurrentUserId() userId: number | null,
  ) {
    return this.submissions.adminApprove(id, dto, userId);
  }

  @Post('submissions/:id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectSubmissionDto,
    @CurrentUserId() userId: number | null,
  ) {
    return this.submissions.adminReject(id, dto, userId);
  }
}
